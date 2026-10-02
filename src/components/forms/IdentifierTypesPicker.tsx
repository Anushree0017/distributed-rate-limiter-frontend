import { IDENTIFIER_TYPES, MAX_IDENTIFIERS_PER_RULE } from '@/api/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface IdentifierTypesPickerProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

/** Multi-select, max `MAX_IDENTIFIERS_PER_RULE` members, and `global` must be
 * alone — mirrors the backend's `normalize_identifier_types` shape rules. */
export function IdentifierTypesPicker({ value, onChange, disabled }: IdentifierTypesPickerProps) {
  const hasGlobal = value.includes('global')

  function toggle(type: string) {
    if (value.includes(type)) {
      onChange(value.filter((v) => v !== type))
      return
    }
    if (type === 'global') {
      onChange(['global'])
      return
    }
    if (hasGlobal) {
      onChange([type])
      return
    }
    if (value.length >= MAX_IDENTIFIERS_PER_RULE) return
    onChange([...value, type])
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {IDENTIFIER_TYPES.map((type) => {
        const checked = value.includes(type)
        const blocked = !checked && ((hasGlobal && type !== 'global') || (value.length >= MAX_IDENTIFIERS_PER_RULE && type !== 'global'))
        return (
          <label
            key={type}
            className={cn(
              'flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm',
              blocked || disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent',
            )}
          >
            <Checkbox checked={checked} disabled={disabled || (blocked && !checked)} onCheckedChange={() => toggle(type)} />
            <Label className="cursor-pointer font-normal">{type}</Label>
          </label>
        )
      })}
      <p className="col-span-full text-xs text-muted-foreground">
        Up to {MAX_IDENTIFIERS_PER_RULE} identifier types, or `global` alone.
      </p>
    </div>
  )
}
