# Bug Report: BUG-004

## Missing Foreign Key / Role Validation when Adding Workspace Members

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-004 |
| **Severity** | Medium |
| **Priority** | P2 |
| **Status** | Open (Documented) |
| **Component** | Backend API (MembershipController) |
| **Environment** | Localhost (ASP.NET Core 8 Web API, PostgreSQL) |
| **Found In** | Layer 2: API Boundary Testing (Postman) |

---

### Description
When inviting/adding members to a workspace via `POST /api/members/invite`, the endpoint lacks rigorous input validation for user email existence and role constraints before initiating database operations, leading to unhandled database foreign key constraint exceptions.

### Affected Endpoints
- `POST /api/members/invite`

---

### Preconditions
1. User is authenticated and is an Owner/Admin of the workspace.
2. A valid workspace exists.

---

### Steps to Reproduce
1. In Postman, send a `POST` request to `/api/members/invite` with an unregistered email:
   ```json
   {
     "workspaceId": "{{workspaceId}}",
     "email": "nonexistent_user_99999@opteamus.test",
     "role": "SuperAdminInvalid"
   }
   ```
2. Observe the HTTP status code and response payload.

---

### Expected Result
- **HTTP Status:** `400 Bad Request` or `404 Not Found`
- **Response Body:**
  ```json
  {
    "status": 404,
    "message": "User with email 'nonexistent_user_99999@opteamus.test' does not exist."
  }
  ```

---

### Actual Result
- **HTTP Status:** `500 Internal Server Error`
- **Response Body:** Database foreign key violation or null dereference exception.

---

### Remediation
1. Verify user existence via `UserManager<User>.FindByEmailAsync(email)` before persisting the workspace membership.
2. Validate the `role` against an enumerated whitelist (`Owner`, `Admin`, `Member`, `Viewer`).