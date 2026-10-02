import { AlertTriangle } from 'lucide-react'
import { ApiError } from '@/api/client'
import type { MemberConflictEntry } from '@/api/types'

interface ConflictErrorBannerProps {
  error?: ApiError | null
  conflicts?: MemberConflictEntry[]
}

/** Reused wherever a 409 endpoint+signature collision can occur: Add
 * Members, Move-to-Group, and the Import review/submit step. Renders inline,
 * never as a toast — the conflicting rows are the point. */
export function ConflictErrorBanner({ error, conflicts }: ConflictErrorBannerProps) {
  const rows: MemberConflictEntry[] =
    conflicts ?? (error?.details?.conflicts as MemberConflictEntry[] | undefined) ?? []

  if (rows.length === 0 && !error) return null

  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">{error?.message ?? 'One or more endpoints conflict with an existing rule.'}</p>
          {rows.length > 0 && (
            <ul className="list-inside list-disc space-y-0.5">
              {rows.map((row) => (
                <li key={row.endpoint}>
                  <span className="font-mono">{row.endpoint}</span> — {row.reason}
                </li>
              ))}
            </ul>
          )}
          {rows.length === 0 && error && (error.code === 'SCOPE_CONFLICT' || error.code === 'GROUP_NAME_CONFLICT') && (
            <p className="font-mono text-xs">
              {String(error.details.endpoint ?? '')} {String(error.details.identifier_signature ?? '')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
