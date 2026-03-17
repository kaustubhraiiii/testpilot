import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app as _fastapi_app


async def app(scope, receive, send):
    """ASGI wrapper that strips the /api prefix before forwarding to FastAPI."""
    if scope["type"] == "http":
        path = scope.get("path", "")
        if path.startswith("/api"):
            scope = {**scope, "path": path[4:] or "/", "raw_path": (path[4:] or "/").encode()}
    await _fastapi_app(scope, receive, send)
