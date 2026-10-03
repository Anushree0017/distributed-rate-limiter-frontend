import { API_URL } from '@/config'
import type { ApiErrorBody } from '@/api/types'
import { getAccessToken, hasSession, notifySessionExpired, refreshToken } from '@/auth/tokenStore'

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

  get isForbidden() {
    return this.status === 403
  }
}

export interface RequestOptions {
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

// `/auth/token` and `/health` are the only endpoints the backend leaves
// open — every other call needs the bearer token attached.
const UNAUTHENTICATED_PATHS = ['/auth/token', '/health']

function doFetch(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, query } = options
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (!UNAUTHENTICATED_PATHS.includes(path)) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${API_URL}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** Attaches the bearer token to every call and, on a 401, refreshes once
 * (single-flight — see `tokenStore`) and retries the request once. A failed
 * refresh or a second 401 on the retry means the session is gone: clears it
 * and notifies `AuthProvider` so it can redirect to /login. Never retries a
 * 403 — that's a scope/disabled-client problem, not an expired token, and
 * retrying it would just mask the real error. */
export async function rawRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  let response = await doFetch(path, options)

  if (response.status === 401 && !UNAUTHENTICATED_PATHS.includes(path) && hasSession()) {
    try {
      await refreshToken()
      response = await doFetch(path, options)
    } catch {
      notifySessionExpired()
      return response
    }
    if (response.status === 401) notifySessionExpired()
  }

  return response
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await rawRequest(path, options)

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
