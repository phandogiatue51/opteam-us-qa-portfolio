# OpTeamUs Master Test Plan & Strategy

## 1. Executive Summary
This document outlines the end-to-end Quality Assurance (QA) test strategy for **OpTeamUs**, a full-stack Kanban task and workspace management platform. 

The primary objective was to transition the system from an untested codebase into a production-ready, thoroughly verified software asset using a **4-Layer Multi-Tier Testing Pyramid** paired with **SonarCloud Continuous Inspection & CI/CD Automation**.

---

## 2. Test Scope & 4-Layer Testing Strategy

```
               / \
              /   \      Layer 4: UI E2E Automation (Playwright)
             / UI  \     Critical user journeys & cross-browser validation
            /-------\
           /   API   \   Layer 2 & 3: Black-Box API & DB Verification
          /  &  DB    \  Postman E2E suites + Direct PostgreSQL queries
         /-------------\
        /  White-Box    \ Layer 1: Unit & Integration Testing (.NET 8 / xUnit)
       / Unit & Integ.   \ 43 tests covering Controllers, Services, & HTTP pipelines
      /-------------------\
```

### Layer 1: White-Box Unit & Integration Testing (.NET 8)
- **Unit Testing (xUnit + Moq + FluentAssertions):**
  - **Controllers:** `AuthControllerTests`, `MembershipControllerTests`, `ProjectControllerTests`, `TaskControllerTests`, `WorkspaceControllerTests`.
  - **Services:** `JwtServiceTests` (claims, token generation, expiry validation), `WorkspaceAccessServiceTests` (RBAC role verification).
  - **Mocking:** Isolated database dependencies (`DbContext`), `UserManager<User>`, and authorization policies using `Moq`.
- **Integration Testing (`WebApplicationFactory`):**
  - In-memory API pipeline testing for `AuthEndpoints`, `MembershipIntegration`, `ProjectAndTaskIntegration`, and `WorkspaceEndpoints`.
  - Verification of middleware, routing, request deserialization, status codes, and error formatting.
- **Coverage:** Tested against Coverlet OpenCover format, tracked in SonarCloud.

### Layer 2: Black-Box API Functional & Boundary Testing (Postman)
- **Scope:** Full CRUD testing of Authentication, Workspaces, Projects, Tasks, and Memberships.
- **Chaining & State Management:** Dynamic token extraction and collection variable propagation (`{{token}}`, `{{workspaceId}}`, `{{projectId}}`, `{{taskId}}`).
- **Equivalence Partitioning & Boundary Value Analysis (BVA):** Valid inputs vs. empty payloads, whitespace titles, unauthorized role escalations, non-existent entity IDs.
- **Automated Assertions:** Status code checks (200, 201, 204, 400, 401, 403, 404), schema validation, and error message assertions.

### Layer 3: Database Verification (PostgreSQL / SQL)
- Direct database inspection via Docker / pgAdmin / DBeaver to verify:
  - Referential integrity and foreign key constraints between Workspaces, Projects, and Tasks.
  - Correct persistence of soft deletes / status transitions (`To Do` → `In Progress` → `Done`).
  - Password hashing security (BCrypt / ASP.NET Identity storage).

### Layer 4: End-to-End UI Automation (Playwright / TypeScript)
- Cross-browser automation across Chromium, Firefox, and WebKit.
- Full critical user journey: Registration → Login → Workspace Creation → Project Creation → Task Creation → Drag-and-drop / Kanban status transitions → Logout.
- Visual and functional assertions on UI components, toast notifications, and modal dialogs.

---

## 3. Continuous Integration & Quality Gate (SonarCloud)

- **CI Pipeline (`.github/workflows/sonarcloud.yml`):**
  - Automatically triggered on `push` and `pull_request` to `main`.
  - Restores dependencies, runs all 43 .NET tests with OpenCover coverage collection.
  - Runs frontend linting and headless unit test runners.
  - Uploads test coverage and source code metrics to SonarCloud.
- **Static Application Security Testing (SAST):**
  - Automated scanning for security vulnerabilities, OWASP Top 10 risks, code smells, and cyclomatic complexity.
  - Enforced Quality Gate passing status on every pull request.

---

## 4. Environment & Tools

| Component | Technology / Tool | Version / Details |
| :--- | :--- | :--- |
| **Backend** | ASP.NET Core Web API | .NET 8.0 (Dockerized) |
| **Database** | PostgreSQL | Docker container (`localhost:5432`) |
| **Frontend** | React, Vite, TailwindCSS | Node.js 20 (`localhost:3000`) |
| **White-Box Testing** | xUnit, Moq, FluentAssertions | .NET 8 Test Project (43 tests) |
| **Code Coverage** | Coverlet, OpenCover | Integrated with SonarCloud |
| **API Testing** | Postman | Newman / Postman Collection v2.1 |
| **UI Automation** | Playwright (TypeScript) | Headless / Headed multi-browser |
| **CI/CD & SAST** | GitHub Actions, SonarCloud | Automated Quality Gate pipeline |

---

## 5. Defect Management & Findings Summary

Testing surfaced 4 major defects that were formally documented in [`bug-reports.md`](bug-reports.md):
1. **BUG-001:** Missing Title Validation on Task Creation (Blank / whitespace accepted with HTTP 200).
2. **BUG-002:** Silent Failure on Updating Non-Existent Task ID (Returned HTTP 200 without database mutation).
3. **BUG-003:** Missing Foreign Key / Workspace Validation when Adding Members.
4. **BUG-004:** Inconsistent Error Schema Response across Controllers.

Each defect includes reproduction steps, Postman requests, expected vs. actual outcomes, SQL verification screenshots, and recommended remediation.
