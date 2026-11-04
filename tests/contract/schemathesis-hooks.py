import os
import requests
import schemathesis

TOKEN = None

def get_auth_token(base_url: str) -> str:
    global TOKEN
    if TOKEN:
        return TOKEN

    email = os.getenv("TEST_USER_EMAIL", "contract_test_user@example.com")
    password = os.getenv("TEST_USER_PASSWORD", "Password123!")

    # Ensure URL doesn't have trailing slash
    base = base_url.rstrip("/")

    # 1. Attempt to register first (in case fresh database)
    try:
        requests.post(
            f"{base}/auth/register",
            json={
                "firstName": "Contract",
                "lastName": "Tester",
                "email": email,
                "password": password,
            },
            timeout=5,
        )
    except Exception:
        pass

    # 2. Login to retrieve JWT Bearer token
    try:
        resp = requests.post(
            f"{base}/auth/login",
            json={"email": email, "password": password},
            timeout=5,
        )
        if resp.status_code == 200:
            TOKEN = resp.json().get("token")
            return TOKEN
    except Exception as e:
        print(f"[schemathesis-hook] Login error: {e}")

    return None

@schemathesis.hook
def before_call(context, case):
    # Skip auth injection for registration and login endpoints
    path = getattr(case, "path", "")
    if path in ["/auth/login", "/auth/register", "/api/test/public"]:
        return

    base_url = getattr(case, "base_url", None) or os.getenv("API_BASE_URL", "http://localhost:8080")
    token = get_auth_token(base_url)
    if token:
        case.headers["Authorization"] = f"Bearer {token}"
