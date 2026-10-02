import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { FileInput, LayoutGrid, ListChecks, Sigma } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/rules', label: 'Rules', icon: ListChecks },
  { to: '/groups', label: 'Groups', icon: LayoutGrid },
  { to: '/algorithms', label: 'Algorithms', icon: Sigma },
  { to: '/import', label: 'Import', icon: FileInput },
]

export function Layout({ children }: { children: ReactNode }) {
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
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  )
}
