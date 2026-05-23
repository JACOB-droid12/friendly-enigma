// Types matching the backend API contract exactly

export type InputMode = "points" | "x_values_with_function" | "function_interval"
export type MethodName = "lagrange" | "newton" | "barycentric" | "neville"
export type NodeStrategy = "equally_spaced" | "chebyshev_nodes" | "custom_nodes"
export type ResponseStatus = "ok" | "partial" | "error"

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
  latex_expanded: string | null
  latex_lagrange: string | null
  latex_newton: string | null
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
