import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { requestToken } from '@/api/auth'
import * as tokenStore from '@/auth/tokenStore'

type AuthStatus = 'anonymous' | 'authenticated'

interface AuthContextValue {
  status: AuthStatus
  clientId: string | null
  sessionNotice: string | null
  login: (clientId: string, clientSecret: string) => Promise<void>
  logout: () => void
  clearSessionNotice: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Holds the admin session: credentials + token live only in `tokenStore`
 * (module-scoped JS memory, never persisted — see auth-plan.md Decision 1A),
 * this component just owns the React-visible status and the refresh timer.
 * A page refresh always starts anonymous. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('anonymous')
  const [clientId, setClientId] = useState<string | null>(null)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current)
      refreshTimer.current = null
    }
  }, [])

  // Reschedules itself after every successful refresh, at ~80% of the new
  // token's lifetime (tokenStore.getRefreshDelayMs). Recurses through a ref
  // rather than closing over its own `useCallback` binding, which isn't
  // assigned yet at the point the timeout callback is created.
  const scheduleRefreshRef = useRef<() => void>(() => {})
  const scheduleRefresh = useCallback(() => {
    clearRefreshTimer()
    const delay = tokenStore.getRefreshDelayMs()
    if (delay === null) return
    refreshTimer.current = setTimeout(async () => {
      try {
        await tokenStore.refreshToken()
        scheduleRefreshRef.current()
      } catch {
        tokenStore.notifySessionExpired()
      }
    }, delay)
  }, [clearRefreshTimer])
  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh
  }, [scheduleRefresh])

  const handleSessionExpired = useCallback(() => {
    clearRefreshTimer()
    setStatus('anonymous')
    setClientId(null)
    queryClient.clear()
    setSessionNotice('Your session has expired. Please log in again.')
    navigate('/login', { replace: true })
  }, [clearRefreshTimer, navigate, queryClient])

  // api/client.ts calls this (via tokenStore.notifySessionExpired) when a
  // refresh-and-retry still comes back 401 — it has no React context of its
  // own, so this is how that path reaches the UI.
  useEffect(() => {
    tokenStore.registerSessionExpiredHandler(handleSessionExpired)
    return () => tokenStore.registerSessionExpiredHandler(null)
  }, [handleSessionExpired])

  useEffect(() => () => clearRefreshTimer(), [clearRefreshTimer])

  const login = useCallback(
    async (loginClientId: string, clientSecret: string) => {
      const response = await requestToken(loginClientId, clientSecret, 'admin')
      tokenStore.setCredentials(loginClientId, clientSecret)
      tokenStore.setInitialToken(response.access_token, response.expires_in)
      setClientId(loginClientId)
      setStatus('authenticated')
      setSessionNotice(null)
      scheduleRefresh()
    },
    [scheduleRefresh],
  )

  const logout = useCallback(() => {
    clearRefreshTimer()
    tokenStore.clearSession()
    setStatus('anonymous')
    setClientId(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [clearRefreshTimer, navigate, queryClient])

  const clearSessionNotice = useCallback(() => setSessionNotice(null), [])

  return (
    <AuthContext.Provider value={{ status, clientId, sessionNotice, login, logout, clearSessionNotice }}>
      {children}
    </AuthContext.Provider>
  )
}
