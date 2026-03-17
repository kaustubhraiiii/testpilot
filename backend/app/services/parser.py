import json
from typing import Optional

import yaml

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options", "trace"}


def parse_openapi_spec(
    spec_content: str,
    spec_format: str = "json",
    selected_endpoints: Optional[list[str]] = None,
) -> dict:
    """Parse an OpenAPI 3.0 or Swagger 2.0 spec and extract endpoint info.

    Returns a dict with "info" and "endpoints" keys.
    """
    # 1. Deserialize
    try:
        # Clean up the input: remove control characters and normalize whitespace
        spec_content = spec_content.strip()

        if spec_format == "yaml":
            spec = yaml.safe_load(spec_content)
        else:
            # For JSON, remove any problematic control characters except standard whitespace
            spec_content = "".join(c for c in spec_content if ord(c) >= 32 or c in "\n\r\t")
            spec = json.loads(spec_content)
    except (json.JSONDecodeError, yaml.YAMLError) as exc:
        raise ValueError(f"Invalid {spec_format.upper()} content: {exc}") from exc

    if not isinstance(spec, dict):
        raise ValueError("Spec must be a JSON/YAML object, not a scalar or array")

    # 2. Validate required keys
    if "paths" not in spec:
        raise ValueError("Spec is missing the required 'paths' key")

    # 3. Extract top-level info
    raw_info = spec.get("info", {})
    info = {
        "title": raw_info.get("title", ""),
        "version": raw_info.get("version", ""),
    }

    is_swagger2 = "swagger" in spec

    # 4. Walk paths and operations
    endpoints = []
    for path, path_item in spec["paths"].items():
        if not isinstance(path_item, dict):
            continue

        # Filter if caller only wants specific paths
        if selected_endpoints is not None and path not in selected_endpoints:
            continue

        # Path-level parameters apply to every operation under this path
        path_params = path_item.get("parameters", [])

        for method, operation in path_item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue

            # Merge path-level + operation-level params (operation wins on conflict)
            op_params = operation.get("parameters", [])
            merged_params = _merge_parameters(path_params, op_params)

            # Extract request body
            request_body = _extract_request_body(operation, merged_params, is_swagger2)

            # For the params list, strip out body params (already captured above)
            if is_swagger2:
                merged_params = [p for p in merged_params if p.get("in") != "body"]

            endpoints.append({
                "method": method.upper(),
                "path": path,
                "summary": operation.get("summary", ""),
                "parameters": merged_params,
                "request_body": request_body,
                "responses": operation.get("responses", {}),
            })

    return {"info": info, "endpoints": endpoints}


def _merge_parameters(path_params: list, op_params: list) -> list:
    """Merge path-level and operation-level parameters.

    Operation params override path params with the same name+in combination.
    """
    merged: dict[tuple, dict] = {}
    for p in path_params:
        key = (p.get("name"), p.get("in"))
        merged[key] = p
    for p in op_params:
        key = (p.get("name"), p.get("in"))
        merged[key] = p
    return list(merged.values())


def _extract_request_body(
    operation: dict, params: list, is_swagger2: bool
) -> Optional[dict]:
    """Extract the request body from an operation.

    OpenAPI 3.0 uses 'requestBody'; Swagger 2.0 uses a body parameter.
    """
    if is_swagger2:
        for p in params:
            if p.get("in") == "body":
                return p.get("schema")
        return None
    return operation.get("requestBody")
