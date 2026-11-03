# OpTeamUs Test Cases & Traceability Matrix

This document defines the comprehensive test case matrix for OpTeamUs across all 4 testing layers (White-Box, API, Database, and UI E2E).

---

## Traceability & Coverage Summary

| Module | Total Cases | Pass | Fail | Blocked | Linked Defects |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Authentication & Authorization (AUTH)** | 5 | 5 | 0 | 0 | None |
| **Workspace Management (WS)** | 5 | 4 | 1 | 0 | [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md) |
| **Project Management (PROJ)** | 5 | 3 | 2 | 0 | [BUG-001](bug-reports/BUG-001-missing-resource-500-error.md), [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md) |
| **Task & Kanban Lifecycle (TASK)** | 6 | 4 | 2 | 0 | [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md), [BUG-003](bug-reports/BUG-003-put-task-ignores-title-description.md) |
| **Membership & RBAC (MEM)** | 4 | 2 | 2 | 0 | [BUG-001](bug-reports/BUG-001-missing-resource-500-error.md), [BUG-004](bug-reports/BUG-004-missing-workspace-member-fk-validation.md) |
| **End-to-End User Journeys (UI)** | 4 | 4 | 0 | 0 | None (UI mitigates BUG-002 via client validation) |
| **TOTAL** | **29** | **22** | **7** | **0** | **4 Unique Defects** |

---

## 1. Authentication & Authorization (AUTH)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-AUTH-001** | Register new user with valid credentials | API / Unit | Backend running, email not registered | 1. POST `/api/auth/register` with valid first name, last name, email, password | `{ "firstName": "John", "lastName": "Doe", "email": "johndoe@test.com", "password": "Password123!" }` | HTTP 200/201, User created with hashed password in DB | Created with JWT token returned | **PASS** | - |
| **TC-AUTH-002** | Register with already registered email | API / Unit | User `johndoe@test.com` already exists | 1. POST `/api/auth/register` with existing email | Same email as TC-AUTH-001 | HTTP 400 Bad Request, duplicate error message | HTTP 400 Bad Request | **PASS** | - |
| **TC-AUTH-003** | Login with valid credentials | API / Unit | User registered | 1. POST `/api/auth/login` with correct email and password | `{ "email": "johndoe@test.com", "password": "Password123!" }` | HTTP 200 OK, valid JWT Bearer token with claims returned | JWT token returned with correct claims | **PASS** | - |
| **TC-AUTH-004** | Login with incorrect password | API / Unit | User registered | 1. POST `/api/auth/login` with incorrect password | `{ "email": "johndoe@test.com", "password": "WrongPassword!" }` | HTTP 401 Unauthorized or 400 Bad Request | HTTP 400 Bad Request | **PASS** | - |
| **TC-AUTH-005** | Access protected endpoint without Bearer token | API / Integ | Protected route exists | 1. GET `/api/workspaces` with missing `Authorization` header | Header omitted | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** | - |

---

## 2. Workspace Management (WS)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-WS-001** | Create workspace with valid name | API / Unit | User authenticated | 1. POST `/api/workspaces` with valid name | `{ "name": "Engineering Workspace" }` | HTTP 201/200, workspace created, user assigned as Owner | Workspace created, ID returned | **PASS** | - |
| **TC-WS-002** | Create workspace with empty/whitespace name | API / Boundary | User authenticated | 1. POST `/api/workspaces` with blank name | `{ "name": "" }` | HTTP 400 Bad Request (Name required) | HTTP 200 OK, blank record created | **FAIL** | [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md) |
| **TC-WS-003** | Get all workspaces for authenticated user | API / Unit | Workspaces exist for user | 1. GET `/api/workspaces` with Bearer token | Valid token | HTTP 200 OK, array of workspaces user belongs to | HTTP 200 OK with workspace list | **PASS** | - |
| **TC-WS-004** | Get workspace details by valid ID | API / Unit | Workspace exists | 1. GET `/api/workspaces/{id}` | Valid workspace GUID | HTTP 200 OK with workspace details | HTTP 200 OK | **PASS** | - |
| **TC-WS-005** | Get workspace details with non-existent ID | API / Boundary | User authenticated | 1. GET `/api/workspaces/{id}` with random GUID | `00000000-0000-0000-0000-000000000000` | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** | - |

---

## 3. Project Management (PROJ)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-PROJ-001** | Create project with valid data in workspace | API / Unit | Workspace exists | 1. POST `/api/projects` | `{ "name": "Core Platform", "description": "Backend services", "workspaceId": "{{workspaceId}}" }` | HTTP 200/201, project linked to workspace | Project created successfully | **PASS** | - |
| **TC-PROJ-002** | Create project with invalid/non-existent workspace ID | API / Boundary | User authenticated | 1. POST `/api/projects` with fake `workspaceId` | `workspaceId: "00000000-0000-0000-0000-000000000000"` | HTTP 404 Not Found | HTTP 500 Internal Server Error | **FAIL** | [BUG-001](bug-reports/BUG-001-missing-resource-500-error.md) |
| **TC-PROJ-003** | Create project with empty name | API / Boundary | Workspace exists | 1. POST `/api/projects` with empty name string | `{ "name": "", "workspaceId": "{{workspaceId}}" }` | HTTP 400 Bad Request | HTTP 200 OK, project saved with empty name | **FAIL** | [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md) |
| **TC-PROJ-004** | Get projects for workspace with valid ID | API / Unit | Projects exist in workspace | 1. GET `/api/projects/workspace/{workspaceId}` | Valid `workspaceId` | HTTP 200 OK, returns project array | HTTP 200 OK | **PASS** | - |
| **TC-PROJ-005** | Get projects for non-existent workspace ID | API / Boundary | User authenticated | 1. GET `/api/projects/workspace/{workspaceId}` | Non-existent GUID | HTTP 404 Not Found | HTTP 500 Internal Server Error | **FAIL** | [BUG-001](bug-reports/BUG-001-missing-resource-500-error.md) |

---

## 4. Task & Kanban Lifecycle (TASK)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-TASK-001** | Create task in project with valid data | API / Unit | Project exists | 1. POST `/api/tasks` | `{ "title": "Setup CI/CD", "description": "Configure Sonar", "status": "To Do", "projectId": "{{projectId}}" }` | HTTP 201/200, task created with status 'To Do' | Task created with ID returned | **PASS** | - |
| **TC-TASK-002** | Create task with empty title | API / Boundary | Project exists | 1. POST `/api/tasks` with empty title | `{ "title": "", "projectId": "{{projectId}}" }` | HTTP 400 Bad Request | HTTP 200 OK, task created with blank title | **FAIL** | [BUG-002](bug-reports/BUG-002-empty-name-validation-bypass.md) |
| **TC-TASK-003** | Update task status (Kanban drag-and-drop transition) | API / Unit | Task exists in 'To Do' | 1. PUT `/api/tasks/{id}` with new status | `{ "status": "In Progress" }` | HTTP 200 OK, status updated in database to 'In Progress' | HTTP 200 OK, status updated | **PASS** | - |
| **TC-TASK-004** | Update task title and description via PUT | API / DB | Task exists | 1. PUT `/api/tasks/{id}` with new title, description, and status | `{ "title": "New Title", "description": "New Desc", "status": "Done" }` | HTTP 200 OK, title and description updated in PostgreSQL | Status updated, title & desc silently ignored | **FAIL** | [BUG-003](bug-reports/BUG-003-put-task-ignores-title-description.md) |
| **TC-TASK-005** | Delete task with valid ID | API / Unit | Task exists | 1. DELETE `/api/tasks/{id}` | Valid task GUID | HTTP 200/204, task removed from database | HTTP 200 OK, task deleted | **PASS** | - |
| **TC-TASK-006** | Delete task with non-existent ID | API / Boundary | User authenticated | 1. DELETE `/api/tasks/{id}` with fake GUID | Non-existent GUID | HTTP 404 Not Found | HTTP 404 Not Found | **PASS** | - |

---

## 5. Membership & RBAC (MEM)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-MEM-001** | Invite valid registered user to workspace | API / Unit | Workspace exists, invitee exists | 1. POST `/api/members/invite` with valid email | `{ "workspaceId": "{{wsId}}", "email": "teammate@test.com", "role": "Member" }` | HTTP 200 OK, membership persisted | HTTP 200 OK, member invited | **PASS** | - |
| **TC-MEM-002** | Invite member with non-existent workspace ID | API / Boundary | User authenticated | 1. POST `/api/members/invite` with invalid workspace GUID | Fake GUID | HTTP 404 Not Found | HTTP 500 Internal Server Error | **FAIL** | [BUG-001](bug-reports/BUG-001-missing-resource-500-error.md) |
| **TC-MEM-003** | Invite non-existent user email | API / Boundary | Workspace exists | 1. POST `/api/members/invite` with unregistered email | `email: "fake_ghost_user@test.com"` | HTTP 400/404 indicating user not found | HTTP 500 Internal Server Error | **FAIL** | [BUG-004](bug-reports/BUG-004-missing-workspace-member-fk-validation.md) |
| **TC-MEM-004** | Get workspace members list | API / Unit | Workspace has members | 1. GET `/api/members/workspace/{workspaceId}` | Valid workspace GUID | HTTP 200 OK with list of members and roles | HTTP 200 OK | **PASS** | - |

---

## 6. End-to-End User Journeys (UI - Playwright)

| Test ID | Scenario | Type | Pre-conditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-UI-001** | Full E2E User Registration and Auto-Login | UI / E2E | App running locally | 1. Navigate to `/register`<br>2. Fill name, email, password<br>3. Submit form | Unique dynamic email timestamp | Redirected to Dashboard with active authenticated session | Session created, redirected to Dashboard | **PASS** | - |
| **TC-UI-002** | Create Workspace and Project from UI | UI / E2E | Logged in | 1. Click "New Workspace"<br>2. Enter name<br>3. Open workspace<br>4. Click "Create Project" | "QA Automation Workspace", "Release 1.0" | Workspace and project cards appear in navigation list | UI displays new workspace & project | **PASS** | - |
| **TC-UI-003** | Kanban Task Lifecycle (To Do → In Progress → Done) | UI / E2E | Inside project view | 1. Click "Add Task"<br>2. Enter title<br>3. Drag card from 'To Do' to 'In Progress'<br>4. Drag to 'Done' | "End-to-End Test Task" | Task transitions across columns; status persisted on reload | Task smoothly transitions through all 3 columns | **PASS** | - |
| **TC-UI-004** | Client-Side Empty Form Validation | UI / Boundary | Inside task modal | 1. Submit empty task form without title | Empty string | Form submission blocked; client validation error displayed | Submission prevented by React Hook Form/Zod | **PASS** | - |
