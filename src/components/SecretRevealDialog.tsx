import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface SecretRevealDialogProps {
  open: boolean
  secret: string | null
  onDone: () => void
}

/** Shown exactly once, after create-client or add-secret. Per plan Section
 * 6: cannot be dismissed by backdrop click or Escape, only by ticking the
 * copy acknowledgment and clicking Done. There's no `onOpenChange` on the
 * `Dialog` root here on purpose — nothing but `handleDone` can close it. The
 * caller owns keeping the secret out of the query cache (mutations use
 * `gcTime: 0`) and must call `mutation.reset()` after `onDone`. */
export function SecretRevealDialog({ open, secret, onDone }: SecretRevealDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copySecret() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
  }

  function handleDone() {
    setAcknowledged(false)
    setCopied(false)
    onDone()
  }

  return (
    <Dialog open={open}>
      <DialogContent
        hideCloseButton
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Client secret</DialogTitle>
          <DialogDescription className="font-medium text-destructive">
            This is the only time you'll see this secret. It cannot be retrieved again once you close this dialog.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input readOnly value={secret ?? ''} className="font-mono" onFocus={(e) => e.target.select()} />
          <Button type="button" variant="outline" size="icon" onClick={copySecret}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(Boolean(v))} />
          I have copied this secret
        </label>

        <DialogFooter>
          <Button disabled={!acknowledged} onClick={handleDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
