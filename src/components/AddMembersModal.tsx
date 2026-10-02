import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { GroupMemberInput, MemberConflictEntry, RuleGroupDetail } from '@/api/types'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddMembers } from '@/queries/useGroups'

interface AddMembersModalProps {
  group: RuleGroupDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MemberRow {
  endpoint: string
  overrides: Record<string, string>
}

function emptyRow(): MemberRow {
  return { endpoint: '', overrides: {} }
}

/** Repeatable endpoint+overrides rows, all-or-nothing submit: a conflict on
 * any row means nothing was written server-side, so every row's status is
 * shown together rather than optimistically clearing successful-looking
 * rows. */
export function AddMembersModal({ group, open, onOpenChange }: AddMembersModalProps) {
  const [rows, setRows] = useState<MemberRow[]>([emptyRow()])
  const [conflicts, setConflicts] = useState<MemberConflictEntry[]>([])
  const addMembers = useAddMembers(group.id)
  const baseParamKeys = Object.keys(group.params)

  function updateRow(index: number, patch: Partial<MemberRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function updateOverride(index: number, key: string, value: string) {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row
        const overrides = { ...row.overrides }
        if (value === '') delete overrides[key]
        else overrides[key] = value
        return { ...row, overrides }
      }),
    )
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit() {
    setConflicts([])
    const members: GroupMemberInput[] = rows
      .filter((row) => row.endpoint.trim() !== '')
      .map((row) => ({ endpoint: row.endpoint.trim(), overrides: row.overrides }))
    if (members.length === 0) return

    const result = await addMembers.mutateAsync({ members })
    if (result.conflicts.length > 0) {
      setConflicts(result.conflicts)
      return
    }
    setRows([emptyRow()])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>
            Pure addition — existing members are never touched. A conflict on any row writes nothing; fix the conflicting rows and resubmit.
          </DialogDescription>
        </DialogHeader>

        {conflicts.length > 0 && <ConflictErrorBanner conflicts={conflicts} />}

        <div className="max-h-96 space-y-3 overflow-y-auto">
          {rows.map((row, index) => {
            const conflict = conflicts.find((c) => c.endpoint === row.endpoint)
            return (
              <div key={index} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="/api/v1/orders"
                    value={row.endpoint}
                    onChange={(e) => updateRow(index, { endpoint: e.target.value })}
                    className="font-mono"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {conflict && <p className="text-xs text-destructive">{conflict.reason}</p>}
                {baseParamKeys.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {baseParamKeys.map((key) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">
                          {key} <span className="text-muted-foreground">(base: {String(group.params[key])})</span>
                        </Label>
                        <Input
                          value={row.overrides[key] ?? ''}
                          placeholder="inherit base value"
                          onChange={(e) => updateOverride(index, key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Button type="button" variant="outline" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
          <Plus className="h-4 w-4" />
          Add row
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={addMembers.isPending}>
            {addMembers.isPending ? 'Adding…' : 'Add members'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
