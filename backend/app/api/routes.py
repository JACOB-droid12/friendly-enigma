import sympy as sp
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.errors import InterpolationError
from app.core.parser import parse_function
from app.core.service import interpolate
from app.schemas import FunctionValidationRequest, InterpolateRequest

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "interpolation-backend",
        "version": "0.1.0",
    }


@router.post("/api/validate-function")
def validate_function(request: FunctionValidationRequest):
    try:
        parsed = parse_function(request.function)
    except InterpolationError as exc:
        return JSONResponse(status_code=400, content=exc.to_response())
    return {
        "status": "ok",
        "function": request.function,
        "normalized_expression": str(parsed.expression),
        "latex": sp.latex(parsed.expression),
        "allowed_symbols": ["x"],
    }


@router.post("/api/interpolate")
def interpolate_endpoint(request: InterpolateRequest):
    try:
        return interpolate(request)
    except InterpolationError as exc:
        return JSONResponse(status_code=400, content=exc.to_response())
