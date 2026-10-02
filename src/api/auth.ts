import { API_URL } from '@/config'
import type { OAuthErrorBody, TokenResponse } from '@/api/types'

export class AuthError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

/** `POST /auth/token` — OAuth2 client-credentials grant, form-encoded (not
 * JSON, unlike every other endpoint). Errors come back as RFC 6749
 * `{error, error_description}`, not the `{error:{code,message,details}}`
 * envelope the rest of the API uses. */
export async function requestToken(clientId: string, clientSecret: string, scope = 'admin'): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  })
  const response = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : undefined

  if (!response.ok) {
    const errorBody = payload as OAuthErrorBody | undefined
    throw new AuthError(errorBody?.error ?? 'unknown_error', errorBody?.error_description ?? 'Login failed')
  }

  return payload as TokenResponse
}
