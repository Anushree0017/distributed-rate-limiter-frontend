import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/api/client'
import type { Rule, RuleGroupDetail } from '@/api/types'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useUpdateRule } from '@/queries/useRules'

interface GroupedRuleOverridesFormProps {
  rule: Rule
  group: RuleGroupDetail
}

/** Correction 5: a grouped rule's algorithm/identifier types/priority are
 * governed by the group and rendered read-only here; only `overrides` (a
 * subset of the group's own base param keys) is editable. */
export function GroupedRuleOverridesForm({ rule, group }: GroupedRuleOverridesFormProps) {
  const navigate = useNavigate()
  const updateRule = useUpdateRule(rule.id)
  const [overrides, setOverrides] = useState<Record<string, unknown>>(rule.overrides ?? {})
  const [actor, setActor] = useState(getStoredActor())
  const [submitError, setSubmitError] = useState<ApiError | null>(null)

  const baseParamKeys = Object.keys(group.params)

  function setOverrideField(key: string, raw: string) {
    setOverrides((prev) => {
      const next = { ...prev }
      if (raw === '') {
        delete next[key]
      } else {
        const asNumber = Number(raw)
        next[key] = raw !== '' && !Number.isNaN(asNumber) && typeof group.params[key] === 'number' ? asNumber : raw
      }
      return next
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setStoredActor(actor)
    try {
      await updateRule.mutateAsync({
        overrides,
        updated_by: actor,
        expected_version: rule.version,
      })
      navigate(`/rules/${rule.id}`)
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err)
      else throw err
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {submitError && <ConflictErrorBanner error={submitError} />}

      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
        <p className="mb-2 font-medium">Governed by group "{group.name}" — read only here</p>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <span>
            Algorithm: <span className="font-medium text-foreground">{rule.algorithm.name}</span>
          </span>
          <span>
            Identifier types: <span className="font-medium text-foreground">{rule.identifier_types.join('+')}</span>
          </span>
          <span>
            Priority: <span className="font-medium text-foreground">{rule.priority}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Overrides</Label>
        {baseParamKeys.length === 0 && <p className="text-sm text-muted-foreground">Group has no base params to override.</p>}
        <div className="grid grid-cols-2 gap-3">
          {baseParamKeys.map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`override-${key}`} className="text-xs">
                {key}{' '}
                <span className="text-muted-foreground">
                  (base: {String(group.params[key])})
                </span>
              </Label>
              <Input
                id={`override-${key}`}
                value={overrides[key] === undefined ? '' : String(overrides[key])}
                placeholder="inherit base value"
                onChange={(e) => setOverrideField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        {Object.keys(overrides).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.keys(overrides).map((k) => (
              <Badge key={k} variant="secondary">
                {k} overridden
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="actor">Updated by</Label>
        <Input id="actor" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="you@example.com" required />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={updateRule.isPending}>
          {updateRule.isPending ? 'Saving…' : 'Save overrides'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
