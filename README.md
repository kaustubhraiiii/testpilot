# TestPilot

AI-powered test case generator that converts OpenAPI/Swagger specs into runnable test code.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
![License](https://img.shields.io/badge/License-MIT-green)

## What It Does

Paste an OpenAPI or Swagger spec, pick your test framework, and TestPilot generates ready-to-run test cases covering happy paths, edge cases, error handling, auth failures, and boundary values.

**Supported frameworks:** pytest, Jest, Playwright, Cypress

**Supported spec formats:** OpenAPI 3.0 (JSON/YAML), Swagger 2.0 (JSON/YAML)

## Live Demo

[testpilot.vercel.app](https://testpilot.vercel.app) *(update with your actual URL)*

## How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│  Paste spec  │ ──▶ │  Parse endpoints │ ──▶ │  OpenAI API │ ──▶ │  Test cases  │
│  (JSON/YAML) │     │  & schemas       │     │  (GPT-4o)   │     │  as code     │
└──────────────┘     └──────────────────┘     └─────────────┘     └──────────────┘
```

1. You paste an OpenAPI/Swagger spec into the editor
2. The backend parses it and extracts endpoints, parameters, request bodies, and response schemas
3. A structured prompt is built and sent to OpenAI's API
4. The LLM generates runnable test cases for your chosen framework
5. Results are displayed as copyable code blocks

## Tech Stack

**Backend:** Python, FastAPI, Pydantic, OpenAI API, SlowAPI (rate limiting)

**Frontend:** React 18, TypeScript, Vite, Axios

**Testing:** pytest, httpx, Playwright (E2E)

**Infrastructure:** Docker, Docker Compose, GitHub Actions CI/CD

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- An OpenAI API key

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
uvicorn app.main:app --reload
```

The API will be running at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

### Docker (Both Services)

```bash
cp .env.example .env
# Add your OPENAI_API_KEY to .env
docker-compose up --build
```

Frontend at `http://localhost:3000`, backend at `http://localhost:8000`.

## Running Tests

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend E2E Tests

```bash
cd frontend
npx playwright test
```

## API Usage

### POST /generate

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "spec_content": "{\"openapi\":\"3.0.0\",\"info\":{\"title\":\"Sample\",\"version\":\"1.0\"},\"paths\":{\"/pets\":{\"get\":{\"summary\":\"List pets\",\"responses\":{\"200\":{\"description\":\"OK\"}}}}}}",
    "spec_format": "json",
    "test_framework": "pytest"
  }'
```

### Request Body

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `spec_content` | string | required | Raw OpenAPI/Swagger spec |
| `spec_format` | `"json"` \| `"yaml"` | `"json"` | Format of the spec |
| `test_framework` | `"pytest"` \| `"jest"` \| `"playwright"` \| `"cypress"` | `"pytest"` | Target test framework |
| `selected_endpoints` | string[] | null | Filter to specific paths |

### Response

```json
{
  "endpoint_count": 3,
  "framework": "pytest",
  "generation_time_seconds": 4.2,
  "test_cases": [
    {
      "test_name": "test_get_pets_happy_path",
      "description": "Verify GET /pets returns 200 with valid response",
      "test_type": "happy_path",
      "priority": "high",
      "code": "async def test_get_pets_happy_path():\n    ..."
    }
  ]
}
```

## Project Structure

```
testpilot/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, rate limiting
│   │   ├── routes/
│   │   │   └── generate.py    # POST /generate endpoint
│   │   ├── services/
│   │   │   ├── parser.py      # OpenAPI/Swagger spec parser
│   │   │   └── generator.py   # OpenAI API integration
│   │   ├── models/
│   │   │   └── schemas.py     # Pydantic request/response models
│   │   └── prompts/
│   │       └── templates.py   # LLM prompt templates
│   ├── tests/
│   │   ├── test_parser.py
│   │   └── test_generate_endpoint.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── App.css
│   ├── e2e/
│   │   └── testpilot.spec.ts
│   ├── Dockerfile
│   └── playwright.config.ts
├── docker-compose.yml
└── README.md
```

## Try It With This Sample Spec

Save this as `sample.json` and paste it into the app:

```json
{
  "openapi": "3.0.0",
  "info": { "title": "Pet Store", "version": "1.0.0" },
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "parameters": [
          { "name": "limit", "in": "query", "schema": { "type": "integer" } }
        ],
        "responses": { "200": { "description": "A list of pets" } }
      },
      "post": {
        "summary": "Create a pet",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name"],
                "properties": {
                  "name": { "type": "string" },
                  "age": { "type": "integer" }
                }
              }
            }
          }
        },
        "responses": { "201": { "description": "Pet created" } }
      }
    },
    "/pets/{petId}": {
      "get": {
        "summary": "Get a pet by ID",
        "parameters": [
          { "name": "petId", "in": "path", "required": true, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": { "description": "A single pet" },
          "404": { "description": "Pet not found" }
        }
      }
    }
  }
}
```

## License

MIT
