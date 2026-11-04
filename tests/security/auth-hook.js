/**
 * OWASP ZAP Authentication Hook & Token Generator for OpTeamUs API
 * 
 * Functions:
 * 1. CLI / CI Mode: Authenticates against the target API, registers test user if needed,
 *    acquires a JWT Bearer token, and exports it to GitHub Actions environment / local file.
 * 2. ZAP Script Engine Mode: Functions as a ZAP HTTP Sender script if loaded directly
 *    in ZAP's Nashorn/Rhino JavaScript script engine to inject the Bearer header into every request.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_API_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8080';
const TEST_USER = {
  firstName: process.env.DAST_USER_FIRSTNAME || 'Security',
  lastName: process.env.DAST_USER_LASTNAME || 'Scanner',
  email: process.env.DAST_USER_EMAIL || 'zap_scanner@example.com',
  password: process.env.DAST_USER_PASSWORD || 'ZapScannerPass123!',
};

/**
 * Acquires a JWT Bearer token by registering or logging into the API.
 * @param {string} baseUrl 
 * @returns {Promise<string>} Bearer JWT token
 */
async function acquireBearerToken(baseUrl = DEFAULT_API_URL) {
  const url = baseUrl.replace(/\/+$/, '');
  const registerEndpoint = `${url}/auth/register`;
  const loginEndpoint = `${url}/auth/login`;

  console.log(`[auth-hook] Connecting to API at: ${url}`);

  // 1. Attempt Registration (ignore error if user already exists)
  try {
    const regRes = await fetch(registerEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER),
    });

    if (regRes.ok) {
      const data = await regRes.json();
      if (data && data.token) {
        console.log(`[auth-hook] User registered and token obtained successfully.`);
        return data.token;
      }
    } else {
      console.log(`[auth-hook] Registration returned status ${regRes.status} (user may already exist, proceeding to login).`);
    }
  } catch (err) {
    console.log(`[auth-hook] Registration attempt note: ${err.message}`);
  }

  // 2. Login to acquire Token
  try {
    const loginRes = await fetch(loginEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed with HTTP ${loginRes.status}: ${errText}`);
    }

    const data = await loginRes.json();
    if (!data || !data.token) {
      throw new Error('Login response did not contain a valid JWT token');
    }

    console.log(`[auth-hook] Login successful, JWT token acquired.`);
    return data.token;
  } catch (err) {
    console.error(`[auth-hook] Authentication failed: ${err.message}`);
    throw err;
  }
}

/**
 * Main CLI execution entry point
 */
async function run() {
  const targetUrl = process.argv[2] || DEFAULT_API_URL;
  try {
    const token = await acquireBearerToken(targetUrl);
    
    // Save to local token file
    const tokenFilePath = path.join(__dirname, '.token');
    fs.writeFileSync(tokenFilePath, token, 'utf8');
    console.log(`[auth-hook] Saved token to: ${tokenFilePath}`);

    // If running in GitHub Actions, append to GITHUB_ENV
    if (process.env.GITHUB_ENV) {
      fs.appendFileSync(process.env.GITHUB_ENV, `BEARER_TOKEN=${token}\n`, 'utf8');
      fs.appendFileSync(process.env.GITHUB_ENV, `ZAP_AUTH_HEADER_VALUE=Bearer ${token}\n`, 'utf8');
      console.log(`[auth-hook] Exported BEARER_TOKEN and ZAP_AUTH_HEADER_VALUE to GITHUB_ENV.`);
    }

    // Print raw token to stdout for piping if needed
    console.log(`\n--- TOKEN_START ---`);
    console.log(token);
    console.log(`--- TOKEN_END ---\n`);

    return token;
  } catch (error) {
    console.error(`[auth-hook] Fatal error acquiring token:`, error);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// ZAP HTTP Sender Script compatibility (if loaded directly inside OWASP ZAP)
// ---------------------------------------------------------------------------
function sendingRequest(msg, initiator, helper) {
  try {
    var token = java.lang.System.getenv("BEARER_TOKEN") || java.lang.System.getenv("ZAP_AUTH_HEADER_VALUE");
    if (token) {
      var headerVal = token.startsWith("Bearer ") ? token : ("Bearer " + token);
      msg.getRequestHeader().setHeader("Authorization", headerVal);
    }
  } catch (e) {
    // Silently continue if running outside ZAP Java host environment
  }
}

function responseReceived(msg, initiator, helper) {
  // Pass-through
}

// Execute CLI run if called from Node
if (typeof require !== 'undefined' && require.main === module) {
  run();
}

module.exports = {
  acquireBearerToken,
  sendingRequest,
  responseReceived,
};
