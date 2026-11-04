# OpTeamUs Performance Benchmark & Capacity Report

**Report Date:** 2026-11-04  
**Test Environment:** ASP.NET Core 8 Web API (Dockerized), PostgreSQL 16 (Dockerized)  
**Tooling:** Grafana k6 v2.3.0  
**Target Host:** `http://localhost:8080`

---

## 1. Executive Summary

A comprehensive performance verification suite was designed and executed against the OpTeamUs backend API to establish empirical baselines across latency, throughput, concurrency resilience, and architectural saturation limits.

The system demonstrated **exceptional scalability and stability up to 100 concurrent Virtual Users (VUs)**, sustaining over **286 requests/second** with **0.00% request failure rate** and a 95th percentile response latency ($p(95)$) of just **13.32 ms**. Under high-concurrency database row contention, the API exhibited robust transaction isolation with **zero deadlocks**. Under severe stress (200 VUs), the system preserved availability (0.00% HTTP 5xx errors) while revealing a clear CPU/network saturation boundary caused by unbounded task collection serialization.

---

## 2. Test Execution Results Matrix

| Benchmark Scenario | Concurrency (VUs) | Duration | Total Requests | Throughput (req/s) | Error Rate | Latency Avg | Latency $p(95)$ | Latency $p(99)$ | SLA Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Smoke Test** | 2 VUs | 1m 02s | 434 | 6.99 req/s | **0.00%** | 8.65 ms | **18.17 ms** | 34.47 ms | **PASSED** |
| **Normal Load** | 50 VUs | 4m 00s | 34,474 | 143.11 req/s | **0.00%** | 5.38 ms | **12.37 ms** | 20.17 ms | **PASSED** |
| **Peak Load** | 100 VUs | 4m 00s | 68,975 | 286.46 req/s | **0.00%** | 5.55 ms | **13.32 ms** | 24.33 ms | **PASSED** |
| **Stress Test** | 200 VUs | 4m 00s | 26,783 | 111.38 req/s | **0.00%** | 772.09 ms | **3,700 ms** | 5,820 ms | **SATURATED** |
| **DB Concurrency** | 20 VUs | 30s | 1,681 | 54.78 req/s | **0.00%** | 9.62 ms | **17.58 ms** | 28.14 ms | **PASSED** |

---

## 3. Detailed Scenario Analysis

### 3.1 Smoke Test (`smoke.js`)
- **Objective:** Verify operational health, full end-to-end user lifecycle execution (Auth &rarr; Workspace &rarr; Project &rarr; Task CRUD), and zero crash states under minimal concurrency.
- **Results:**
  - 817/817 assertions passed ($100.00\%$).
  - Mean iteration cycle: **1.58s** (including deliberate think time).
  - Peak $p(95)$ latency: **18.17 ms** (well below the $200\text{ ms}$ SLA threshold).

### 3.2 Load & Peak Load Test (`load.js`)
- **Objective:** Model realistic production conditions with a weighted traffic profile:
  - **75% Read Operations:** Profile retrieval, workspace listings, project listings, and task boards.
  - **25% Write Operations:** Task creation, Kanban status updates, and entity deletions.
- **Scaling Behavior:**
  - Doubling concurrency from 50 VUs to 100 VUs doubled throughput from **143.1 req/s** to **286.5 req/s**.
  - Average latency remained virtually identical (**5.38 ms vs. 5.55 ms**).
  - $p(95)$ latency stayed sub-15ms (**12.37 ms &rarr; 13.32 ms**).
- **Per-Endpoint Latency Breakdown (at 100 VUs):**
  - `GET /auth/me`: $p(95) = \mathbf{9.21\text{ ms}}$ (SLA: $< 150\text{ ms}$)
  - `GET /api/workspaces`: $p(95) = \mathbf{8.98\text{ ms}}$ (SLA: $< 200\text{ ms}$)
  - `GET /api/projects/workspace/{id}`: $p(95) = \mathbf{11.69\text{ ms}}$ (SLA: $< 200\text{ ms}$)
  - `GET /api/tasks/project/{id}`: $p(95) = \mathbf{12.64\text{ ms}}$ (SLA: $< 200\text{ ms}$)
  - `POST/PUT/DELETE /api/tasks`: $p(95) = \mathbf{19.77\text{ ms}}$ (SLA: $< 250\text{ ms}$)

### 3.3 Database Concurrency & Lock Contention (`concurrency-db.js`)
- **Objective:** Induce deliberate record-level lock contention by directing 20 concurrent VUs to continuously update the status of the same 5 shared task entities.
- **Results:**
  - 3,346/3,346 assertions passed ($100.00\%$).
  - Zero PostgreSQL lock timeouts, transaction deadlocks, or HTTP 500 errors.
  - Mean mutation latency: **9.62 ms**, $p(95) = \mathbf{17.58\text{ ms}}$.
  - Confirms Entity Framework Core and PostgreSQL handle pessimistic row-level locking efficiently without race conditions.

### 3.4 Stress & Saturation Limit (`stress.js`)
- **Objective:** Escalate load to 200 VUs to discover the breaking threshold and degraded recovery behavior.
- **Observations:**
  - **Zero Dropped Connections:** 0 out of 26,783 requests failed ($0.00\%$ HTTP failure rate).
  - **Latency Cliff:** $p(95)$ rose to **3.70 seconds** (max **9.27 seconds**), breaching the 1.0s stress threshold.
  - **Primary Root Cause:** High network transfer volume (**25 GB in 4 minutes / 102 MB/s**). Because tasks were inserted continuously while queries retrieved the full unpaginated list, the JSON serialization and wire payload expanded exponentially.

---

## 4. Key Performance Insights & Capacity Thresholds

```
Concurrency Threshold Curve:
[0 - 50 VUs]    : Optimal (5ms avg, 12ms p95)
[50 - 100 VUs]  : Linear Scaling (5.5ms avg, 13ms p95, 286 req/s)
[100 - 140 VUs] : Expected Maximum Recommended Capacity on Single Node
[> 150 VUs]     : Queueing & Serialization Delay (p95 > 1s)
```

1. **Recommended Single-Node Production Ceiling:** **120 – 140 concurrent users** (~350–400 req/s).
2. **Reliability Score:** **100% Availability** across all 132,347 test requests across all test suites.

---

## 5. Architectural Recommendations

1. **Add Pagination to Task Queries (`GET /api/tasks/project/{projectId}`):**
   - *Issue:* Returning the entire list causes unbounded payload growth (25 GB transferred during stress testing).
   - *Fix:* Introduce `page` and `pageSize` parameters (defaulting to 50 items).
2. **Database Connection Pool Tuning:**
   - For deployments handling over 100 concurrent workers, adjust `Maximum Pool Size=150` in the PostgreSQL connection string.
3. **Response Caching:**
   - Implement HTTP caching headers or `IMemoryCache` on static / read-heavy endpoints (`/auth/me`, `/api/workspaces`).

