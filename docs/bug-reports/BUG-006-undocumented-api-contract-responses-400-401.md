# Bug Report: BUG-006

## Undocumented API Contract Status Codes (400 Bad Request and 401 Unauthorized) Violate OpenAPI Specification

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-006 |
| **Severity** | Medium |
| **Priority** | P2 |
| **Status** | Open (Documented) |
| **Component** | Backend API Controllers & Swagger Generation (`AuthController`, `WorkspaceController`, `ProjectController`, `TaskController`, `MembershipController`) |
| **Environment** | ASP.NET Core 8 Web API / Swashbuckle OpenAPI 3.0.4 |
| **Found In** | Layer 3: API Contract & Property-Based Fuzz Testing (Schemathesis ST103) |

---

### Description
The generated OpenAPI specification (`swagger.json`) exclusively documents `200 OK` responses across API endpoints. However, the application produces `400 Bad Request` responses for payload validation errors and `401 Unauthorized` responses for unauthenticated requests. 

Because these response codes are omitted from the OpenAPI contract, any strict client SDK generator or contract verification runner flags them as contract violations (`ST103: Undocumented status code`).

### Affected Endpoints
- **401 Unauthorized undocumented across 13 endpoints:**
  - `DELETE /api/tasks/{id}`
  - `GET /api/members/workspace/{workspaceId}`
  - `GET /api/projects/workspace/{workspaceId}`
  - `GET /api/tasks/project/{projectId}`
  - `GET /api/test/admin-only`
  - `GET /api/test/protected`
  - `GET /api/workspaces`
  - `GET /auth/me`
  - `POST /api/members/invite`
  - `POST /api/projects`
  - `POST /api/tasks`
  - `POST /api/workspaces`
  - `PUT /api/tasks/{id}`
- **400 Bad Request undocumented across input-validated endpoints:**
  - `POST /auth/login`
  - `POST /auth/register`
  - `POST /api/projects`
  - `POST /api/tasks`
  - `POST /api/workspaces`

---

### Preconditions
1. API is running and serving OpenAPI specification at `/swagger/v1/swagger.json`.

---

### Steps to Reproduce
1. Execute contract conformance validation using Schemathesis:
   ```bash
   st run https://localhost:7012/swagger/v1/swagger.json `
     --checks status_code_conformance
   ```
2. Observe `ST103 Undocumented status code` failures when sending unauthenticated requests or invalid request bodies.

---

### Expected Result
- The OpenAPI specification accurately documents all potential status codes an endpoint can return under normal operation:
  - `400 Bad Request` with `ProblemDetails` schema for invalid input data.
  - `401 Unauthorized` for endpoints decorated with `[Authorize]`.
  - `404 Not Found` for endpoints querying entity identifiers.

---

### Actual Result
- **OpenAPI Schema (`swagger.json`):** Only lists `200 OK`.
- **Runtime Response:** Returns `400 Bad Request` or `401 Unauthorized`.
- **Contract Verification Result:** 17 failures with `ST103 Undocumented status code`.

---

### Root Cause Analysis
ASP.NET Core controller actions lack response type metadata attributes. By default, Swashbuckle only infers `200 OK` unless explicitly declared via `[ProducesResponseType]` or conventional filters.

```csharp
[HttpPost("login")]
// Missing: [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
// Missing: [ProducesResponseType(StatusCodes.Status400BadRequest)]
// Missing: [ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> Login(LoginRequest request) { ... }
```

---

### Remediation
1. Annotate controller actions or controllers with explicit `[ProducesResponseType]` attributes:
   ```csharp
   [ProducesResponseType(StatusCodes.Status200OK)]
   [ProducesResponseType(StatusCodes.Status400BadRequest)]
   [ProducesResponseType(StatusCodes.Status401Unauthorized)]
   ```
2. Or configure a global Swagger operation filter in `Program.cs` that automatically appends `401 Unauthorized` responses to all actions guarded by `[Authorize]`, and `400 Bad Request` to all actions accepting a request body.

