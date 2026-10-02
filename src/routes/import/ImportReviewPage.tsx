import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { CandidateEndpoint } from '@/api/importSpec'
import { BulkStandaloneSubmit } from '@/routes/import/BulkStandaloneSubmit'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Assignment = { type: 'unassigned' } | { type: 'standalone' } | { type: 'group'; groupName: string } | { type: 'skipped' }

export function ImportReviewPage() {
  const location = useLocation() as { state?: { candidates?: CandidateEndpoint[] } }
  const navigate = useNavigate()
  const candidates = location.state?.candidates

  const [assignments, setAssignments] = useState<Record<string, Assignment>>(() => {
    const initial: Record<string, Assignment> = {}
    for (const c of candidates ?? []) {
      initial[c.id] = c.suggestedGroup ? { type: 'group', groupName: c.suggestedGroup } : { type: 'unassigned' }
    }
    return initial
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [standaloneBatch, setStandaloneBatch] = useState<CandidateEndpoint[] | null>(null)

  const groupNames = useMemo(() => {
    const names = new Set<string>()
    for (const a of Object.values(assignments)) if (a.type === 'group') names.add(a.groupName)
    return Array.from(names)
  }, [assignments])

  if (!candidates || candidates.length === 0) {
    return <Navigate to="/import" replace />
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function assignSelected(assignment: Assignment) {
    setAssignments((prev) => {
      const next = { ...prev }
      for (const id of selected) next[id] = assignment
      return next
    })
    setSelected(new Set())
  }

  function statusLabel(a: Assignment): string {
    if (a.type === 'unassigned') return 'unassigned'
    if (a.type === 'standalone') return 'standalone'
    if (a.type === 'skipped') return 'skipped'
    return `→ ${a.groupName}`
  }

  function startGroupCreate(groupName: string) {
    const members = (candidates ?? [])
      .filter((c) => {
        const a = assignments[c.id]
        return a?.type === 'group' && a.groupName === groupName
      })
      .map((c) => ({ endpoint: c.path, overrides: {} }))
    navigate('/groups/new', { state: { initialMembers: members, initialName: groupName } })
  }

  const standaloneCandidates = (candidates ?? []).filter((c) => assignments[c.id]?.type === 'standalone')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Review import</h1>
        <p className="text-sm text-muted-foreground">
          {candidates.length} endpoint(s) parsed. Every grouping/assignment below is editable before anything is created.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{selected.size} selected</span>
        <GroupAssignInput disabled={selected.size === 0} onAssign={(name) => assignSelected({ type: 'group', groupName: name })} />
        <Button variant="outline" size="sm" disabled={selected.size === 0} onClick={() => assignSelected({ type: 'standalone' })}>
          Create as standalone
        </Button>
        <Button variant="outline" size="sm" disabled={selected.size === 0} onClick={() => assignSelected({ type: 'skipped' })}>
          Skip
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Method</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelected(c.id)} />
              </TableCell>
              <TableCell className="font-mono text-xs">{c.method}</TableCell>
              <TableCell className="font-mono text-sm">{c.path}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{statusLabel(assignments[c.id])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {groupNames.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Groups to create</h2>
          {groupNames.map((name) => (
            <div key={name} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
              <span>
                {name} ({candidates.filter((c) => assignments[c.id]?.type === 'group' && (assignments[c.id] as any).groupName === name).length}{' '}
                endpoints)
              </span>
              <Button size="sm" onClick={() => startGroupCreate(name)}>
                Create group
              </Button>
            </div>
          ))}
        </div>
      )}

      {standaloneCandidates.length > 0 && !standaloneBatch && (
        <div>
          <Button onClick={() => setStandaloneBatch(standaloneCandidates)}>Create {standaloneCandidates.length} standalone rule(s)</Button>
        </div>
      )}

      {standaloneBatch && <BulkStandaloneSubmit endpoints={standaloneBatch} onDone={() => setStandaloneBatch(null)} />}
    </div>
  )
}

function GroupAssignInput({ disabled, onAssign }: { disabled: boolean; onAssign: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="flex items-center gap-1">
      <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} className="w-40" />
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || name.trim() === ''}
        onClick={() => {
          onAssign(name.trim())
          setName('')
        }}
      >
        Group selected
      </Button>
    </div>
  )
}
