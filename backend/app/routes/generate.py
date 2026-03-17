import time

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.models.schemas import GenerateRequest, GenerateResponse, TestCase
from app.prompts.templates import build_generation_prompt
from app.services.generator import generate_test_cases
from app.services.parser import parse_openapi_spec

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
@limiter.limit("10/minute")
async def generate_tests(body: GenerateRequest, request: Request):
    try:
        start = time.time()

        parsed = parse_openapi_spec(
            spec_content=body.spec_content,
            spec_format=body.spec_format,
            selected_endpoints=body.selected_endpoints,
        )

        prompt = build_generation_prompt(
            endpoints=parsed["endpoints"],
            test_framework=body.test_framework,
            spec_title=parsed["info"].get("title", ""),
        )

        raw_cases = await generate_test_cases(prompt)

        test_cases = [TestCase(**tc) for tc in raw_cases]

        elapsed = time.time() - start

        return GenerateResponse(
            endpoint_count=len(parsed["endpoints"]),
            test_cases=test_cases,
            framework=body.test_framework,
            generation_time_seconds=round(elapsed, 2),
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
