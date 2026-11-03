# Bug Report: BUG-003

## PUT /api/tasks/{taskId} Silently Ignores Title and Description Updates

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-003 |
| **Severity** | Critical |
| **Priority** | P1 |
| **Status** | Open (Documented) |
| **Component** | Backend API (TaskController) |
| **Environment** | Localhost (ASP.NET Core 8 Web API, PostgreSQL) |
| **Found In** | Layer 2: API Testing (Postman) & Layer 3: Database Verification |

---

### Description
When submitting a `PUT /api/tasks/{taskId}` request to update task details (Title, Description, Status), the endpoint returns `200 OK`, but only updates the `status` column in the database. The `title` and `description` fields remain unchanged.

### Affected Endpoints
- `PUT /api/tasks/{taskId}`

---

### Preconditions
1. A valid workspace, project, and task exist in the database.
2. User is authenticated as a workspace member with write permissions.

---

### Steps to Reproduce
1. Create a task with original data:
   - Title: `"Original Task Title"`
   - Description: `"Original Description"`
   - Status: `"To Do"`
2. Send a `PUT` request to `/api/tasks/{taskId}` with updated information:
   ```json
   {
     "title": "Updated Task Title",
     "description": "Updated Description with new acceptance criteria",
     "status": "In Progress"
   }
   ```
3. Observe the response payload.
4. Execute a `GET /api/tasks/{taskId}` or query the PostgreSQL database:
   ```sql
   SELECT id, title, description, status FROM "Tasks" WHERE id = '<taskId>';
   ```

---

### Expected Result
- **HTTP Status:** `200 OK`
- **Response / Database:**
  - `title` updated to `"Updated Task Title"`
  - `description` updated to `"Updated Description with new acceptance criteria"`
  - `status` updated to `"In Progress"`

---

### Actual Result
- **HTTP Status:** `200 OK`
- **Database:**
  - `status` is updated to `"In Progress"`.
  - `title` is still `"Original Task Title"`.
  - `description` is still `"Original Description"`.
  - The API silently discards the user's title and description edits without warning or error.

---

### Impact
Users can drag-and-drop cards between Kanban columns (which changes status), but are completely prevented from modifying task titles or acceptance criteria descriptions after task creation.

---

### Root Cause Analysis
In `TaskController.cs`, the update action assigns only the incoming status property to the retrieved entity, omitting the mapping of `Title` and `Description`:
```csharp
// Incomplete property assignment:
existingTask.Status = dto.Status;
// Missing:
// existingTask.Title = dto.Title;
// existingTask.Description = dto.Description;
await _context.SaveChangesAsync();
```

---

### Remediation
Update the controller mapping logic to update all mutable task fields:
```csharp
existingTask.Title = dto.Title ?? existingTask.Title;
existingTask.Description = dto.Description ?? existingTask.Description;
existingTask.Status = dto.Status;
await _context.SaveChangesAsync();
```