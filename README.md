# OpTeamUs QA Testing Artifacts

This repository contains the Quality Assurance (QA) testing artifacts for **OpTeamUs**, an open-source full-stack project and task management platform. 

*Huge thanks to [CallynN](https://github.com/CallynN) for building the original OpTeamUs application (ASP.NET Core 8, React, PostgreSQL, and Docker) which provided the foundation for this testing project.*

---

## Project Overview

OpTeamUs is a Kanban-style task manager similar to Trello or Linear. It features JWT authentication, workspace management, project tracking, and workspace member invitations. 

---

## QA Testing Scope (Layer 1, 2 & 3)

As a QA portfolio artifact, I tested both the backend API and frontend UI, transitioning the system from a manually callable state into a verified, automated test asset. 

- **Layer 1 (API Testing):** Created a Postman Collection featuring automated End-to-End (E2E) chaining, positive/negative test cases, boundary value assertions, and token state management.
- **Layer 2 (Database Verification):** Connected directly to the Dockerized PostgreSQL database via pgAdmin to verify data persistence and integrity after API execution.
- **Layer 3 (UI Automation):** Built a Playwright (TypeScript) test suite to automate the critical user journey (Register → Login → Create Workspace → Create Project → Create Task → Kanban lifecycle transition from To Do → In Progress → Done).
- **Defect Reporting:** Discovered and documented 4 major backend logic flaws, including missing data validation and silent update failures.

---

## Repository Structure

- `postman/` - Contains the exported Postman Collection (v2.1).
- `evidence/` - Screenshots of Postman test failures, SQL database verification, and the Playwright HTML report.
- `test-plan.md` - Full test strategy, environment details, and test cases.
- `bug-reports.md` - Detailed reports of the defects found during testing.
- `Frontend/tests/` - Contains the Playwright UI automation code (`e2e.spec.ts`).

---

## How to Run the Tests

To run the tests locally, you will need **Docker**, **Postman**, and **Node.js**.

### 1. Start the Application

From the root project folder, run:

```bash
docker compose up --build
```

Wait for the frontend (`http://localhost:3000`) and backend (`http://localhost:8080`) to start.

---

### 2. Run the API Tests (Postman)

1. Import the `postman/OpTeamUs.postman_collection.json` file into Postman.
2. Click the three dots (`...`) next to the collection name, select **Run Collection**, and click **Run**.

*(Note: Running the collection will execute a full E2E API flow and surface the known backend bugs documented in `bug-reports.md`).*

---

### 3. Run the UI Tests (Playwright)

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
