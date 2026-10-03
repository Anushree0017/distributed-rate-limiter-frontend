import type { ClientScope } from '@/api/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const SCOPES: ClientScope[] = ['check', 'admin']

interface ScopesPickerProps {
  value: ClientScope[]
  onChange: (value: ClientScope[]) => void
  disabled?: boolean
}

export function ScopesPicker({ value, onChange, disabled }: ScopesPickerProps) {
  function toggle(scope: ClientScope) {
    if (value.includes(scope)) onChange(value.filter((s) => s !== scope))
    else onChange([...value, scope])
  }

  return (
    <div className="flex gap-3">
      {SCOPES.map((scope) => (
        <label
          key={scope}
          className={cn(
            'flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent',
          )}
        >
          <Checkbox checked={value.includes(scope)} disabled={disabled} onCheckedChange={() => toggle(scope)} />
          <Label className="cursor-pointer font-normal">{scope}</Label>
        </label>
      ))}
    </div>
  )
}
