import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Rule, RuleStatus } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { DetachRuleModal } from '@/components/DetachRuleModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useDeleteRule, useRules, useToggleRuleStatus } from '@/queries/useRules'
import { getStoredActor } from '@/lib/actor'

const PAGE_SIZE = 20

export function RulesListPage() {
  const [endpoint, setEndpoint] = useState('')
  const [identifierSignature, setIdentifierSignature] = useState('')
  const [algorithmId, setAlgorithmId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [grouped, setGrouped] = useState<string>('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null)
  const [detachTarget, setDetachTarget] = useState<Rule | null>(null)

  const { data: algorithms } = useAlgorithms()
  const { data, isLoading } = useRules({
    endpoint: endpoint || undefined,
    identifier_signature: identifierSignature || undefined,
    algorithm_id: algorithmId || undefined,
    status: (status as RuleStatus) || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteRule = useDeleteRule()
  const toggleStatus = useToggleRuleStatus()

  const rows = (data?.items ?? []).filter((rule) => {
    if (grouped === 'grouped') return Boolean(rule.group_id)
    if (grouped === 'standalone') return !rule.group_id
    return true
  })

  const columns: DataTableColumn<Rule>[] = [
    { key: 'endpoint', header: 'Endpoint', render: (r) => <Link to={`/rules/${r.id}`} className="font-mono text-sm text-primary hover:underline">{r.endpoint}</Link>, sortValue: (r) => r.endpoint },
    { key: 'identifier_signature', header: 'Identifier signature', render: (r) => <span className="font-mono text-xs">{r.identifier_signature}</span> },
    { key: 'algorithm', header: 'Algorithm', render: (r) => r.algorithm.name, sortValue: (r) => r.algorithm.name },
    { key: 'priority', header: 'Priority', render: (r) => r.priority, sortValue: (r) => r.priority },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'secondary'}>{r.status}</Badge>,
    },
    {
      key: 'group',
      header: 'Group',
      render: (r) => (r.group_id ? <Badge variant="outline">grouped</Badge> : <span className="text-muted-foreground">standalone</span>),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/rules/${r.id}/edit`}>Edit</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={toggleStatus.isPending}
            onClick={() =>
              toggleStatus.mutate({
                id: r.id,
                status: r.status === 'active' ? 'inactive' : 'active',
                updatedBy: getStoredActor() || 'admin',
              })
            }
          >
            {r.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          {r.group_id && (
            <Button size="sm" variant="outline" onClick={() => setDetachTarget(r)}>
              Detach
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>
            Delete
          </Button>
        </div>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rules</h1>
        <Button asChild>
          <Link to="/rules/new">New rule</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Filter by endpoint" value={endpoint} onChange={(e) => { setEndpoint(e.target.value); setPage(1) }} className="w-48" />
        <Input
          placeholder="Filter by identifier_signature"
          value={identifierSignature}
          onChange={(e) => { setIdentifierSignature(e.target.value); setPage(1) }}
          className="w-56"
        />
        <Select value={algorithmId || 'all'} onValueChange={(v) => { setAlgorithmId(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All algorithms</SelectItem>
            {algorithms?.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={grouped || 'all'} onValueChange={(v) => setGrouped(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Grouped?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rules</SelectItem>
            <SelectItem value="grouped">Grouped only</SelectItem>
            <SelectItem value="standalone">Standalone only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        isLoading={isLoading}
        emptyMessage="No rules match these filters."
        pagination={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete rule"
        description={`Delete rule for "${deleteTarget?.endpoint}"? This is irreversible — there is no undo.`}
        confirmLabel="Delete"
        isPending={deleteRule.isPending}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteRule.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
      />

      {detachTarget && (
        <DetachRuleModal
          ruleId={detachTarget.id}
          open={Boolean(detachTarget)}
          onOpenChange={(open) => !open && setDetachTarget(null)}
        />
      )}
    </div>
  )
}
