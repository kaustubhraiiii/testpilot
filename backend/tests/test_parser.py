import json

import pytest
import yaml

from app.services.parser import parse_openapi_spec


VALID_PETSTORE_SPEC = {
    "openapi": "3.0.0",
    "info": {
        "title": "Petstore API",
        "version": "1.0.0",
    },
    "paths": {
        "/pets": {
            "get": {
                "summary": "List all pets",
                "responses": {
                    "200": {
                        "description": "A list of pets",
                    }
                },
            },
            "post": {
                "summary": "Create a pet",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "age": {"type": "integer"},
                                },
                                "required": ["name"],
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Pet created",
                    }
                },
            },
        },
        "/pets/{petId}": {
            "get": {
                "summary": "Get a pet by ID",
                "parameters": [
                    {
                        "name": "petId",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    }
                ],
                "responses": {
                    "200": {
                        "description": "A pet",
                    }
                },
            },
        },
    },
}


def test_valid_json_spec_returns_correct_endpoint_count():
    spec_str = json.dumps(VALID_PETSTORE_SPEC)
    result = parse_openapi_spec(spec_str, spec_format="json")
    assert result["endpoints"] is not None
    assert len(result["endpoints"]) == 3


def test_valid_yaml_spec_parses_correctly():
    spec_str = yaml.dump(VALID_PETSTORE_SPEC)
    result = parse_openapi_spec(spec_str, spec_format="yaml")
    assert result["endpoints"] is not None
    assert len(result["endpoints"]) == 3
    assert result["info"]["title"] == "Petstore API"


def test_endpoint_has_required_keys():
    spec_str = json.dumps(VALID_PETSTORE_SPEC)
    result = parse_openapi_spec(spec_str, spec_format="json")
    endpoint = result["endpoints"][0]
    assert "method" in endpoint
    assert "path" in endpoint
    assert "summary" in endpoint
    assert "parameters" in endpoint
    assert "request_body" in endpoint
    assert "responses" in endpoint


def test_selected_endpoints_filter_works():
    spec_str = json.dumps(VALID_PETSTORE_SPEC)
    result = parse_openapi_spec(
        spec_str, spec_format="json", selected_endpoints=["/pets"]
    )
    assert len(result["endpoints"]) == 2
    for endpoint in result["endpoints"]:
        assert endpoint["path"] == "/pets"


def test_invalid_json_raises_value_error():
    invalid_json = "{ invalid json }"
    with pytest.raises(ValueError, match="Invalid JSON"):
        parse_openapi_spec(invalid_json, spec_format="json")


def test_missing_paths_key_raises_value_error():
    spec_without_paths = {
        "openapi": "3.0.0",
        "info": {"title": "Test", "version": "1.0.0"},
    }
    spec_str = json.dumps(spec_without_paths)
    with pytest.raises(ValueError, match="missing the required 'paths' key"):
        parse_openapi_spec(spec_str, spec_format="json")
