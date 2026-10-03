import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { FileInput, LayoutGrid, ListChecks, LogOut, Sigma, Users } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { ClientPicker } from '@/components/ClientPicker'
import { Button } from '@/components/ui/button'
import { useClientContext } from '@/clients/ClientContext'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/rules', label: 'Rules', icon: ListChecks },
  { to: '/groups', label: 'Groups', icon: LayoutGrid },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/algorithms', label: 'Algorithms', icon: Sigma },
  { to: '/import', label: 'Import', icon: FileInput },
]

export function Layout({ children }: { children: ReactNode }) {
  const { clientId, logout } = useAuth()
  const { selectedClient, setSelectedClient } = useClientContext()

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/40 p-4">
        <div className="mb-6 px-2 text-sm font-semibold tracking-tight">Rate Limiter Admin</div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <ClientPicker
            value={selectedClient ?? ''}
            onChange={(v) => setSelectedClient(v || null)}
            includeAllOption
            includeDisabled
            placeholder="All clients"
            className="w-56"
          />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Logged in as <span className="font-mono text-foreground">{clientId}</span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
