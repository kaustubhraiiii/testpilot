# Prompt templates for LLM-based test generation

import json


SYSTEM_PROMPT = ""
# TODO: define system prompt for test generation

USER_PROMPT_TEMPLATE = ""
# TODO: define user prompt template with placeholders for endpoint details


FRAMEWORK_NOTES = {
    "pytest": (
        "Use httpx.AsyncClient for async tests or the requests library for sync tests. "
        "Import and configure the client pointing to the base URL. "
        "Use pytest.mark.asyncio for async tests."
    ),
    "jest": (
        "Use supertest to make HTTP requests. Import supertest and your Express app. "
        "Use describe/it blocks. Use expect() assertions."
    ),
    "playwright": (
        "Use Playwright API testing via request context. "
        "Use test() and expect() from @playwright/test. "
        "Use request.get(), request.post(), etc. with full URLs."
    ),
    "cypress": (
        "Use cy.request() to make HTTP calls. "
        "Use describe/it blocks. Assert on response.status and response.body."
    ),
}

TEST_TYPES = [
    "happy path",
    "missing required fields",
    "invalid data types",
    "unauthorized access (if authentication is required by the endpoint)",
    "boundary values for numeric or string parameters",
    "empty request body",
    "wrong HTTP method",
]


def build_generation_prompt(
    endpoints: list[dict],
    test_framework: str,
    spec_title: str,
) -> str:
    framework_note = FRAMEWORK_NOTES.get(
        test_framework,
        f"Use the {test_framework} framework's standard HTTP testing utilities.",
    )
    endpoints_json = json.dumps(endpoints, indent=2)

    prompt = f"""You are an expert software test engineer. Your task is to generate a complete, runnable test suite for the API described below.

API TITLE: {spec_title}
TEST FRAMEWORK: {test_framework}

FRAMEWORK-SPECIFIC INSTRUCTIONS:
{framework_note}

ENDPOINTS TO TEST:
{endpoints_json}

TASK:
For each endpoint listed above, generate tests covering ALL of the following test types where applicable:
- happy path (valid request, expect success response)
- missing required fields (omit one or more required params/body fields, expect 4xx)
- invalid data types (send wrong types for fields, expect 4xx)
- unauthorized access (if the endpoint has auth requirements, send no or invalid credentials, expect 401 or 403)
- boundary values (test min/max lengths for strings, min/max values for numbers)
- empty request body (send an empty object or no body when a body is expected, expect 4xx)
- wrong HTTP method (call the endpoint with an incorrect HTTP verb, expect 405 or 404)

RULES:
1. Output ONLY a raw JSON array. No markdown, no code fences, no backticks, no explanation before or after.
2. Each element in the array must be a JSON object with exactly these keys:
   - "test_name": short snake_case identifier (e.g. "create_user_happy_path")
   - "description": one sentence describing what the test verifies
   - "test_type": one of: happy_path, missing_required_fields, invalid_data_types, unauthorized_access, boundary_values, empty_request_body, wrong_http_method
   - "priority": one of: high, medium, low
   - "code": a string containing the complete, self-contained, runnable test code for {test_framework}
3. Use realistic mock data (real-looking names, emails, UUIDs, numbers) — not placeholder strings like "string" or "example".
4. Each test's "code" must be fully self-contained and runnable without modification beyond setting the base URL.
5. Prioritize happy path and auth tests as "high", edge cases as "medium", and wrong method tests as "low".
6. Do not skip any endpoint. Generate at least one test per test type per endpoint (skip only if clearly not applicable, e.g. no auth means skip unauthorized_access).

OUTPUT FORMAT (strict):
[
  {{
    "test_name": "...",
    "description": "...",
    "test_type": "...",
    "priority": "...",
    "code": "..."
  }},
  ...
]

Begin output now. Output the JSON array only."""

    return prompt
