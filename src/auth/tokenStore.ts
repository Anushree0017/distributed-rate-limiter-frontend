import { requestToken } from '@/api/auth'

interface Credentials {
  clientId: string
  clientSecret: string
}

interface TokenState {
  accessToken: string
  issuedAt: number
  expiresIn: number
}

// Module-scoped, non-persistent: credentials and the token live only in this
// variable, never in localStorage/sessionStorage/cookies/IndexedDB/URL. A
// page refresh loses them by design (see auth-plan.md Decision 1A) — that's
// the whole point, not a bug to work around.
let credentials: Credentials | null = null
let token: TokenState | null = null
let refreshPromise: Promise<string> | null = null
let sessionExpiredHandler: (() => void) | null = null

export function setCredentials(clientId: string, clientSecret: string): void {
  credentials = { clientId, clientSecret }
}

export function getCredentials(): Credentials | null {
  return credentials
}

export function hasSession(): boolean {
  return credentials !== null
}

export function getAccessToken(): string | null {
  return token?.accessToken ?? null
}

/** Fraction of `expires_in` at which `AuthProvider` should schedule a
 * refresh, per the plan's "~80% of expires_in" guidance. */
export function getRefreshDelayMs(): number | null {
  if (!token) return null
  const refreshAt = token.issuedAt + token.expiresIn * 1000 * 0.8
  return Math.max(0, refreshAt - Date.now())
}

export function clearSession(): void {
  credentials = null
  token = null
  refreshPromise = null
}

export function registerSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}

export function notifySessionExpired(): void {
  clearSession()
  sessionExpiredHandler?.()
}

/** Single-flight refresh: a burst of concurrent 401s (or concurrent
 * `AuthProvider` refresh timers) all share one in-flight token request
 * instead of stampeding the token endpoint. */
export async function refreshToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  const creds = credentials
  if (!creds) {
    return Promise.reject(new Error('No credentials to refresh with'))
  }
  refreshPromise = requestToken(creds.clientId, creds.clientSecret, 'admin')
    .then((response) => {
      token = { accessToken: response.access_token, issuedAt: Date.now(), expiresIn: response.expires_in }
      return response.access_token
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export function setInitialToken(accessToken: string, expiresIn: number): void {
  token = { accessToken, issuedAt: Date.now(), expiresIn }
}
