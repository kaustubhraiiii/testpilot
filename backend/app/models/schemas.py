from typing import Literal, Optional

from pydantic import BaseModel


class GenerateRequest(BaseModel):
    spec_content: str
    spec_format: Literal["json", "yaml"] = "json"
    test_framework: Literal["pytest", "jest", "playwright", "cypress"] = "pytest"
    selected_endpoints: Optional[list[str]] = None


class TestCase(BaseModel):
    test_name: str
    description: str
    test_type: str
    priority: Literal["high", "medium", "low"]
    code: str


class EndpointInfo(BaseModel):
    method: str
    path: str
    summary: Optional[str] = None
    parameters: list[dict] = []
    request_body: Optional[dict] = None
    responses: dict


class GenerateResponse(BaseModel):
    endpoint_count: int
    test_cases: list[TestCase]
    framework: str
    generation_time_seconds: float
