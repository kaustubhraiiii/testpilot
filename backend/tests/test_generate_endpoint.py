import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.mark.asyncio
async def test_generate_endpoint_valid_spec_returns_200():
    spec = {
        "openapi": "3.0.0",
        "info": {"title": "Test API", "version": "1.0.0"},
        "paths": {
            "/test": {
                "get": {
                    "summary": "Test endpoint",
                    "responses": {"200": {"description": "OK"}},
                }
            }
        },
    }

    mock_test_cases = [
        {
            "test_name": "test_happy_path",
            "description": "Happy path test",
            "test_type": "happy_path",
            "priority": "high",
            "code": "def test_happy_path(): pass",
        }
    ]

    with patch(
        "app.routes.generate.generate_test_cases",
        new_callable=AsyncMock,
        return_value=mock_test_cases,
    ):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/generate",
                json={
                    "spec_content": json.dumps(spec),
                    "spec_format": "json",
                    "test_framework": "pytest",
                },
            )
    assert response.status_code == 200
    data = response.json()
    assert "test_cases" in data
    assert len(data["test_cases"]) == 1
    assert data["endpoint_count"] == 1
    assert data["framework"] == "pytest"


@pytest.mark.asyncio
async def test_generate_endpoint_invalid_spec_returns_400():
    invalid_spec = "{ invalid json }"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/generate",
            json={
                "spec_content": invalid_spec,
                "spec_format": "json",
                "test_framework": "pytest",
            },
        )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
