import { useState } from 'react'
import { ApiError } from '@/api/client'
import { AlgorithmParamsFields } from '@/components/forms/AlgorithmParamsFields'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useDetachRule } from '@/queries/useRules'

interface DetachRuleModalProps {
  ruleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetached?: () => void
}

/** Detach requires both algorithm and params — never optional: a group
 * member has no algorithm/params of its own to fall back to once removed
 * from the group. */
export function DetachRuleModal({ ruleId, open, onOpenChange, onDetached }: DetachRuleModalProps) {
  const { data: algorithms } = useAlgorithms()
  const detachRule = useDetachRule(ruleId)
  const [algorithmName, setAlgorithmName] = useState('')
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<ApiError | null>(null)

  const selectedAlgorithm = algorithms?.find((a) => a.name === algorithmName)

  async function onSubmit() {
    setError(null)
    if (!algorithmName) return
    try {
      await detachRule.mutateAsync({ algorithm: algorithmName, params })
      onOpenChange(false)
      onDetached?.()
    } catch (err) {
      if (err instanceof ApiError) setError(err)
      else throw err
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detach from group</DialogTitle>
          <DialogDescription>
            This rule becomes standalone. Choose the algorithm and params it should use going forward — there's no fallback.
          </DialogDescription>
        </DialogHeader>

        {error && <ConflictErrorBanner error={error} />}

        <div className="space-y-3">
          <Select value={algorithmName} onValueChange={setAlgorithmName}>
            <SelectTrigger>
              <SelectValue placeholder="Select an algorithm" />
            </SelectTrigger>
            <SelectContent>
              {algorithms?.map((a) => (
                <SelectItem key={a.id} value={a.name}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlgorithmParamsFields schema={selectedAlgorithm?.param_schema as any} value={params} onChange={setParams} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!algorithmName || detachRule.isPending}>
            {detachRule.isPending ? 'Detaching…' : 'Detach'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
