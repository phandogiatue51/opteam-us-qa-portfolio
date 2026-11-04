/**
 * OpTeamUs Performance Testing - Load Test Scenario
 * 
 * Objective: Ramp up to normal expected peak (50-100 Virtual Users)
 * to evaluate steady-state throughput, system concurrency, and response latencies.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, authHeaders, DEFAULT_HEADERS } from '../config/environments.js';
import { loadThresholds } from '../config/thresholds.js';
import { getAuthToken } from '../config/auth.js';
import {
  generateWorkspacePayload,
  generateProjectPayload,
  generateTaskPayload,
  generateTaskUpdatePayload,
} from '../data/payloads.js';

// Custom metric trends for observability
const readLatency = new Trend('read_ops_duration');
const writeLatency = new Trend('write_ops_duration');
const txCounter = new Counter('total_business_transactions');
const customFailureRate = new Rate('load_failures');

const targetPeak = __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS, 10) : 50;

// Configurable stages: full benchmark vs quick validation
export const options = __ENV.QUICK_RUN === 'true'
  ? {
      stages: [
        { duration: '10s', target: Math.min(10, targetPeak) },
        { duration: '15s', target: targetPeak },
        { duration: '10s', target: 0 },
      ],
      thresholds: loadThresholds,
    }
  : {
      stages: [
        { duration: '30s', target: Math.floor(targetPeak / 2) }, // Ramp-up to half capacity
        { duration: '1m', target: targetPeak },                  // Ramp-up to expected peak (50-100 VUs)
        { duration: '2m', target: targetPeak },                  // Steady-state peak load
        { duration: '30s', target: 0 },                          // Graceful ramp-down
      ],
      thresholds: loadThresholds,
    };

/**
 * Setup lifecycle hook:
 * Pre-warms authentication and creates a shared baseline workspace & project
 * so concurrent read VUs have persistent data to query.
 */
export function setup() {
  const token = getAuthToken(BASE_URL);
  if (!token) {
    throw new Error('Load test setup failed: Could not acquire auth token');
  }

  const headers = authHeaders(token);

  // Pre-seed baseline workspace
  const wsRes = http.post(`${BASE_URL}/api/workspaces`, JSON.stringify({ name: 'Baseline Load Workspace' }), {
    headers: headers,
    tags: { endpoint: 'setup_seed' },
  });

  let workspaceId = null;
  if (wsRes.status === 200 || wsRes.status === 201) {
    workspaceId = wsRes.json('id');
  }

  // Pre-seed baseline project
  let projectId = null;
  if (workspaceId) {
    const projRes = http.post(
      `${BASE_URL}/api/projects`,
      JSON.stringify({
        workspaceId: workspaceId,
        name: 'Baseline Load Project',
        description: 'Persistent baseline project for concurrent load iterations',
      }),
      {
        headers: headers,
        tags: { endpoint: 'setup_seed' },
      }
    );

    if (projRes.status === 200 || projRes.status === 201) {
      projectId = projRes.json('id');
    }
  }

  // Pre-seed 3 baseline tasks
  if (projectId) {
    for (let i = 1; i <= 3; i++) {
      http.post(
        `${BASE_URL}/api/tasks`,
        JSON.stringify({
          projectId: projectId,
          title: `Baseline Seed Task #${i}`,
          description: 'Seeded task for concurrent read queries',
        }),
        {
          headers: headers,
          tags: { endpoint: 'setup_seed' },
        }
      );
    }
  }

  return {
    token,
    baseUrl: BASE_URL,
    workspaceId,
    projectId,
  };
}

/**
 * Main VU iteration simulating realistic user distribution:
 * ~75% Read / Query operations
 * ~25% Write / Mutation operations
 */
export default function (data) {
  const token = data.token;
  const baseUrl = data.baseUrl;
  const headers = authHeaders(token);
  const vu = __VU;
  const iter = __ITER;

  // Decide user action based on weighted probability
  const rand = Math.random();

  if (rand < 0.75) {
    // -------------------------------------------------------------
    // READ WORKLOAD (~75% of traffic): Dashboard, Lists, Profile
    // -------------------------------------------------------------
    group('Read_Flow', function () {
      const readStart = Date.now();

      // 1. Profile check
      const profileRes = http.get(`${baseUrl}/auth/me`, {
        headers: headers,
        tags: { endpoint: 'auth_me' },
      });
      const pOk = check(profileRes, {
        'profile status 200': (r) => r.status === 200,
      });
      if (!pOk) customFailureRate.add(1);

      // 2. Fetch Workspaces list
      const wsListRes = http.get(`${baseUrl}/api/workspaces`, {
        headers: headers,
        tags: { endpoint: 'workspaces_list' },
      });
      const wsOk = check(wsListRes, {
        'workspaces status 200': (r) => r.status === 200,
      });
      if (!wsOk) customFailureRate.add(1);

      // 3. Fetch Projects in baseline workspace
      if (data.workspaceId) {
        const projRes = http.get(`${baseUrl}/api/projects/workspace/${data.workspaceId}`, {
          headers: headers,
          tags: { endpoint: 'projects_list' },
        });
        const prOk = check(projRes, {
          'projects status 200': (r) => r.status === 200,
        });
        if (!prOk) customFailureRate.add(1);
      }

      // 4. Fetch Tasks in baseline project
      if (data.projectId) {
        const tasksRes = http.get(`${baseUrl}/api/tasks/project/${data.projectId}`, {
          headers: headers,
          tags: { endpoint: 'tasks_list' },
        });
        const tOk = check(tasksRes, {
          'tasks status 200': (r) => r.status === 200,
        });
        if (!tOk) customFailureRate.add(1);
      }

      readLatency.add(Date.now() - readStart);
      txCounter.add(1);
    });
  } else {
    // -------------------------------------------------------------
    // WRITE WORKLOAD (~25% of traffic): Task Lifecycle Mutations
    // -------------------------------------------------------------
    group('Write_Flow', function () {
      const writeStart = Date.now();
      const targetProjId = data.projectId;

      if (targetProjId) {
        // 1. Create a new task
        const newTaskPayload = JSON.stringify(generateTaskPayload(targetProjId, vu, iter));
        const createRes = http.post(`${baseUrl}/api/tasks`, newTaskPayload, {
          headers: headers,
          tags: { endpoint: 'tasks_crud' },
        });

        const cOk = check(createRes, {
          'create task status 200/201': (r) => r.status === 200 || r.status === 201,
          'created task has id': (r) => {
            try {
              return r.json('id') !== undefined;
            } catch (_) {
              return false;
            }
          },
        });

        if (cOk) {
          const taskId = createRes.json('id');

          // 2. Update task status (Kanban movement)
          const updatePayload = JSON.stringify(generateTaskUpdatePayload('Load Task', 'done'));
          const updateRes = http.put(`${baseUrl}/api/tasks/${taskId}`, updatePayload, {
            headers: headers,
            tags: { endpoint: 'tasks_crud' },
          });

          const uOk = check(updateRes, {
            'update task status 200': (r) => r.status === 200,
          });
          if (!uOk) customFailureRate.add(1);

          // 3. Clean up created task
          const delRes = http.del(`${baseUrl}/api/tasks/${taskId}`, null, {
            headers: headers,
            tags: { endpoint: 'tasks_crud' },
          });

          const dOk = check(delRes, {
            'delete task status 200/204': (r) => r.status === 200 || r.status === 204,
          });
          if (!dOk) customFailureRate.add(1);
        } else {
          customFailureRate.add(1);
        }
      }

      writeLatency.add(Date.now() - writeStart);
      txCounter.add(1);
    });
  }

  // Realistic human think time with slight jitter (0.5s - 1.5s)
  sleep(0.5 + Math.random() * 1.0);
}
