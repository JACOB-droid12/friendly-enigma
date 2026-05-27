from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr

InputMode = Literal["points", "x_values_with_function", "function_interval"]
MethodName = Literal[
    "lagrange",
    "newton",
    "barycentric",
    "neville",
    "newton_forward",
    "newton_backward",
    "stirling",
    "hermite_divided_difference",
    "hermite",
    "osculating",
    "taylor",
    "cubic_spline",
]
NodeStrategy = Literal["equally_spaced", "chebyshev_nodes", "custom_nodes"]
ResponseStatus = Literal["ok", "partial", "error"]
SplineBoundaryCondition = Literal["natural", "clamped", "not-a-knot", "periodic"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DerivativeData(StrictModel):
    x: str
    order: StrictInt = Field(ge=1, le=10)
    value: str


class TaylorMethodOptions(StrictModel):
    center: StrictStr
    order: StrictInt = Field(ge=0, le=20)


class OsculatingOrderOption(StrictModel):
    x: StrictStr
    order: StrictInt = Field(ge=0, le=10)


class OsculatingMethodOptions(StrictModel):
    orders: list[OsculatingOrderOption] = Field(default_factory=list)


class CubicSplineMethodOptions(StrictModel):
    boundary_condition: SplineBoundaryCondition = "natural"
    left_derivative: StrictStr | None = None
    right_derivative: StrictStr | None = None


class MethodOptions(StrictModel):
    taylor: TaylorMethodOptions | None = None
    cubic_spline: CubicSplineMethodOptions | None = None
    osculating: OsculatingMethodOptions | None = None


class InterpolateRequest(StrictModel):
    mode: InputMode
    points: list[list[str]] | None = None
    x_values: list[str] | None = None
    function: str | None = None
    interval: list[str] | None = None
    node_strategy: NodeStrategy | None = None
    node_count: int | None = None
    methods: list[MethodName] = Field(default_factory=lambda: ["lagrange", "newton", "barycentric"])
    precision: int = Field(default=50, ge=8, le=200)
    exact: bool | None = None
    evaluation_x: list[str] = Field(default_factory=list)
    graph: bool = False
    method_options: MethodOptions = Field(default_factory=MethodOptions)
    derivatives: list[DerivativeData] = Field(default_factory=list)


class FunctionValidationRequest(StrictModel):
    function: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class WarningBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: ErrorBody


class InterpolateResponse(BaseModel):
    status: ResponseStatus
    response_version: str = "1.0"
    metadata: dict[str, Any]
    input_summary: dict[str, Any]
    nodes: list[dict[str, Any]]
    degree: int
    polynomial: dict[str, Any]
    methods: dict[str, Any]
    evaluations: list[dict[str, Any]]
    graph_data: dict[str, Any] | None
    warnings: list[dict[str, Any]]
    educational_notes: list[str]


class FunctionValidationResponse(BaseModel):
    status: Literal["ok"] = "ok"
    function: str
    normalized_expression: str
    latex: str
    allowed_symbols: list[str]
