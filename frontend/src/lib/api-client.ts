import type {
  InterpolateRequest,
  InterpolateResponse,
  ErrorResponse,
  FunctionValidationRequest,
  FunctionValidationResponse,
  HealthResponse,
} from "./api-types"

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")

export class ApiError extends Error {
  status: number
  body: ErrorResponse | { detail: unknown }

  constructor(
    status: number,
    body: ErrorResponse | { detail: unknown }
  ) {
    super(
      "error" in body ? body.error.message : `HTTP ${status}`
    )
    this.name = "ApiError"
    this.status = status
    this.body = body
  }

  get code(): string | undefined {
    if ("error" in this.body) {
      return this.body.error.code
    }
    return undefined
  }

  get details(): Record<string, unknown> {
    if ("error" in this.body) {
      return this.body.error.details
    }
    return {}
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.json()
  if (!response.ok) {
    throw new ApiError(response.status, body)
  }
  return body as T
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${BASE_URL}/health`)
  return handleResponse<HealthResponse>(response)
}

export async function validateFunction(
  request: FunctionValidationRequest
): Promise<FunctionValidationResponse> {
  const response = await fetch(`${BASE_URL}/api/validate-function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  return handleResponse<FunctionValidationResponse>(response)
}

export async function interpolate(
  request: InterpolateRequest
): Promise<InterpolateResponse> {
  const response = await fetch(`${BASE_URL}/api/interpolate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  return handleResponse<InterpolateResponse>(response)
}
