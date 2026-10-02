import { useState } from 'react'
import { createRule } from '@/api/rules'
import { ApiError } from '@/api/client'
import type { CandidateEndpoint } from '@/api/importSpec'
import { AlgorithmParamsFields } from '@/components/forms/AlgorithmParamsFields'
import { IdentifierTypesPicker } from '@/components/forms/IdentifierTypesPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useAlgorithms } from '@/queries/useAlgorithms'

type RowStatus = 'pending' | 'creating' | 'success' | 'conflict' | 'error'

interface RowResult {
  endpoint: CandidateEndpoint
  status: RowStatus
  message?: string
}

interface BulkStandaloneSubmitProps {
  endpoints: CandidateEndpoint[]
  clientId: string
  onDone: () => void
}

/** Step 3 of the import flow: one `POST /rules` per endpoint, in sequence
 * (never all-parallel — parallel creates could trip the backend's own
 * uniqueness checks against each other mid-batch). A 409 on one row doesn't
 * abort the rest; failed/conflicted rows can be retried without
 * re-submitting ones that already succeeded. */
export function BulkStandaloneSubmit({ endpoints, clientId, onDone }: BulkStandaloneSubmitProps) {
  const { data: algorithms } = useAlgorithms()
  const [algorithmId, setAlgorithmId] = useState('')
  const [identifierTypes, setIdentifierTypes] = useState<string[]>([])
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [priority, setPriority] = useState(100)
  const [actor, setActor] = useState(getStoredActor())
  const [results, setResults] = useState<RowResult[]>(endpoints.map((endpoint) => ({ endpoint, status: 'pending' })))
  const [running, setRunning] = useState(false)

  const selectedAlgorithm = algorithms?.find((a) => a.id === algorithmId)

  async function runBatch(rows: RowResult[]) {
    setRunning(true)
    setStoredActor(actor)
    const next = [...rows]
    for (let i = 0; i < next.length; i++) {
      if (next[i].status === 'success') continue
      next[i] = { ...next[i], status: 'creating' }
      setResults([...next])
      try {
        await createRule({
          client_id: clientId,
          endpoint: next[i].endpoint.path,
          identifier_types: identifierTypes,
          algorithm_id: algorithmId,
          params,
          priority,
          created_by: actor,
        })
        next[i] = { ...next[i], status: 'success' }
      } catch (err) {
        if (err instanceof ApiError) {
          next[i] = { ...next[i], status: err.isConflict ? 'conflict' : 'error', message: err.message }
        } else {
          next[i] = { ...next[i], status: 'error', message: 'Unknown error' }
        }
      }
      setResults([...next])
    }
    setRunning(false)
  }

  const created = results.filter((r) => r.status === 'success').length
  const conflicted = results.filter((r) => r.status === 'conflict').length
  const failed = results.filter((r) => r.status === 'error').length
  const hasRun = results.some((r) => r.status !== 'pending')
  const retryable = results.some((r) => r.status === 'conflict' || r.status === 'error')

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <h3 className="font-medium">Create {endpoints.length} standalone rule(s)</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Algorithm</Label>
          <Select value={algorithmId} onValueChange={setAlgorithmId} disabled={hasRun}>
            <SelectTrigger>
              <SelectValue placeholder="Select an algorithm" />
            </SelectTrigger>
            <SelectContent>
              {algorithms?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="bulk-priority">Priority</Label>
          <Input id="bulk-priority" type="number" value={priority} disabled={hasRun} onChange={(e) => setPriority(Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Identifier types</Label>
        <IdentifierTypesPicker value={identifierTypes} onChange={setIdentifierTypes} disabled={hasRun} />
      </div>

      <div className="space-y-1">
        <Label>Params</Label>
        <AlgorithmParamsFields schema={selectedAlgorithm?.param_schema as any} value={params} onChange={setParams} disabled={hasRun} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="bulk-actor">Created by</Label>
        <Input id="bulk-actor" value={actor} disabled={hasRun} onChange={(e) => setActor(e.target.value)} placeholder="you@example.com" />
      </div>

      <div className="space-y-1">
        {results.map((row) => (
          <div key={row.endpoint.id} className="flex items-center justify-between rounded border border-border px-2 py-1 text-sm">
            <span className="font-mono">
              {row.endpoint.method} {row.endpoint.path}
            </span>
            <span
              className={
                row.status === 'success'
                  ? 'text-emerald-600'
                  : row.status === 'conflict'
                    ? 'text-amber-600'
                    : row.status === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
              }
            >
              {row.status}
              {row.message ? ` — ${row.message}` : ''}
            </span>
          </div>
        ))}
      </div>

      {hasRun && (
        <p className="text-sm text-muted-foreground">
          Created {created}, conflicted {conflicted}, failed {failed}.
        </p>
      )}

      <div className="flex gap-2">
        {!hasRun && (
          <Button onClick={() => runBatch(results)} disabled={!algorithmId || identifierTypes.length === 0 || !actor || running}>
            {running ? 'Creating…' : 'Create rules'}
          </Button>
        )}
        {hasRun && retryable && (
          <Button onClick={() => runBatch(results)} disabled={running}>
            {running ? 'Retrying…' : 'Retry failed/conflicted'}
          </Button>
        )}
        {hasRun && !retryable && (
          <Button variant="outline" onClick={onDone}>
            Done
          </Button>
        )}
      </div>
    </div>
  )
}
