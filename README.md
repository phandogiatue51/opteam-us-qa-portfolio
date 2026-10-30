# OpTeamUs QA Testing Artifacts

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=phandogiatue51_opteam-us-qa-portfolio&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=phandogiatue51_opteam-us-qa-portfolio)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=phandogiatue51_opteam-us-qa-portfolio&metric=coverage)](https://sonarcloud.io/summary/new_code?id=phandogiatue51_opteam-us-qa-portfolio)
[![Tests](https://img.shields.io/badge/xUnit%20Tests-43%20Passed-brightgreen)](file:///Backend/OpTeamUs/OpTeamUs.Tests)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](.github/workflows/sonarcloud.yml)

This repository contains the Quality Assurance (QA) testing portfolio for **OpTeamUs**, an open-source full-stack Kanban project and task management platform.

*Huge thanks to [CallynN](https://github.com/CallynN) for building the original OpTeamUs application (ASP.NET Core 8, React, PostgreSQL, and Docker) which provided the foundation for this testing project.*

---

## Project Overview

OpTeamUs is a Kanban-style task manager similar to Trello or Linear. It features JWT authentication, workspace management, project tracking, and workspace member invitations. 

This QA portfolio demonstrates a **4-Layer Multi-Tier Testing Strategy** spanning from White-Box internal logic tests to Black-Box UI automation, supported by continuous static code analysis and quality gates.

---

## QA Testing Scope (4-Layer Testing Strategy & CI/CD)

```
               / \
              /   \      Layer 4: UI E2E Automation (Playwright)
             / UI  \     Critical user journeys & cross-browser validation
            /-------\
           /   API   \   Layer 2 & 3: Black-Box API & Database Verification
          /  &  DB    \  Postman E2E suites + Direct PostgreSQL queries
         /-------------\
        /  White-Box    \ Layer 1: Unit & Integration Testing (.NET 8 / xUnit)
       / Unit & Integ.   \ 43 automated tests covering Controllers, Services & API
      /-------------------\
```

- **Layer 1 (White-Box Unit & Integration Testing):** Built a 43-test suite in .NET 8 using **xUnit**, **Moq**, and **FluentAssertions**:
  - *Unit Tests:* Verified isolated controller logic (`AuthController`, `TaskController`, `ProjectController`, `MembershipController`, `WorkspaceController`) and services (`JwtService`, `WorkspaceAccessService`).
  - *Integration Tests:* Used `WebApplicationFactory` to spin up an in-memory API pipeline verifying routing, middleware, model binding, and HTTP status codes.
- **Layer 2 (API Functional & Boundary Testing):** Created a Postman Collection featuring automated End-to-End (E2E) chaining, positive/negative test cases, boundary value assertions, and token state management.
- **Layer 3 (Database Verification):** Connected directly to the Dockerized PostgreSQL database via pgAdmin / SQL to verify relational persistence and integrity after API execution.
- **Layer 4 (UI Automation):** Built a Playwright (TypeScript) test suite to automate the critical user journey (Register → Login → Create Workspace → Create Project → Create Task → Kanban lifecycle transition from To Do → In Progress → Done).
- **Continuous Quality & SAST (SonarCloud + GitHub Actions):** Configured automated CI pipeline to execute backend test suites, collect OpenCover coverage, run SonarCloud static analysis (SAST), and enforce Quality Gate standards on every push.
- **Defect Reporting:** Discovered and documented 4 major backend logic flaws, including missing data validation and silent update failures.

---

## Repository Structure

- `Backend/OpTeamUs/OpTeamUs.Tests/` - xUnit test project containing 43 unit and integration tests.
- `postman/` - Contains the exported Postman Collection (v2.1).
- `Frontend/tests/` - Contains the Playwright UI automation code (`e2e.spec.ts`).
- `evidence/` - Screenshots of Postman test failures, SQL database verification, and the Playwright HTML report.
- `test-plan.md` - Master test strategy, test matrix, and environment details.
- `bug-reports.md` - Detailed defect reports found during testing.
- `.github/workflows/sonarcloud.yml` - GitHub Actions workflow for automated test execution and SonarCloud analysis.
- `sonar-project.properties` - SonarCloud configuration and coverage rule definitions.

---

## How to Run the Tests

To run the full test suite locally, you will need **.NET 8 SDK**, **Docker**, **Postman**, and **Node.js**.

### 1. Run the Backend White-Box Tests (.NET / xUnit)

From the project root:

```bash
# Run all 43 Unit and Integration tests
dotnet test Backend/OpTeamUs/OpTeamUs.sln

# Run with OpenCover code coverage collection
dotnet test Backend/OpTeamUs/OpTeamUs.sln --collect:"XPlat Code Coverage"
```

---

### 2. Start the Application (Docker)

To run API and UI tests against a live environment, start the services:

```bash
docker compose up --build
```

Wait for the frontend (`http://localhost:3000`) and backend (`http://localhost:8080`) to start.

---

### 3. Run the API Tests (Postman)

1. Import the `postman/OpTeamUs.postman_collection.json` file into Postman.
2. Click the three dots (`...`) next to the collection name, select **Run Collection**, and click **Run**.

*(Note: Running the collection will execute a full E2E API flow and surface the known backend bugs documented in `bug-reports.md`).*

---

### 4. Run the UI Tests (Playwright)

1. Open a terminal and navigate to the `Frontend` folder:
   ```bash
   cd Frontend
   ```

2. Install dependencies and Playwright browsers (one-time setup):
   ```bash
   npm install
   npx playwright install
   ```

3. Run the tests:
   - **Headless mode (all browsers):**
     ```bash
     npx playwright test
     ```
   - **Headed mode (watch in Chromium):**
     ```bash
     npx playwright test tests/e2e.spec.ts --project=chromium --headed
     ```
   - **Interactive UI mode:**
     ```bash
     npx playwright test --ui
     ```

4. View the HTML test report:
   ```bash
   npx playwright show-report
   ```
