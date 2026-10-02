import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface DeleteGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  isPending?: boolean
  onConfirm: (members: 'detach' | 'delete') => void
}

/** Correction 2: never a single-click delete. `detach` (default, pre-selected)
 * leaves member rules standalone; `delete` removes them too — matches
 * `DELETE /groups/{id}?members=detach|delete`. */
export function DeleteGroupDialog({ open, onOpenChange, groupName, isPending, onConfirm }: DeleteGroupDialogProps) {
  const [members, setMembers] = useState<'detach' | 'delete'>('detach')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete group "{groupName}"</DialogTitle>
          <DialogDescription>Choose what happens to this group's member rules.</DialogDescription>
        </DialogHeader>

        <RadioGroup value={members} onValueChange={(v) => setMembers(v as 'detach' | 'delete')}>
          <label className="flex items-start gap-2 rounded-md border border-border p-3">
            <RadioGroupItem value="detach" id="members-detach" />
            <div>
              <Label htmlFor="members-detach">Detach members (default)</Label>
              <p className="text-xs text-muted-foreground">Member rules become standalone rules and keep running.</p>
            </div>
          </label>
          <label className="flex items-start gap-2 rounded-md border border-border p-3">
            <RadioGroupItem value="delete" id="members-delete" />
            <div>
              <Label htmlFor="members-delete">Delete members</Label>
              <p className="text-xs text-muted-foreground">Member rules are deleted along with the group. Irreversible.</p>
            </div>
          </label>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(members)} disabled={isPending}>
            {isPending ? 'Deleting…' : 'Delete group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
