/**
 * OpTeamUs Performance Testing - Stress Test Scenario
 * 
 * Objective: Push system beyond normal operating capacity (up to 200 Virtual Users)
 * to determine saturation breaking point, recovery behavior, and degradation limits.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, authHeaders } from '../config/environments.js';
import { getAuthToken } from '../config/auth.js';
import { generateTaskPayload } from '../data/payloads.js';

const stressFailureRate = new Rate('stress_failures');
const taskCreationLatency = new Trend('stress_task_create_ms');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Normal load
    { duration: '1m', target: 100 },  // Heavy load
    { duration: '1m', target: 200 },  // Stress load (breaking point)
    { duration: '1m', target: 200 },  // Sustained stress
    { duration: '30s', target: 0 },   // Recovery ramp-down
  ],
  thresholds: {
    // Under stress, allow higher latency before failing the suite
    http_req_duration: ['p(95)<1000', 'p(99)<2500'],
    http_req_failed: ['rate<0.05'], // Allow up to 5% failures during maximum stress
  },
};

export function setup() {
  const token = getAuthToken(BASE_URL);
  if (!token) {
    throw new Error('Stress test setup failed: Could not acquire auth token');
  }

  const headers = authHeaders(token);

  // Setup dedicated workspace & project for stress load
  const wsRes = http.post(`${BASE_URL}/api/workspaces`, JSON.stringify({ name: 'Stress Test Workspace' }), {
    headers: headers,
    tags: { endpoint: 'stress_setup' },
  });

  const workspaceId = wsRes.status === 200 || wsRes.status === 201 ? wsRes.json('id') : null;

  let projectId = null;
  if (workspaceId) {
    const projRes = http.post(
      `${BASE_URL}/api/projects`,
      JSON.stringify({
        workspaceId: workspaceId,
        name: 'Stress Test Project',
        description: 'Target project for high-concurrency stress testing',
      }),
      {
        headers: headers,
        tags: { endpoint: 'stress_setup' },
      }
    );

    if (projRes.status === 200 || projRes.status === 201) {
      projectId = projRes.json('id');
    }
  }

  return { token, baseUrl: BASE_URL, workspaceId, projectId };
}

export default function (data) {
  const headers = authHeaders(data.token);
  const vu = __VU;
  const iter = __ITER;

  group('Stress_Flow', function () {
    // High-concurrency task querying
    if (data.projectId) {
      const listRes = http.get(`${data.baseUrl}/api/tasks/project/${data.projectId}`, {
        headers: headers,
        tags: { endpoint: 'stress_list' },
      });

      const listOk = check(listRes, {
        'tasks list responded': (r) => r.status === 200,
      });

      if (!listOk) stressFailureRate.add(1);

      // Concurrent task creation
      const start = Date.now();
      const taskPayload = JSON.stringify(generateTaskPayload(data.projectId, vu, iter));
      const createRes = http.post(`${data.baseUrl}/api/tasks`, taskPayload, {
        headers: headers,
        tags: { endpoint: 'stress_create' },
      });

      const createOk = check(createRes, {
        'stress task created': (r) => r.status === 200 || r.status === 201,
      });

      taskCreationLatency.add(Date.now() - start);

      if (!createOk) {
        stressFailureRate.add(1);
      }
    }
  });

  sleep(0.3 + Math.random() * 0.7);
}
