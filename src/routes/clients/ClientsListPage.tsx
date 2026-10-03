import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Client, ClientStatus } from '@/api/types'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { ToggleClientStatusDialog } from '@/components/ToggleClientStatusDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClients, useUpdateClient } from '@/queries/useClients'

const PAGE_SIZE = 20

export function ClientsListPage() {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [toggleTarget, setToggleTarget] = useState<Client | null>(null)

  const { data, isLoading } = useClients({
    name: name || undefined,
    status: (status as ClientStatus) || undefined,
    page,
    page_size: PAGE_SIZE,
  })
  const updateClient = useUpdateClient(toggleTarget?.client_id ?? '')

  const columns: DataTableColumn<Client>[] = [
    {
      key: 'client_id',
      header: 'Slug',
      render: (c) => (
        <Link to={`/clients/${c.client_id}`} className="font-mono text-sm text-primary hover:underline">
          {c.client_id}
        </Link>
      ),
      sortValue: (c) => c.client_id,
    },
    { key: 'name', header: 'Name', render: (c) => c.name, sortValue: (c) => c.name },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>{c.status}</Badge>,
    },
    { key: 'scopes', header: 'Scopes', render: (c) => c.scopes.join(', ') },
    { key: 'created_at', header: 'Created', render: (c) => new Date(c.created_at).toLocaleDateString(), sortValue: (c) => c.created_at },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/clients/${c.client_id}/edit`}>Edit</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setToggleTarget(c)}>
            {c.status === 'active' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Button asChild>
          <Link to="/clients/new">New client</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter by name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setPage(1)
          }}
          className="w-56"
        />
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        rowKey={(c) => c.client_id}
        isLoading={isLoading}
        emptyMessage="No clients yet."
        pagination={{ page, pageSize: PAGE_SIZE, total: data?.total ?? 0, onPageChange: setPage }}
      />

      <ToggleClientStatusDialog
        client={toggleTarget}
        open={Boolean(toggleTarget)}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        isPending={updateClient.isPending}
        onConfirm={async () => {
          if (!toggleTarget) return
          await updateClient.mutateAsync({ status: toggleTarget.status === 'active' ? 'disabled' : 'active' })
          setToggleTarget(null)
        }}
      />
    </div>
  )
}
