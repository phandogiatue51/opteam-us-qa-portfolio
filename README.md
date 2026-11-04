# OpTeamUs QA Testing & DevSecOps Portfolio

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=phandogiatue51_opteam-us-qa-portfolio&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=phandogiatue51_opteam-us-qa-portfolio)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=phandogiatue51_opteam-us-qa-portfolio&metric=coverage)](https://sonarcloud.io/summary/new_code?id=phandogiatue51_opteam-us-qa-portfolio)
[![Tests](https://img.shields.io/badge/xUnit%20Tests-43%20Passed-brightgreen)](file:///Backend/OpTeamUs/OpTeamUs.Tests)
[![Contract Testing](https://img.shields.io/badge/Contract%20Testing-Spectral%20%2B%20Schemathesis-blueviolet)](.github/workflows/contract-tests.yml)
[![Performance](https://img.shields.io/badge/Performance-k6%20Load%20%26%20Stress-orange)](.github/workflows/performance-tests.yml)
[![DAST Security](https://img.shields.io/badge/DAST%20Security-OWASP%20ZAP%20%2B%20SARIF-red)](.github/workflows/security-dast.yml)

This repository contains the Quality Assurance (QA) and DevSecOps engineering testing portfolio for **OpTeamUs**, an open-source full-stack Kanban task management platform.

*Huge thanks to [CallynN](https://github.com/CallynN) for building the original [OpTeamUs](https://github.com/CallynN/OpTeamUs) application (ASP.NET Core 8, React, PostgreSQL, and Docker) which provided the foundation for this testing project.*

---

## Project Overview

OpTeamUs is a Kanban-style task manager similar to Trello or Linear. It features JWT authentication, workspace management, project tracking, and workspace member invitations. 

This QA portfolio demonstrates a **comprehensive Multi-Tier Quality Engineering Strategy** spanning from White-Box internal logic tests to Black-Box UI automation, Contract Verification, Performance Engineering, DAST Security Scans, and continuous quality gates in CI/CD.

---

## QA Testing Scope & DevSecOps Architecture

```
                     / \
                    /   \      Layer 5: DAST Security & Governance (OWASP ZAP)
                   / DAST\     Automated vulnerability scanning, auth hooks & SARIF reporting
                  /-------\
                 /  Perf.  \   Layer 4: Performance & Concurrency Tuning (k6)
                /   & DB    \  Smoke, Load, Stress & Postgres lock contention tests
               /-------------\
              /   Contract    \ Layer 3: API Contract Verification
             /   & Spectral    \ Spectral OAS linting + Schemathesis property-based testing
            /-------------------\
           /      E2E UI         \ Layer 2: Black-Box E2E Automation
          /      & Postman        \ Playwright UI flows + Postman API collection chaining
         /-------------------------\
        /    White-Box Testing      \ Layer 1: Unit & Integration Testing (.NET 8 / xUnit)
       /   Controllers & Services    \ 43 automated tests covering Controllers, Services & Auth
      /-------------------------------\
```

### 1. White-Box Unit & Integration Testing (.NET 8 / xUnit)
- **Unit Tests:** Verified isolated controller logic (`AuthController`, `TaskController`, `ProjectController`, `MembershipController`, `WorkspaceController`) and services (`JwtService`, `WorkspaceAccessService`) using **xUnit**, **Moq**, and **FluentAssertions**.
- **Integration Tests:** Used `WebApplicationFactory` to spin up an in-memory test server validating routing, middleware, model binding, and HTTP status codes.

### 2. Functional API & End-to-End Automation
- **API Functional Suite (Postman):** Automated collection featuring request chaining, positive/negative validation, boundary tests, and dynamic JWT state management.
- **UI Automation (Playwright):** Full user journey (Registration → Login → Workspace Creation → Project Setup → Kanban Task Drag & Drop / Status Transitions).

### 3. API Contract Verification (Spectral & Schemathesis)
- **OpenAPI Schema Linting (Spectral):** Validated [`Backend/swagger.json`](Backend/swagger.json) against OpenAPI 3.0 rulesets in [`tests/contract/.spectral.yaml`](tests/contract/.spectral.yaml).
- **Property-Based Contract Testing (Schemathesis):** Executes dynamic negative and positive property testing against the live ASP.NET Core API with automated JWT authentication injection via [`tests/contract/schemathesis-hooks.py`](tests/contract/schemathesis-hooks.py).

### 4. Performance & Database Concurrency Benchmarking (k6)
- **Smoke & Load Scenarios:** Baseline performance tests measuring p95 latency and error rates across critical Auth and CRUD routes.
- **PostgreSQL Concurrency Tuning:** High-concurrency write scenarios targeting lock contention, transaction isolation, and Npgsql connection pool behavior. Full analysis documented in [`docs/performance-benchmark-report.md`](docs/performance-benchmark-report.md).

### 5. Dynamic Application Security Testing (OWASP ZAP DAST)
- Automated vulnerability scanning using `zap-api-scan.py` targeting the OpenAPI specification.
- Dedicated Bearer authentication hook ([`tests/security/auth-hook.js`](tests/security/auth-hook.js)) for automated login and token injection.
- Security thresholds configured in [`tests/security/zap-api-scan.conf`](tests/security/zap-api-scan.conf).
- Automatic translation of ZAP findings to OASIS SARIF 2.1.0 ([`tests/security/zap-to-sarif.js`](tests/security/zap-to-sarif.js)) uploaded directly to the **GitHub Security (Code Scanning)** tab.

---

## Repository Structure

```
phandogiatue51/opteam-us-qa-portfolio/
├── docs/
│   ├── test-plan.md                       # Master QA test plan, scope, strategy, and risk analysis
│   ├── test-cases.md                      # Functional & edge-case matrices with traceability IDs
│   ├── test-summary-report.md             # Pass/fail metrics, coverage, and release sign-off
│   ├── performance-benchmark-report.md    # k6 performance baselines & Postgres concurrency findings
│   └── bug-reports/                       # Defect tickets with root cause analysis & evidence
│       ├── README.md                      # Bug tracker index & defect breakdown matrix
│       ├── BUG-001-...md                  # 500 error on missing resource
│       ├── BUG-002-...md                  # Empty string validation bypass
│       ├── BUG-003-...md                  # PUT task title & description data loss
│       ├── BUG-004-...md                  # Missing member FK validation
│       ├── BUG-005-...md                  # Database connection string password misconfiguration
│       └── BUG-006-...md                  # Undocumented API contract responses (400, 401)
├── tests/
│   ├── api/                               # Postman v2.1 automated collection with E2E chaining
│   ├── e2e/                               # Playwright TypeScript UI automation suite
│   ├── contract/                          # Spectral linting rules & Schemathesis contract tests
│   │   ├── .spectral.yaml                 # OpenAPI linting ruleset
│   │   ├── schemathesis-hooks.py          # Dynamic Bearer auth injection hook
│   │   └── requirements.txt               # Schemathesis Python dependencies
│   ├── performance/                       # k6 load & concurrency testing suite
│   │   ├── config/                        # Thresholds, environments & auth helpers
│   │   ├── data/                          # Realistic mock payloads
│   │   └── scenarios/                     # Smoke, load, stress, and Postgres concurrency scripts
│   └── security/                          # OWASP ZAP DAST security suite
│       ├── auth-hook.js                   # Bearer token generator & ZAP HTTP Sender script
│       ├── zap-api-scan.conf              # ZAP alert policy thresholds (FAIL/WARN/IGNORE)
│       └── zap-to-sarif.js                # ZAP JSON to OASIS SARIF 2.1.0 converter
├── Backend/                               # ASP.NET Core 8 Web API & OpTeamUs.Tests (xUnit)
├── Frontend/                              # React, Vite, TailwindCSS application & Playwright config
├── .github/workflows/                     # GitHub Actions CI/CD workflows
│   ├── sonarcloud.yml                     # SonarCloud SAST & coverage analysis
│   ├── contract-tests.yml                 # Spectral linting & Schemathesis contract verification
│   ├── performance-tests.yml              # k6 smoke, load, stress, and concurrency execution
│   └── security-dast.yml                  # OWASP ZAP API scan & SARIF GitHub Security tab upload
└── sonar-project.properties               # SonarCloud scanner configuration & coverage exclusions
```

---

## How to Run the Tests

### 1. Run Backend White-Box Tests (.NET / xUnit)
```bash
# Run all Unit and Integration tests
dotnet test Backend/OpTeamUs/OpTeamUs.sln

# Run with OpenCover code coverage collection
dotnet test Backend/OpTeamUs/OpTeamUs.sln --collect:"XPlat Code Coverage"
```

---

### 2. Run API Contract Verification (Spectral & Schemathesis)
```bash
# 1. Lint OpenAPI specification with Spectral
npx @stoplight/spectral-cli lint Backend/swagger.json --ruleset tests/contract/.spectral.yaml

# 2. Run Schemathesis dynamic contract tests against running API
pip install -r tests/contract/requirements.txt
st run http://127.0.0.1:8080/swagger/v1/swagger.json \
  --base-url http://127.0.0.1:8080 \
  --hooks tests/contract/schemathesis-hooks.py \
  --checks not_a_server_error,status_code_conformance,content_type_conformance
```

---

### 3. Run Performance & Concurrency Tests (k6)
```bash
# Smoke test (sanity check)
k6 run tests/performance/scenarios/smoke.js

# Load test (target throughput & p95 latency)
k6 run tests/performance/scenarios/load.js

# PostgreSQL concurrency write test (pool contention & locks)
k6 run tests/performance/scenarios/concurrency-db.js
```

---

### 4. Run OWASP ZAP DAST Security Scan
```bash
# 1. Acquire Bearer token
node tests/security/auth-hook.js http://127.0.0.1:8080

# 2. Execute ZAP API Scan via Docker
TOKEN=$(cat tests/security/.token)
docker run --rm --network="host" \
  -v $(pwd):/zap/wrk/:rw \
  -e ZAP_AUTH_HEADER="Authorization" \
  -e ZAP_AUTH_HEADER_VALUE="Bearer $TOKEN" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-api-scan.py \
  -t "http://127.0.0.1:8080/swagger/v1/swagger.json" \
  -f openapi \
  -c "/zap/wrk/tests/security/zap-api-scan.conf" \
  -r "/zap/wrk/zap-reports/zap-report.html" \
  -J "/zap/wrk/zap-reports/zap-report.json" \
  -I

# 3. Convert results to SARIF
node tests/security/zap-to-sarif.js zap-reports/zap-report.json zap-reports/zap-report.sarif Backend/swagger.json
```

---

### 5. Run UI Automation Tests (Playwright)
```bash
cd Frontend
npm install
npx playwright install
npx playwright test
```
