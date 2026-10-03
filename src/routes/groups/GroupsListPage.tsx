import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IDENTIFIER_TYPES, type RuleGroupListItem } from '@/api/types'
import { useClientContext } from '@/clients/ClientContext'
import { ClientBadge } from '@/components/ClientBadge'
import { ClientPicker } from '@/components/ClientPicker'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { DeleteGroupDialog } from '@/components/DeleteGroupDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useDeleteGroup, useGroups } from '@/queries/useGroups'

const PAGE_SIZE = 20

export function GroupsListPage() {
  const [searchParams] = useSearchParams()
  const { selectedClient, setSelectedClient } = useClientContext()
  const [name, setName] = useState('')
  const [algorithmId, setAlgorithmId] = useState('')
  const [identifierType, setIdentifierType] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<RuleGroupListItem | null>(null)

  useEffect(() => {
    const fromUrl = searchParams.get('client')
    if (fromUrl) setSelectedClient(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: algorithms } = useAlgorithms()
  const { data, isLoading } = useGroups({
    client_id: selectedClient || undefined,
    name_contains: name || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const deleteGroup = useDeleteGroup()

  // The backend's `RuleGroupFilter` only supports `name_contains` server-side
  // — algorithm/identifier-type filtering is client-side over the current page.
  const rows = (data?.items ?? []).filter((g) => {
    if (algorithmId && g.algorithm.id !== algorithmId) return false
    if (identifierType && !g.identifier_types.includes(identifierType)) return false
    return true
  })

  const columns: DataTableColumn<RuleGroupListItem>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (g) => (
        <Link to={`/groups/${g.id}`} className="font-medium text-primary hover:underline">
          {g.name}
        </Link>
      ),
      sortValue: (g) => g.name,
    },
    { key: 'client', header: 'Client', render: (g) => <ClientBadge clientId={g.client_id} />, sortValue: (g) => g.client_id },
    { key: 'algorithm', header: 'Algorithm', render: (g) => g.algorithm.name, sortValue: (g) => g.algorithm.name },
    { key: 'identifier_signature', header: 'Identifier signature', render: (g) => <span className="font-mono text-xs">{g.identifier_signature}</span> },
    { key: 'members', header: 'Members', render: (g) => <Badge variant="outline">{g.member_count}</Badge>, sortValue: (g) => g.member_count },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (g) => (
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/groups/${g.id}/edit`}>Edit</Link>
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(g)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Groups</h1>
        <Button asChild>
          <Link to="/groups/new">New group</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <ClientPicker
          value={selectedClient ?? ''}
          onChange={(v) => {
            setSelectedClient(v || null)
            setPage(1)
          }}
          includeAllOption
          includeDisabled
          placeholder="All clients"
          className="w-48"
        />
        <Input
          placeholder="Filter by name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setPage(1)
          }}
          className="w-64"
        />
        <Select value={algorithmId || 'all'} onValueChange={(v) => setAlgorithmId(v === 'all' ? '' : v)}>
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
        <Select value={identifierType || 'all'} onValueChange={(v) => setIdentifierType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Identifier type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All identifier types</SelectItem>
            {IDENTIFIER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(g) => g.id}
        isLoading={isLoading}
        emptyMessage="No groups yet."
        pagination={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
      />

      {deleteTarget && (
        <DeleteGroupDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          groupName={deleteTarget.name}
          isPending={deleteGroup.isPending}
          onConfirm={async (members) => {
            await deleteGroup.mutateAsync({ id: deleteTarget.id, members })
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}
