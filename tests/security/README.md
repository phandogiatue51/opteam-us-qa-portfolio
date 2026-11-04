# OWASP ZAP DAST Security Testing Suite

This directory contains the Dynamic Application Security Testing (DAST) configuration and automation suite for the **OpTeamUs** ASP.NET Core API.

The pipeline integrates [OWASP ZAP (Zed Attack Proxy)](https://www.zaproxy.org/) using `zap-api-scan.py` to automatically analyze the OpenAPI specification against the OWASP Top 10 API Security vulnerabilities, inject authentication tokens, and stream findings directly into the GitHub Security (Code Scanning) tab in SARIF format.

---

## Architecture Overview

```
                      +-----------------------------------+
                      |   ASP.NET Core API (Port 8080)    |
                      |   /swagger/v1/swagger.json        |
                      +-----------------+-----------------+
                                        ^
        1. Auth & Bearer Token          |  3. Active & Passive
           Generation                   |     DAST Scanning
+-----------------------+               |
|      auth-hook.js     |---------------+
+-----------------------+               |
           |                            |
  Exports $ZAP_AUTH_HEADER_VALUE        |
           v                            |
+---------------------------------------+---------+
|   OWASP ZAP Container (zap-api-scan.py)         |
|   - Rules: tests/security/zap-api-scan.conf     |
+-------------------------------------------------+
                        |
            Generates zap-report.json
                        |
                        v
+-------------------------------------------------+
|   SARIF Converter (zap-to-sarif.js)             |
|   - Maps ZAP findings to OASIS SARIF 2.1.0      |
+-------------------------------------------------+
                        |
                        v
+-------------------------------------------------+
|   GitHub Security Tab (Code Scanning Alerts)    |
|   github/codeql-action/upload-sarif@v3          |
+-------------------------------------------------+
```

---

## File Structure

| File | Purpose |
| :--- | :--- |
| `auth-hook.js` | Authenticates against `/auth/register` and `/auth/login`, retrieves a JWT Bearer token, and exports `BEARER_TOKEN` and `ZAP_AUTH_HEADER_VALUE` for ZAP. Also functions as a ZAP HTTP Sender script if invoked in ZAP's engine. |
| `zap-api-scan.conf` | Scanner policy configuration mapping OWASP alert rule IDs to `FAIL`, `WARN`, or `IGNORE` (e.g., failing on SQLi/RCE, ignoring anti-CSRF check for stateless Bearer auth). |
| `zap-to-sarif.js` | Transforms ZAP's JSON scan output into OASIS SARIF v2.1.0 format mapped to `Backend/swagger.json` so GitHub Code Scanning accepts the runtime DAST findings. |
| `.github/workflows/security-dast.yml` | End-to-end GitHub Actions workflow spinning up PostgreSQL, launching the .NET API, generating tokens, running `zap-api-scan.py`, converting to SARIF, and publishing to the GitHub Security tab. |

---

## How It Works

### 1. Bearer Token Generation (`auth-hook.js`)
Because OpTeamUs endpoints require JWT authentication (`Authorization: Bearer <token>`), the runner executes `auth-hook.js` before scanning:
1. Sends a POST request to `/auth/register` with test user credentials (if the user already exists, it proceeds smoothly).
2. Sends a POST request to `/auth/login` to obtain the JWT token.
3. Exports `ZAP_AUTH_HEADER_VALUE="Bearer <token>"` to `$GITHUB_ENV` and writes the token to `tests/security/.token`.

### 2. DAST Scan Execution (`zap-api-scan.py`)
The scan runs in the official Docker image (`ghcr.io/zaproxy/zaproxy:stable`):
```bash
docker run --rm --network="host" \
  -v $(pwd):/zap/wrk/:rw \
  -e ZAP_AUTH_HEADER="Authorization" \
  -e ZAP_AUTH_HEADER_VALUE="Bearer <TOKEN>" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t "http://127.0.0.1:8080/swagger/v1/swagger.json" \
  -f openapi \
  -c "/zap/wrk/tests/security/zap-api-scan.conf" \
  -r "/zap/wrk/zap-reports/zap-report.html" \
  -J "/zap/wrk/zap-reports/zap-report.json" \
  -w "/zap/wrk/zap-reports/zap-report.md" \
  -I
```
- `-t`: Targets the live OpenAPI specification.
- `-f openapi`: Instructs ZAP to parse paths, methods, parameters, and payloads from Swagger.
- `-c`: Enforces thresholds from `zap-api-scan.conf`.
- `-J`: Outputs traditional JSON report for SARIF conversion.
- `-r` / `-w`: Generates human-readable HTML and Markdown summaries.

### 3. SARIF Report & GitHub Security Tab Integration
DAST findings lack source line numbers because they scan runtime endpoints. `zap-to-sarif.js` maps each finding to the OpenAPI specification (`Backend/swagger.json`) with:
- Exact HTTP method and route location
- Vulnerability risk level mapped to GitHub severity (`error`, `warning`, `note`)
- Attack payload, parameter name, and evidence
- Detailed remediation steps and CWE/WASC references

The generated SARIF is uploaded via `github/codeql-action/upload-sarif@v3`, displaying runtime alerts in **Security > Code scanning**.

---

## Running Locally

### Step 1: Start the API
Ensure Postgres is running and launch the ASP.NET Core backend:
```bash
dotnet run --project Backend/OpTeamUs/OpTeamUs/OpTeamUs.csproj --urls "http://127.0.0.1:8080"
```

### Step 2: Acquire Token
```bash
node tests/security/auth-hook.js http://127.0.0.1:8080
```

### Step 3: Run ZAP Container
```bash
TOKEN=$(cat tests/security/.token)
mkdir -p zap-reports && chmod -R 777 zap-reports

docker run --rm --network="host" \
  -v "$(pwd)":/zap/wrk/:rw \
  -e ZAP_AUTH_HEADER="Authorization" \
  -e ZAP_AUTH_HEADER_VALUE="Bearer $TOKEN" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t "http://127.0.0.1:8080/swagger/v1/swagger.json" \
  -f openapi \
  -c "/zap/wrk/tests/security/zap-api-scan.conf" \
  -r "/zap/wrk/zap-reports/zap-report.html" \
  -J "/zap/wrk/zap-reports/zap-report.json" \
  -w "/zap/wrk/zap-reports/zap-report.md" \
  -I
```

### Step 4: Convert Report to SARIF
```bash
node tests/security/zap-to-sarif.js zap-reports/zap-report.json zap-reports/zap-report.sarif Backend/swagger.json
```
Reports are available in `zap-reports/`.

