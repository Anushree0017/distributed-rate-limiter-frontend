interface EffectiveParamsPreviewProps {
  baseParams: Record<string, unknown>
  overrides?: Record<string, unknown> | null
}

/** Read-only merged base+overrides display — a grouped rule's actual runtime
 * params are `{...baseParams, ...overrides}`; used on the grouped rule edit
 * page, group detail member rows, and the Move-to-Group modal preview. */
export function EffectiveParamsPreview({ baseParams, overrides }: EffectiveParamsPreviewProps) {
  const effective = { ...baseParams, ...(overrides ?? {}) }
  const overriddenKeys = new Set(Object.keys(overrides ?? {}))
  const keys = Object.keys(effective)

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">No params.</p>
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
      {keys.map((key) => (
        <div key={key} className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{key}</dt>
          <dd className={overriddenKeys.has(key) ? 'font-semibold text-primary' : ''}>
            {String(effective[key])}
            {overriddenKeys.has(key) && <span className="ml-1 text-xs font-normal text-muted-foreground">(override)</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
