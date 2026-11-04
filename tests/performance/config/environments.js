/**
 * OpTeamUs Performance Testing - Environment Configuration
 */

export const BASE_URL = __ENV.API_BASE_URL || __ENV.BASE_URL || 'http://localhost:8080';

export const DEFAULT_USER = {
  firstName: __ENV.TEST_USER_FIRSTNAME || 'Perf',
  lastName: __ENV.TEST_USER_LASTNAME || 'Tester',
  email: __ENV.TEST_USER_EMAIL || 'k6_perf_tester@example.com',
  password: __ENV.TEST_USER_PASSWORD || 'Password123!',
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Returns request headers with Bearer token authentication
 * @param {string} token 
 * @returns {object} headers object
 */
export function authHeaders(token) {
  return {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

