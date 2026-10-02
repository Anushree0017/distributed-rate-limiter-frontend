import { useState } from 'react'
import { ApiError } from '@/api/client'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { EffectiveParamsPreview } from '@/components/forms/EffectiveParamsPreview'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useGroup, useGroups } from '@/queries/useGroups'
import { useMoveRuleToGroup } from '@/queries/useRules'

interface MoveToGroupModalProps {
  ruleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMoved?: () => void
}

/** Correction 4: reuses ConflictErrorBanner for the 409 endpoint+signature
 * collision this can also return, same as the Add Members modal. */
export function MoveToGroupModal({ ruleId, open, onOpenChange, onMoved }: MoveToGroupModalProps) {
  const { data: groupsPage } = useGroups({ page: 1, page_size: 100 })
  const [groupId, setGroupId] = useState('')
  const { data: targetGroup } = useGroup(groupId || undefined)
  const [overrides, setOverrides] = useState<Record<string, unknown>>({})
  const [actor, setActor] = useState(getStoredActor())
  const [error, setError] = useState<ApiError | null>(null)
  const moveToGroup = useMoveRuleToGroup(ruleId)

  function setOverrideField(key: string, raw: string) {
    setOverrides((prev) => {
      const next = { ...prev }
      if (raw === '') delete next[key]
      else next[key] = raw
      return next
    })
  }

  async function onSubmit() {
    setError(null)
    if (!groupId) return
    setStoredActor(actor)
    try {
      await moveToGroup.mutateAsync({ group_id: groupId, overrides, updated_by: actor })
      onOpenChange(false)
      onMoved?.()
    } catch (err) {
      if (err instanceof ApiError) setError(err)
      else throw err
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to group</DialogTitle>
          <DialogDescription>The rule adopts the target group's algorithm/params, with optional overrides.</DialogDescription>
        </DialogHeader>

        {error && <ConflictErrorBanner error={error} />}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Target group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groupsPage?.items.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetGroup && (
            <>
              <div className="space-y-2">
                <Label>Overrides (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(targetGroup.params).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">
                        {key} <span className="text-muted-foreground">(base: {String(targetGroup.params[key])})</span>
                      </Label>
                      <Input
                        value={overrides[key] === undefined ? '' : String(overrides[key])}
                        placeholder="inherit base value"
                        onChange={(e) => setOverrideField(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Effective params preview</Label>
                <EffectiveParamsPreview baseParams={targetGroup.params} overrides={overrides} />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="move-actor">Updated by</Label>
            <Input id="move-actor" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="you@example.com" required />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!groupId || !actor || moveToGroup.isPending}>
            {moveToGroup.isPending ? 'Moving…' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
