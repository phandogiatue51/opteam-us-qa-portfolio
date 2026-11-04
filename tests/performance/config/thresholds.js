/**
 * OpTeamUs Performance Testing - SLA Thresholds Configuration
 */

// Smoke test SLA thresholds: minimal load, strict baseline response requirements
export const smokeThresholds = {
  // 95% of all requests must complete within 200ms; 99% within 400ms
  http_req_duration: ['p(95)<200', 'p(99)<400'],
  // HTTP failure rate must stay below 1%
  http_req_failed: ['rate<0.01'],
  // Assertion checks must have a success rate > 99%
  checks: ['rate>0.99'],
};

// Load test SLA thresholds: normal expected peak (50-100 VUs)
export const loadThresholds = {
  // Steady-state latency SLA: p(95) < 300ms, p(99) < 500ms, average < 150ms
  http_req_duration: ['p(95)<300', 'p(99)<500', 'avg<150'],
  // Failure rate strictly below 2%
  http_req_failed: ['rate<0.02'],
  // Check pass rate above 98%
  checks: ['rate>0.98'],
  // Tagged thresholds for specific critical operations
  'http_req_duration{endpoint:auth_login}': ['p(95)<300'],
  'http_req_duration{endpoint:auth_me}': ['p(95)<150'],
  'http_req_duration{endpoint:workspaces_list}': ['p(95)<200'],
  'http_req_duration{endpoint:projects_list}': ['p(95)<200'],
  'http_req_duration{endpoint:tasks_list}': ['p(95)<200'],
  'http_req_duration{endpoint:tasks_crud}': ['p(95)<250'],
};

