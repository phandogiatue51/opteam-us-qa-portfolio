# Bug Reports - OpTeamUs API

## BUG-01: API returns 500 Internal Server Error instead of 404 for missing resources
**Severity:** High
**Priority:** High
**Environment:** Localhost (ASP.NET Core 8, PostgreSQL)
**Affected Endpoints:** 
- `POST /api/projects` (with invalid workspaceId)
- `GET /api/projects/workspace/{workspaceId}` (with invalid ID)
- `POST /api/members/invite` (with invalid workspaceId)
- `GET /api/members/workspace/{workspaceId}` (with invalid ID)

**Steps to Reproduce:**
1. Send a request to any of the endpoints above using a non-existent Workspace ID (e.g., `00000000-0000-0000-0000-000000000000`).
2. Observe the HTTP status code.

**Expected Result:**
API should return `404 Not Found` indicating the workspace does not exist. 

**Actual Result:**
API returns `500 Internal Server Error`. The backend is likely throwing a NullReferenceException when trying to access properties of a null workspace object.

---

## BUG-02: Backend API lacks validation for empty names (Client-side validation only)
**Severity:** High
**Priority:** High
**Environment:** Localhost (ASP.NET Core 8, PostgreSQL)
**Affected Endpoints:** 
- `POST /api/workspaces`
- `POST /api/projects`
- `POST /api/tasks`

**Steps to Reproduce:**
1. Using Postman (bypassing the React frontend), send a POST request to `/api/workspaces` with the body: `{ "name": "" }`.
2. Repeat for projects and tasks with empty titles/descriptions.

**Expected Result:**
The Backend API should independently reject the request with a `400 Bad Request`. (Backend validation is mandatory for data integrity and security, even if the frontend also validates).

**Actual Result:**
The API returns `200 OK` and successfully saves the entity with a blank string. 

**Additional Context:** 
The React frontend *does* prevent users from submitting empty names via UI validation.

---

## BUG-03: PUT Request (Update Task) ignores Title and Description fields
**Severity:** Critical
**Priority:** High
**Environment:** Localhost (ASP.NET Core 8, PostgreSQL)
**Endpoint:** `PUT /api/tasks/{taskId}`

**Steps to Reproduce:**
1. Create a valid task with a title and description.
2. Send a `PUT` request to `/api/tasks/{taskId}` to update the task.
3. Provide a new title, new description, and a new status in the JSON body.
4. Observe the response body and check the database.

**Expected Result:**
The API should return `200 OK` and the task should be updated with the new Title, Description, and Status.

**Actual Result:**
The API returns `200 OK` and only updates the `status`. The `title` and `description` remain unchanged (e.g., stuck as the old values), meaning the backend controller logic is likely failing to map/persist these fields during the update operation.

**Impact:** 
While the Kanban drag-and-drop (status update) works, users are completely unable to edit a task's title or description once it is created.