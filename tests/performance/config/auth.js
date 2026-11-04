/**
 * OpTeamUs Performance Testing - Authentication Helper
 */

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, DEFAULT_USER, DEFAULT_HEADERS } from './environments.js';

/**
 * Authenticates with the API, attempting login or registering first if necessary.
 * @param {string} baseUrl 
 * @param {object} userCreds 
 * @returns {string} Bearer JWT token
 */
export function getAuthToken(baseUrl = BASE_URL, userCreds = DEFAULT_USER) {
  const loginUrl = `${baseUrl}/auth/login`;
  const registerUrl = `${baseUrl}/auth/register`;
  const loginPayload = JSON.stringify({
    email: userCreds.email,
    password: userCreds.password,
  });

  // Attempt login first
  let loginRes = http.post(loginUrl, loginPayload, {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: 'auth_login' },
  });

  if (loginRes.status === 200) {
    const body = loginRes.json();
    if (body && body.token) {
      return body.token;
    }
  }

  // If unauthorized / not registered, register the user
  const regPayload = JSON.stringify({
    firstName: userCreds.firstName || 'Perf',
    lastName: userCreds.lastName || 'Tester',
    email: userCreds.email,
    password: userCreds.password,
  });

  const regRes = http.post(registerUrl, regPayload, {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: 'auth_register' },
  });

  if (regRes.status === 200) {
    const regBody = regRes.json();
    if (regBody && regBody.token) {
      return regBody.token;
    }
  }

  // Second login attempt post-registration
  loginRes = http.post(loginUrl, loginPayload, {
    headers: DEFAULT_HEADERS,
    tags: { endpoint: 'auth_login' },
  });

  const success = check(loginRes, {
    'auth token acquired': (res) => res.status === 200 && res.json('token') !== undefined,
  });

  if (!success) {
    console.error(`Failed to authenticate user ${userCreds.email}: HTTP ${loginRes.status} - ${loginRes.body}`);
    return null;
  }

  return loginRes.json('token');
}

