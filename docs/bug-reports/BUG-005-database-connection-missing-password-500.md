# Bug Report: BUG-005

## Database Connection Authentication Failure (Missing Password) Causes 500 Crash on Auth Operations

| Attribute | Details |
| :--- | :--- |
| **Bug ID** | BUG-005 |
| **Severity** | Critical |
| **Priority** | P1 |
| **Status** | Open (Documented) |
| **Component** | Backend Configuration (`Program.cs`, `appsettings.json`, `AuthController`) |
| **Environment** | Localhost (ASP.NET Core 8 Web API, PostgreSQL 16) |
| **Found In** | Layer 3: API Contract & Property-Based Fuzz Testing (Schemathesis) |

---

### Description
When the API attempts to process user authentication or registration requests requiring database access, the operation crashes with an unhandled `500 Internal Server Error`. The underlying PostgreSQL driver (`Npgsql`) rejects the connection due to missing password credentials in the connection configuration.

### Affected Endpoints
- `POST /auth/login`
- `POST /auth/register`
- Any protected endpoints requiring live database access for authorization and entity lookup

---

### Preconditions
1. Backend API is running locally (e.g., via Visual Studio or `dotnet run`).
2. PostgreSQL server is active and configured with authentication (SASL/SCRAM-SHA-256).

---

### Steps to Reproduce
1. Execute a property-based contract test using Schemathesis or a standard HTTP client (`curl`):
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "Password123!"}' \
     --insecure https://localhost:7012/auth/login
   ```
2. Alternatively, run Schemathesis test case:
   ```bash
   st run https://localhost:7012/swagger/v1/swagger.json --checks not_a_server_error
   ```
3. Inspect the response status code and stack trace.

---

### Expected Result
- **HTTP Status:** `200 OK` (with JWT token) if credentials are valid, or `401 Unauthorized` / `400 Bad Request` if invalid.
- No unhandled server-side exceptions leaking internal driver stack traces to the client.

---

### Actual Result
- **HTTP Status:** `500 Internal Server Error`
- **Response Body / Driver Trace:**
  ```text
  Npgsql.NpgsqlException (0x80004005): No password has been provided but the backend requires one (in SASL/SCRAM-SHA-256)
     at Npgsql.Internal.NpgsqlConnector.AuthenticateSASL(List`1 mechanisms, String username, Boolean async, CancellationToken cancellationToken)
     at Npgsql.Internal.NpgsqlConnector.Authenticate(String username, NpgsqlTimeout timeout, Boolean async, CancellationToken cancellationToken)
     at Npgsql.Internal.NpgsqlConnector.<Open>g__OpenCore|213_1(NpgsqlConnector conn, SslMode sslMode, NpgsqlTimeout timeout, Boolean async, CancellationToken cancellationToken)
  ```

---

### Root Cause Analysis
In `Program.cs`, the fallback default connection string specifies the database and username, but completely omits the `Password=` parameter:
```csharp
connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=teamopsdb;Username=teamops"; // Missing Password
```
When running locally outside Docker (or when environment variables are not injected by Docker Compose), `Npgsql` connects without a password token, triggering a SCRAM-SHA-256 authentication rejection from PostgreSQL.

---

### Remediation
1. Provide a valid password in `appsettings.Development.json` or local user secrets:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=opteamus;Username=postgres;Password=<your_password>"
   }
   ```
2. Update the fallback string in `Program.cs` to handle development environments safely or fail fast during application startup with a clear configuration validation exception rather than crashing mid-request on endpoint execution.

