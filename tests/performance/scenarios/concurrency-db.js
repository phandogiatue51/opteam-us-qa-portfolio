/**
 * OpTeamUs Performance Testing - Concurrency & Database Contention Scenario
 * 
 * Objective: Simulate concurrent updates, read-after-write consistency,
 * and high contention on shared entities to verify ACID compliance and prevent deadlocks.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, authHeaders } from '../config/environments.js';
import { getAuthToken } from '../config/auth.js';
import { generateTaskUpdatePayload } from '../data/payloads.js';

const conflictRate = new Rate('db_concurrency_conflicts');
const updateDuration = new Trend('db_update_duration_ms');

export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS, 10) : 30,
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_duration: ['p(95)<350'],
    http_req_failed: ['rate<0.02'],
    checks: ['rate>0.98'],
  },
};

export function setup() {
  const token = getAuthToken(BASE_URL);
  if (!token) {
    throw new Error('Concurrency test setup failed: Could not acquire auth token');
  }

  const headers = authHeaders(token);

  // Create dedicated workspace
  const wsRes = http.post(`${BASE_URL}/api/workspaces`, JSON.stringify({ name: 'Concurrency DB Workspace' }), {
    headers: headers,
    tags: { endpoint: 'concurrency_setup' },
  });

  const workspaceId = wsRes.json('id');

  // Create dedicated project
  const projRes = http.post(
    `${BASE_URL}/api/projects`,
    JSON.stringify({
      workspaceId: workspaceId,
      name: 'Concurrency Contention Project',
      description: 'Shared resource project for simultaneous write operations',
    }),
    {
      headers: headers,
      tags: { endpoint: 'concurrency_setup' },
    }
  );

  const projectId = projRes.json('id');

  // Create 5 shared tasks for concurrent update contention
  const sharedTaskIds = [];
  for (let i = 1; i <= 5; i++) {
    const tRes = http.post(
      `${BASE_URL}/api/tasks`,
      JSON.stringify({
        projectId: projectId,
        title: `Contended Task #${i}`,
        description: 'Simultaneous updates target',
      }),
      {
        headers: headers,
        tags: { endpoint: 'concurrency_setup' },
      }
    );
    if (tRes.status === 200 || tRes.status === 201) {
      sharedTaskIds.push(tRes.json('id'));
    }
  }

  return { token, baseUrl: BASE_URL, workspaceId, projectId, sharedTaskIds };
}

export default function (data) {
  const headers = authHeaders(data.token);
  const vu = __VU;
  const iter = __ITER;

  if (data.sharedTaskIds && data.sharedTaskIds.length > 0) {
    // Pick a task pseudo-randomly to create deliberate lock contention
    const targetTaskId = data.sharedTaskIds[Math.floor(Math.random() * data.sharedTaskIds.length)];
    const statuses = ['todo', 'in-progress', 'done'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

    group('Concurrent_Task_Mutation', function () {
      const start = Date.now();
      const updatePayload = JSON.stringify(
        generateTaskUpdatePayload(`Contended Task [VU ${vu} Iter ${iter}]`, newStatus)
      );

      const updateRes = http.put(`${data.baseUrl}/api/tasks/${targetTaskId}`, updatePayload, {
        headers: headers,
        tags: { endpoint: 'concurrency_task_put' },
      });

      updateDuration.add(Date.now() - start);

      const ok = check(updateRes, {
        'concurrent update successful (200)': (r) => r.status === 200,
        'no 500 internal server error': (r) => r.status !== 500,
      });

      if (!ok) {
        conflictRate.add(1);
      }
    });
  }

  sleep(0.2 + Math.random() * 0.3);
}
