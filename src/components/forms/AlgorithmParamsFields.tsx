import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface JsonSchemaProperty {
  type?: string
  description?: string
  default?: unknown
}

interface JsonSchema {
  type?: string
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
}

interface AlgorithmParamsFieldsProps {
  schema: JsonSchema | undefined
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
  disabled?: boolean
}

/** Renders one input per property in an algorithm's `param_schema` (JSON
 * Schema, seeded in `alembic/versions/0002_seed_algorithms.py`) — swaps
 * entirely when the selected algorithm changes. Reused by Rule create/edit,
 * Group create/edit, and the Import bulk-params panel. */
export function AlgorithmParamsFields({ schema, value, onChange, disabled }: AlgorithmParamsFieldsProps) {
  const properties = schema?.properties ?? {}
  const required = new Set(schema?.required ?? [])
  const keys = Object.keys(properties)

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">Select an algorithm to see its parameters.</p>
  }

  function setField(key: string, raw: string, type: string | undefined) {
    let parsed: unknown = raw
    if (raw === '') {
      parsed = undefined
    } else if (type === 'integer') {
      const n = Number.parseInt(raw, 10)
      parsed = Number.isNaN(n) ? raw : n
    } else if (type === 'number') {
      const n = Number.parseFloat(raw)
      parsed = Number.isNaN(n) ? raw : n
    }
    const next = { ...value }
    if (parsed === undefined) {
      delete next[key]
    } else {
      next[key] = parsed
    }
    onChange(next)
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {keys.map((key) => {
        const prop = properties[key]
        const inputType = prop.type === 'integer' || prop.type === 'number' ? 'number' : 'text'
        const current = value[key] ?? prop.default ?? ''
        return (
          <div key={key} className="space-y-1">
            <Label htmlFor={`param-${key}`}>
              {key}
              {required.has(key) && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={`param-${key}`}
              type={inputType}
              step={prop.type === 'number' ? 'any' : undefined}
              value={current === null ? '' : String(current)}
              disabled={disabled}
              onChange={(e) => setField(key, e.target.value, prop.type)}
            />
            {prop.description && <p className="text-xs text-muted-foreground">{prop.description}</p>}
          </div>
        )
      })}
    </div>
  )
}
