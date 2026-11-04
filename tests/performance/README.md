# OpTeamUs Performance Testing Suite (k6)

This directory contains the automated performance, load, stress, and database concurrency verification test suites built with [Grafana k6](https://k6.io/).

---

## Architecture & Directory Structure

```
tests/performance/
├── config/
│   ├── environments.js   # Base URLs, auth header generator, default credentials
│   ├── thresholds.js     # Enterprise SLA thresholds (p95 latency, error rates, checks)
│   └── auth.js           # JWT acquisition helper with auto-registration fallback
├── data/
│   └── payloads.js       # Dynamic payload generators (Workspaces, Projects, Tasks)
├── scenarios/
│   ├── smoke.js          # Minimal load (1-5 VUs, 1m) to verify health & p(95) < 200ms
│   ├── load.js           # Normal peak load (50-100 VUs) for steady-state throughput
│   ├── stress.js         # Saturation test (up to 200 VUs) to detect breaking points
│   └── concurrency-db.js # Entity contention test to verify ACID & DB lock behavior
└── README.md
```

---

## Performance Baseline SLA Thresholds

| Scenario | Concurrency | Latency SLA (p95) | Max Failure Rate | Assertions Pass Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Smoke Test** | 1 – 5 VUs | `< 200ms` (p99 `< 400ms`) | `< 1.0%` | `> 99.0%` |
| **Load Test** | 50 – 100 VUs | `< 300ms` (p99 `< 500ms`, avg `< 150ms`) | `< 2.0%` | `> 98.0%` |
| **Stress Test** | Up to 200 VUs | `< 1000ms` (p99 `< 2500ms`) | `< 5.0%` | `> 95.0%` |
| **DB Concurrency** | 20 VUs simultaneous writes | `< 350ms` | `< 2.0%` | `> 98.0%` |

---

## Execution Guide

### 1. Smoke Test (Sanity & Health Check)
Executes a complete end-to-end user lifecycle (Auth &rarr; Workspace &rarr; Project &rarr; Task CRUD) under light concurrency:
```bash
# Default (2 VUs for 1 minute)
k6 run tests/performance/scenarios/smoke.js

# Custom duration and concurrency
k6 run -e VUS=5 -e DURATION=30s tests/performance/scenarios/smoke.js
```

### 2. Load Test (Normal Expected Peak)
Simulates realistic production traffic distribution (~75% read operations, ~25% write mutations) ramped up to peak:
```bash
# Quick validation run (35s, 10 VUs)
k6 run -e QUICK_RUN=true -e TARGET_VUS=10 tests/performance/scenarios/load.js

# Full production benchmark (50 VUs, 4-stage ramping over 4 minutes)
k6 run tests/performance/scenarios/load.js

# Scaled peak test (100 VUs)
k6 run -e TARGET_VUS=100 tests/performance/scenarios/load.js
```

### 3. Stress Test (Saturation Limit)
Pushes API throughput to 200 VUs to observe resource exhaustion and recovery:
```bash
k6 run tests/performance/scenarios/stress.js
```

### 4. Database Concurrency Contention
Fires simultaneous mutating requests against shared tasks to test database locking and deadlock resilience:
```bash
k6 run tests/performance/scenarios/concurrency-db.js
```

---

## Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `API_BASE_URL` | `http://localhost:8080` | Target backend API base URL |
| `TARGET_VUS` | `50` | Target peak virtual users for load testing (up to 100) |
| `DURATION` | `1m` | Test execution duration for smoke test |
| `QUICK_RUN` | `false` | When `true`, executes condensed stages for rapid verification |
| `TEST_USER_EMAIL` | `k6_perf_tester@example.com` | Email for authenticated load runner |
| `TEST_USER_PASSWORD` | `Password123!` | Password for test user |

