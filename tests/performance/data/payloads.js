/**
 * OpTeamUs Performance Testing - Dynamic Payload Generators
 */

/**
 * Generates an alphanumeric random string
 * @param {string} prefix 
 * @param {number} len 
 * @returns {string}
 */
export function randomSuffix(prefix = 'perf', len = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${Date.now()}_${result}`;
}

/**
 * Generates unique user registration data
 * @param {number} vu 
 * @param {number} iter 
 */
export function generateUserPayload(vu = 1, iter = 0) {
  const uid = randomSuffix(`u${vu}_i${iter}`, 4);
  return {
    firstName: `PerfVU${vu}`,
    lastName: `Iter${iter}`,
    email: `${uid}@example.com`,
    password: 'Password123!',
  };
}

/**
 * Generates workspace creation payload
 * @param {number} vu 
 * @param {number} iter 
 */
export function generateWorkspacePayload(vu = 1, iter = 0) {
  return {
    name: `Workspace_${vu}_${iter}_${randomSuffix('', 4)}`,
  };
}

/**
 * Generates project creation payload
 * @param {string} workspaceId 
 * @param {number} vu 
 * @param {number} iter 
 */
export function generateProjectPayload(workspaceId, vu = 1, iter = 0) {
  return {
    workspaceId: workspaceId,
    name: `Project_${vu}_${iter}_${randomSuffix('', 4)}`,
    description: `Performance benchmark project for VU ${vu} iteration ${iter}`,
  };
}

/**
 * Generates task creation payload
 * @param {string} projectId 
 * @param {number} vu 
 * @param {number} iter 
 */
export function generateTaskPayload(projectId, vu = 1, iter = 0) {
  return {
    projectId: projectId,
    title: `Task_${vu}_${iter}_${randomSuffix('', 4)}`,
    description: `Automated load test task generated at ${new Date().toISOString()}`,
  };
}

/**
 * Generates task update payload
 * @param {string} currentTitle 
 * @param {string} status 
 */
export function generateTaskUpdatePayload(currentTitle, status = 'in-progress') {
  return {
    title: `${currentTitle} [Updated]`,
    description: `Updated status to ${status}`,
    status: status,
  };
}

