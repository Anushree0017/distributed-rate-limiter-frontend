import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthError } from '@/api/auth'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LoginLocationState {
  from?: { pathname: string }
}

function errorMessage(err: unknown): string {
  if (err instanceof AuthError) {
    if (err.code === 'invalid_client') return 'Invalid client ID or secret.'
    if (err.code === 'invalid_scope') return 'This client does not have admin access.'
  }
  return 'Login failed. Please try again.'
}

/** No sidebar — rendered outside `Layout`/`RequireAuth`. Never echoes what
 * was typed back in an error message (plan Section 4). */
export function LoginPage() {
  const { login, sessionNotice, clearSessionNotice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: LoginLocationState }
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      await login(clientId.trim(), clientSecret)
      navigate(location.state?.from?.pathname ?? '/rules', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Rate Limiter Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in with an admin client's credentials.</p>
        </div>

        {sessionNotice && (
          <button
            type="button"
            onClick={clearSessionNotice}
            className="w-full rounded-md border border-amber-300 bg-amber-50 p-2 text-left text-sm text-amber-800"
          >
            {sessionNotice}
          </button>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-1">
          <Label htmlFor="login-client-id">Client ID</Label>
          <Input id="login-client-id" value={clientId} onChange={(e) => setClientId(e.target.value)} autoFocus required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="login-client-secret">Client secret</Label>
          <Input
            id="login-client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
