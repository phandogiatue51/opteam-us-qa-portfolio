# Bug Report: BUG-001

## API Returns 500 Internal Server Error Instead of 404 for Missing Resources

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-001 |
| **Severity** | High |
| **Priority** | P1 |
| **Status** | Open (Documented) |
| **Component** | Backend API (ProjectController, MembershipController) |
| **Environment** | Localhost (ASP.NET Core 8 Web API, PostgreSQL) |
| **Found In** | Layer 2: API Functional & Boundary Testing (Postman) |

---

### Description
When making API calls with non-existent GUIDs (e.g., non-existent `workspaceId`), several endpoints fail with an unhandled exception resulting in `500 Internal Server Error` instead of properly returning `404 Not Found`.

### Affected Endpoints
- `POST /api/projects` (with invalid `workspaceId`)
- `GET /api/projects/workspace/{workspaceId}` (with invalid `workspaceId`)
- `POST /api/members/invite` (with invalid `workspaceId`)
- `GET /api/members/workspace/{workspaceId}` (with invalid `workspaceId`)

---

### Preconditions
1. Backend API and PostgreSQL database are running.
2. User is authenticated and possesses a valid JWT Bearer token.

---

### Steps to Reproduce
1. In Postman, set the `Authorization` header to `Bearer <valid_token>`.
2. Send a `POST` request to `/api/projects` with a randomly generated non-existent Workspace ID:
   ```json
   {
     "name": "QA Test Project",
     "description": "Boundary test",
     "workspaceId": "00000000-0000-0000-0000-000000000000"
   }
   ```
3. Observe the response status code and response body.

---

### Expected Result
- **HTTP Status:** `404 Not Found`
- **Response Body:**
  ```json
  {
    "status": 404,
    "title": "Not Found",
    "detail": "Workspace with ID '00000000-0000-0000-0000-000000000000' was not found."
  }
  ```

---

### Actual Result
- **HTTP Status:** `500 Internal Server Error`
- **Response Body:** Unhandled server exception stack trace disclosing server runtime internals.

---

### Root Cause Analysis
The controller directly accesses relations on the result of `_context.Workspaces.FindAsync(workspaceId)` without a null-check guard:
```csharp
var workspace = await _context.Workspaces.FindAsync(dto.WorkspaceId);
// Missing: if (workspace == null) return NotFound("Workspace not found.");
// Accessing workspace properties throws NullReferenceException -> 500
```

---

### Remediation
1. Implement defensive null checks at the beginning of each controller action:
   ```csharp
   var workspace = await _context.Workspaces.FindAsync(workspaceId);
   if (workspace == null)
   {
       return NotFound(new { message = $"Workspace '{workspaceId}' not found." });
   }
   ```
2. Add global exception handling middleware using ASP.NET Core `UseExceptionHandler` or `ProblemDetails`.
