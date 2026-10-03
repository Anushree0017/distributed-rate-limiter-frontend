import { useState } from 'react'
import type { Client } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ToggleClientStatusDialogProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending?: boolean
  onConfirm: () => void
}

/** Enable/Disable action, shared by the Clients list and detail pages.
 * Disabling the client the operator is currently logged in as needs an
 * extra explicit acknowledgment (plan Section 5) — it's the one action in
 * this app that can lock the operator out of their own session. */
export function ToggleClientStatusDialog({ client, open, onOpenChange, isPending, onConfirm }: ToggleClientStatusDialogProps) {
  const { clientId: loggedInClientId } = useAuth()
  const [acknowledged, setAcknowledged] = useState(false)

  if (!client) return null

  const willDisable = client.status === 'active'
  const isSelf = client.client_id === loggedInClientId
  const requiresAck = willDisable && isSelf
  const action = willDisable ? 'Disable' : 'Enable'

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) setAcknowledged(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action} client "{client.name}"
          </DialogTitle>
          <DialogDescription>
            {willDisable
              ? "Callers using this client will start getting 403 within about a minute. Existing rules are kept."
              : 'Callers using this client will be able to authenticate again.'}
          </DialogDescription>
        </DialogHeader>

        {requiresAck && (
          <label className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(Boolean(v))} />
            <span>This is the client you're currently logged in as — disabling it will log you out. I understand.</span>
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={willDisable ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isPending || (requiresAck && !acknowledged)}
          >
            {isPending ? 'Working…' : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
