import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
from mangum import Mangum

# api_gateway_base_path strips "/api" before FastAPI sees the request,
# so the existing route "/generate" matches without any router changes.
handler = Mangum(app, lifespan="off", api_gateway_base_path="/api")
