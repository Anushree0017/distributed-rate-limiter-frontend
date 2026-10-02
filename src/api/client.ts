import { API_URL } from '@/config'
import type { ApiErrorBody } from '@/api/types'

export class ApiError extends Error {
  code: string
  details: Record<string, unknown>
  status: number

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isConflict() {
    return this.status === 409
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options
  const response = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | undefined
    if (errorBody?.error) {
      throw new ApiError(response.status, errorBody.error.code, errorBody.error.message, errorBody.error.details)
    }
    throw new ApiError(response.status, 'UNKNOWN_ERROR', response.statusText || 'Request failed')
  }

  return payload as T
}
