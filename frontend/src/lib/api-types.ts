// Types matching the backend API contract exactly

export type InputMode = "points" | "x_values_with_function" | "function_interval"
export type MethodName =
  | "lagrange"
  | "newton"
  | "barycentric"
  | "neville"
  | "newton_forward"
  | "newton_backward"
  | "stirling"
  | "hermite_divided_difference"
  | "hermite"
  | "osculating"
  | "taylor"
  | "cubic_spline"
export type NodeStrategy = "equally_spaced" | "chebyshev_nodes" | "custom_nodes"
export type ResponseStatus = "ok" | "partial" | "error"

// Phase 2 request-side types (additive; documented in docs/API_CONTRACT.md)

export interface DerivativeEntry {
  x: string                  // string at API boundary (R1.4)
  order: number              // integer 1..10 per contract; 1 for current Hermite
  value: string              // string at API boundary (R1.4)
}

export interface TaylorMethodOptions {
  center: string             // numeric string (R1.4)
  order: number              // integer 0..20
}

export type SplineBoundaryCondition = "natural" | "clamped" | "not-a-knot" | "periodic"

export interface OsculatingOrderOption {
  x: string
  order: number
}

export interface OsculatingMethodOptions {
  orders: OsculatingOrderOption[]
}

export interface CubicSplineMethodOptions {
  boundary_condition: SplineBoundaryCondition
  left_derivative?: string
  right_derivative?: string
}

export interface MethodOptions {
  taylor?: TaylorMethodOptions
  cubic_spline?: CubicSplineMethodOptions
  osculating?: OsculatingMethodOptions
}

// Request types

export interface InterpolateRequest {
  mode: InputMode
  points?: string[][]
  x_values?: string[]
  function?: string
  interval?: string[]
  node_strategy?: NodeStrategy
  node_count?: number
  methods: MethodName[]
  precision: number
  exact: boolean | null
  evaluation_x: string[]
  graph: boolean
  method_options?: MethodOptions
  derivatives?: DerivativeEntry[]
}

export interface FunctionValidationRequest {
  function: string
}

// Response types

export interface ErrorBody {
  code: string
  message: string
  details: Record<string, unknown>
}

export interface WarningBody {
  code: string
  message: string
  details: Record<string, unknown>
}

export interface ErrorResponse {
  status: "error"
  error: ErrorBody
}

export interface NodeEntry {
  index: number
  x: string
  y: string
}

export interface EvaluationEntry {
  x: string
  best_P_x: string
  best_method: string
  method_values: Record<string, string | null>
  f_x: string | null
  absolute_error: string | null
  warnings: WarningBody[]
}

export interface PolynomialData {
  expanded: string | null
  factored: string | null
  lagrange_form: string | null
  newton_form: string | null
  // Phase 2 additions (R2.4): present on responses that include a Hermite
  // (`methods.hermite`) or Taylor (`methods.taylor`) result; null otherwise.
  hermite_form: string | null
  taylor_form: string | null
  latex_expanded: string | null
  latex_lagrange: string | null
  latex_newton: string | null
  // Phase 2 additions (R2.4): LaTeX counterparts of `hermite_form` and
  // `taylor_form`; null otherwise.
  latex_hermite: string | null
  latex_taylor: string | null
  // Phase 2 (R9.3 / design.md §5.4): in addition to the V1 reasons, this
  // field may also carry "piecewise_method_no_global_polynomial" when the
  // response's only construction is a cubic spline. The type stays
  // `string | null` because the renderer renders the reason text directly.
  expanded_omitted_reason: string | null
}

export interface LagrangeResult {
  status: string
  basis_polynomials: Array<{
    index: number
    x_i: string
    basis: string
    expanded: string
    latex: string
  }>
  summation_form: string
  expanded: string | null
  latex_expanded: string | null
  latex_lagrange: string | null
  evaluations: Array<{ x: string; value: string }>
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface NewtonResult {
  status: string
  divided_difference_table: Array<Array<string | null>>
  coefficients: string[]
  nested_form: string
  expanded: string | null
  latex_expanded: string | null
  latex_newton: string | null
  evaluations: Array<{ x: string; value: string }>
  steps: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface BarycentricResult {
  status: string
  weights: Array<{ index: number; x: string; weight: string }>
  evaluations: Array<{ x: string; value: string }>
  notes: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface NevilleResult {
  status: string
  target_results: Array<{ x: string; value: string }>
  tables: Array<{ x: string; rows: Array<Array<string | null>> }>
  warnings: WarningBody[]
  error: ErrorBody | null
}

// Phase 2 Equal-Spacing Family response types
// Field names match docs/API_CONTRACT.md "P2.1 Equal-Spacing Methods" verbatim.

export interface FiniteDifferenceTerm {
  order: number
  value: string
}

export interface EvaluationTargetGuidance {
  recommended: string        // method name string from backend
  target: string
  left: string
  right: string
  midpoint: string
}

export interface EqualSpacingEvaluation {
  x: string
  s: string
  value: string
  terms?: FiniteDifferenceTerm[]
  target_guidance?: EvaluationTargetGuidance
}

// Per the live backend contract: on a method-level error response
// (e.g. `status: "error"` with `error.code === "unequal_spacing"`),
// the backend OMITS every collection / scalar field below — only
// `status`, `warnings`, and `error` are guaranteed to be present.
// The fields are therefore marked optional (`?:`) so the type system
// encodes the runtime contract; family renderers must guard each
// consumer with `?? []` / `?.` and skip sections whose source data
// is undefined or empty (`docs/HANDOFF.md` browser QA fix).

export interface NewtonForwardResult {
  status: string
  forward_difference_table?: Array<Array<string | null>>
  spacing_h?: string
  anchor_index?: number
  evaluations?: EqualSpacingEvaluation[]
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface NewtonBackwardResult {
  status: string
  backward_difference_table?: Array<Array<string | null>>
  spacing_h?: string
  anchor_index?: number
  evaluations?: EqualSpacingEvaluation[]
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface StirlingResult {
  status: string
  centered_difference_table?: Array<Array<string | null>>
  spacing_h?: string
  center_index?: number
  center_x?: string
  evaluations?: EqualSpacingEvaluation[]
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

// Phase 2 Derivative-Data Family response types
// Field names match docs/API_CONTRACT.md "P2.2 Derivative-Data Methods"
// verbatim. Per locked decision 2 (tasks.md) and design.md §16 question 2,
// `HermiteBasisFormOmitted` carries only the `status: "omitted"`
// discriminant; the omission state is surfaced via the
// `expanded_polynomial_omitted` warning whose
// `details.artifact === "hermite_basis_form"`.

export interface RepeatedNode {
  index: number
  source_node_index: number
  x: string
  y: string
  first_derivative?: string  // contract shows this on Hermite first-derivative case
}

export interface HermiteBasisTerm {
  node_index: number
  x: string
  f_x: string
  f_prime_x: string
  lagrange_basis: string
  value_basis: string
  derivative_basis: string
}

export interface HermiteBasisFormIncluded {
  status: "included"
  formula: string
  terms: HermiteBasisTerm[]
  expanded: string
  latex: string
  matches_divided_difference: boolean
}

export interface HermiteBasisFormOmitted {
  status: "omitted"
  // The contract describes the omission state via the
  // `expanded_polynomial_omitted` warning with
  // `details.artifact === "hermite_basis_form"`. The omitted shape
  // intentionally does not invent extra fields here. See locked
  // decision 2 in tasks.md and design.md §16 question 2.
}

export type HermiteBasisForm =
  | HermiteBasisFormIncluded
  | HermiteBasisFormOmitted

export interface HermiteDividedDifferenceResult {
  status: string
  repeated_nodes?: RepeatedNode[]
  divided_difference_table?: Array<Array<string | null>>
  coefficients?: string[]
  nested_form?: string
  expanded?: string | null
  latex_expanded?: string | null
  latex_hermite?: string | null
  evaluations?: Array<{ x: string; value: string }>
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface HermiteResult extends HermiteDividedDifferenceResult {
  basis_form?: HermiteBasisForm
}

export interface OsculatingResult {
  status: string
  orders?: Array<{ node_index: number; x: string; max_order: number }>
  repeated_nodes?: Array<
    RepeatedNode & {
      derivative_order?: number
      derivative_value?: string
    }
  >
  confluent_divided_difference_table?: Array<Array<string | null>>
  coefficients?: string[]
  nested_form?: string
  expanded?: string | null
  degree?: number
  latex_expanded?: string | null
  latex_osculating?: string | null
  evaluations?: Array<{ x: string; value: string }>
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

// Phase 2 Function-Derivative Family response types
// Field names match docs/API_CONTRACT.md "P2.3 Taylor Method" verbatim.

export interface TaylorTerm {
  order: number
  derivative: string
  derivative_at_center: string
  coefficient: string
  term: string
  latex_term: string
}

export interface TaylorResult {
  status: string
  center?: string
  order?: number
  series_name?: string         // "Taylor" or "Maclaurin" per contract
  terms?: TaylorTerm[]
  taylor_form?: string
  expanded?: string | null
  latex_expanded?: string | null
  latex_taylor?: string | null
  evaluations?: Array<{ x: string; value: string }>
  remainder_note?: string
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

// Phase 2 Piecewise Family response types
// Field names match docs/API_CONTRACT.md "P2.4 Natural Cubic Spline
// Method" verbatim. `SplineSegment.coefficients` is exactly
// `{ a, b, c, d: string }` per the contract example.

export interface SplineSegment {
  index: number
  interval: { left: string; right: string }
  coefficients: { a: string; b: string; c: string; d: string }
  local_form: string
  expanded: string
  latex: string
}

export interface SplineContinuityCheck {
  x: string
  value_continuous: boolean
  first_derivative_continuous: boolean
  second_derivative_continuous: boolean
}

export interface SplineEvaluation {
  x: string
  value: string
  segment_index?: number      // contract example shows this on success
}

export interface CubicSplineResult {
  status: string
  boundary_condition?: SplineBoundaryCondition
  ordered_nodes?: Array<{ index: number; x: string; y: string }>
  second_derivatives?: string[]
  segments?: SplineSegment[]
  continuity_checks?: SplineContinuityCheck[]
  evaluations?: SplineEvaluation[]
  steps?: string[]
  warnings: WarningBody[]
  error: ErrorBody | null
}

export interface GraphData {
  x: (string | null)[]
  f_x: (string | null)[]
  P_x: (string | null)[]
  error: (string | null)[]
  source_method: string
  method_graphs: null
}

export interface InputSummary {
  mode: InputMode
  node_count: number
  degree: number
  methods_requested: MethodName[]
  precision: number
  exact: boolean
  function_known: boolean
  graph_requested: boolean
  sorted_nodes: boolean
}

export interface ToleranceMetadata {
  abs_tol: string
  rel_tol: string
  precision_digits_used_for_comparison: number
}

export interface InterpolateResponse {
  status: ResponseStatus
  response_version: string
  metadata: { tolerance: ToleranceMetadata }
  input_summary: InputSummary
  nodes: NodeEntry[]
  degree: number
  polynomial: PolynomialData
  methods: {
    lagrange?: LagrangeResult
    newton?: NewtonResult
    barycentric?: BarycentricResult
    neville?: NevilleResult
    newton_forward?: NewtonForwardResult
    newton_backward?: NewtonBackwardResult
    stirling?: StirlingResult
    hermite_divided_difference?: HermiteDividedDifferenceResult
    hermite?: HermiteResult
    osculating?: OsculatingResult
    taylor?: TaylorResult
    cubic_spline?: CubicSplineResult
  }
  evaluations: EvaluationEntry[]
  graph_data: GraphData | null
  warnings: WarningBody[]
  educational_notes: string[]
}

export interface FunctionValidationResponse {
  status: "ok"
  function: string
  normalized_expression: string
  latex: string
  allowed_symbols: string[]
}

export interface HealthResponse {
  status: string
  service: string
  version: string
}

// Union type for API responses
export type InterpolateApiResponse = InterpolateResponse | ErrorResponse
