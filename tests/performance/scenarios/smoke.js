/**
 * OpTeamUs Performance Testing - Smoke Test Scenario
 * 
 * Objective: Minimal load validation (1-5 Virtual Users for 1 minute)
 * to verify system health, zero server crashes, and baseline latency compliance (p95 < 200ms).
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, authHeaders, DEFAULT_HEADERS } from '../config/environments.js';
import { smokeThresholds } from '../config/thresholds.js';
import { getAuthToken } from '../config/auth.js';
import {
  generateWorkspacePayload,
  generateProjectPayload,
  generateTaskPayload,
  generateTaskUpdatePayload,
} from '../data/payloads.js';

// Custom performance tracking metrics
const flowDuration = new Trend('smoke_iteration_duration');
const failureRate = new Rate('smoke_failures');

export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS, 10) : 2,
  duration: __ENV.DURATION || '1m',
  thresholds: smokeThresholds,
};

/**
 * Setup lifecycle hook: runs once before all VUs start.
 * Performs API health verification and acquires authenticated session token.
 */
export function setup() {
  const healthRes = http.get(`${BASE_URL}/api/test/public`, {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: 'health_check' },
  });

  check(healthRes, {
    'API gateway is accessible': (r) => r.status === 200,
  });

  const token = getAuthToken(BASE_URL);
  if (!token) {
    throw new Error('Smoke test setup failed: Could not acquire auth token');
  }

  return { token, baseUrl: BASE_URL };
}

/**
 * Main VU iteration: executes critical user paths end-to-end
 */
export default function (data) {
  const startTime = Date.now();
  const token = data.token;
  const baseUrl = data.baseUrl;
  const headers = authHeaders(token);
  const vu = __VU;
  const iter = __ITER;

  // 1. Verify Authentication & Identity
  group('01_Auth_And_Profile', function () {
    const profileRes = http.get(`${baseUrl}/auth/me`, {
      headers: headers,
      tags: { endpoint: 'auth_me' },
    });

    const ok = check(profileRes, {
      'profile returns 200': (r) => r.status === 200,
      'profile has valid email': (r) => {
        try {
          return r.json('email') !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    if (!ok) failureRate.add(1);
  });

  sleep(0.5);

  let workspaceId = null;

  // 2. Workspace Management
  group('02_Workspaces_Flow', function () {
    // Create Workspace
    const createWsPayload = JSON.stringify(generateWorkspacePayload(vu, iter));
    const createWsRes = http.post(`${baseUrl}/api/workspaces`, createWsPayload, {
      headers: headers,
      tags: { endpoint: 'workspaces_create' },
    });

    const createOk = check(createWsRes, {
      'workspace created (200/201)': (r) => r.status === 200 || r.status === 201,
      'workspace has ID': (r) => {
        try {
          return r.json('id') !== undefined;
        } catch (_) {
          return false;
        }
      },
    });

    if (createOk) {
      workspaceId = createWsRes.json('id');
    } else {
      failureRate.add(1);
    }

    // List Workspaces
    const listWsRes = http.get(`${baseUrl}/api/workspaces`, {
      headers: headers,
      tags: { endpoint: 'workspaces_list' },
    });

    const listOk = check(listWsRes, {
      'workspaces list returns 200': (r) => r.status === 200,
      'workspaces list is array': (r) => {
        try {
          return Array.isArray(r.json());
        } catch (_) {
          return false;
        }
      },
    });

    if (!listOk) failureRate.add(1);
  });

  sleep(0.5);

  let projectId = null;

  // 3. Projects Management (requires workspace)
  if (workspaceId) {
    group('03_Projects_Flow', function () {
      // Create Project
      const createProjPayload = JSON.stringify(generateProjectPayload(workspaceId, vu, iter));
      const createProjRes = http.post(`${baseUrl}/api/projects`, createProjPayload, {
        headers: headers,
        tags: { endpoint: 'projects_create' },
      });

      const projOk = check(createProjRes, {
        'project created (200/201)': (r) => r.status === 200 || r.status === 201,
        'project has ID': (r) => {
          try {
            return r.json('id') !== undefined;
          } catch (_) {
            return false;
          }
        },
      });

      if (projOk) {
        projectId = createProjRes.json('id');
      } else {
        failureRate.add(1);
      }

      // List Projects in Workspace
      const listProjRes = http.get(`${baseUrl}/api/projects/workspace/${workspaceId}`, {
        headers: headers,
        tags: { endpoint: 'projects_list' },
      });

      const listProjOk = check(listProjRes, {
        'projects list returns 200': (r) => r.status === 200,
        'projects list is array': (r) => {
          try {
            return Array.isArray(r.json());
          } catch (_) {
            return false;
          }
        },
      });

      if (!listProjOk) failureRate.add(1);
    });
  }

  sleep(0.5);

  // 4. Tasks CRUD Flow (requires project)
  if (projectId) {
    group('04_Tasks_CRUD_Flow', function () {
      let taskId = null;

      // Create Task
      const createTaskPayload = JSON.stringify(generateTaskPayload(projectId, vu, iter));
      const createTaskRes = http.post(`${baseUrl}/api/tasks`, createTaskPayload, {
        headers: headers,
        tags: { endpoint: 'tasks_crud' },
      });

      const taskCreatedOk = check(createTaskRes, {
        'task created (200/201)': (r) => r.status === 200 || r.status === 201,
        'task has ID': (r) => {
          try {
            return r.json('id') !== undefined;
          } catch (_) {
            return false;
          }
        },
      });

      if (taskCreatedOk) {
        taskId = createTaskRes.json('id');
      } else {
        failureRate.add(1);
      }

      // List Tasks in Project
      const listTasksRes = http.get(`${baseUrl}/api/tasks/project/${projectId}`, {
        headers: headers,
        tags: { endpoint: 'tasks_list' },
      });

      const listTasksOk = check(listTasksRes, {
        'tasks list returns 200': (r) => r.status === 200,
        'tasks list is array': (r) => {
          try {
            return Array.isArray(r.json());
          } catch (_) {
            return false;
          }
        },
      });

      if (!listTasksOk) failureRate.add(1);

      // Update Task
      if (taskId) {
        const updateTaskPayload = JSON.stringify(generateTaskUpdatePayload('Smoke Task', 'in-progress'));
        const updateTaskRes = http.put(`${baseUrl}/api/tasks/${taskId}`, updateTaskPayload, {
          headers: headers,
          tags: { endpoint: 'tasks_crud' },
        });

        const updateOk = check(updateTaskRes, {
          'task updated (200)': (r) => r.status === 200,
          'task status is in-progress': (r) => {
            try {
              return r.json('status') === 'in-progress';
            } catch (_) {
              return false;
            }
          },
        });

        if (!updateOk) failureRate.add(1);

        // Delete Task
        const deleteTaskRes = http.del(`${baseUrl}/api/tasks/${taskId}`, null, {
          headers: headers,
          tags: { endpoint: 'tasks_crud' },
        });

        const deleteOk = check(deleteTaskRes, {
          'task deleted (200/204)': (r) => r.status === 200 || r.status === 204,
        });

        if (!deleteOk) failureRate.add(1);
      }
    });
  }

  flowDuration.add(Date.now() - startTime);
  sleep(1);
}
