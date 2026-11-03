# Bug Report: BUG-002

## Backend API Lacks Server-Side Validation for Empty Strings (Client-Side Only Validation)

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-002 |
| **Severity** | High |
| **Priority** | P2 |
| **Status** | Open (Documented) |
| **Component** | Backend API (WorkspaceController, ProjectController, TaskController) |
| **Environment** | Localhost (ASP.NET Core 8 Web API, PostgreSQL) |
| **Found In** | Layer 2: API Functional & Boundary Testing (Postman) |

---

### Description
The React frontend prevents users from submitting empty workspace, project, or task names via form validation. However, when calling the REST API directly (bypassing the UI via Postman or automated scripts), the backend accepts empty strings `""` or whitespace `"   "`, returning `200 OK` or `201 Created` and persisting empty records into the PostgreSQL database.

### Affected Endpoints
- `POST /api/workspaces`
- `POST /api/projects`
- `POST /api/tasks`

---

### Preconditions
1. Backend API and PostgreSQL database are running.
2. User is authenticated and possesses a valid JWT Bearer token.

---

### Steps to Reproduce
1. In Postman, send a `POST` request to `/api/workspaces` with an empty name payload:
   ```json
   {
     "name": ""
   }
   ```
2. Repeat for `/api/projects` with empty `"name"` and `/api/tasks` with empty `"title"`.
3. Query the PostgreSQL database directly via pgAdmin:
   ```sql
   SELECT id, name FROM "Workspaces" WHERE TRIM(name) = '';
   ```

---

### Expected Result
- **HTTP Status:** `400 Bad Request`
- **Response Body:**
  ```json
  {
    "status": 400,
    "errors": {
      "Name": ["The Name field is required and cannot be empty or whitespace."]
    }
  }
  ```
- **Database:** No blank or whitespace-only records are inserted.

---

### Actual Result
- **HTTP Status:** `200 OK` / `201 Created`
- **Database:** Blank entities are permanently committed to the database, resulting in orphan/unusable UI tiles on the frontend Kanban board.

---

### Root Cause Analysis
DTO models lack DataAnnotation validation attributes or FluentValidation rules:
```csharp
// Current DTO:
public class CreateWorkspaceDto
{
    public string Name { get; set; } = string.Empty; // No [Required] or [MinLength]
}
```

---

### Remediation
1. Add DataAnnotations or FluentValidation to the DTOs:
   ```csharp
   public class CreateWorkspaceDto
   {
       [Required(ErrorMessage = "Workspace name is required.")]
       [MinLength(1, ErrorMessage = "Workspace name cannot be empty.")]
       public string Name { get; set; }
   }
   ```
2. Verify model state validity in controllers or rely on `[ApiController]` automatic 400 responses.