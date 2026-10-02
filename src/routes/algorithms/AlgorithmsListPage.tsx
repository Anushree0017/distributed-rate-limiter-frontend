import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useAlgorithms } from '@/queries/useAlgorithms'
import type { Algorithm } from '@/api/types'

const columns: DataTableColumn<Algorithm>[] = [
  { key: 'name', header: 'Name', render: (a) => <span className="font-medium">{a.name}</span>, sortValue: (a) => a.name },
  { key: 'description', header: 'Description', render: (a) => a.description ?? '—' },
  {
    key: 'params',
    header: 'Param schema',
    render: (a) => {
      const props = (a.param_schema?.properties as Record<string, unknown> | undefined) ?? {}
      const keys = Object.keys(props)
      return keys.length > 0 ? <span className="font-mono text-xs">{keys.join(', ')}</span> : <span className="text-muted-foreground">—</span>
    },
  },
]

export function AlgorithmsListPage() {
  const { data, isLoading } = useAlgorithms()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Algorithms</h1>
        <p className="text-sm text-muted-foreground">Read-only reference — algorithms are seeded, not managed here.</p>
      </div>
      <DataTable columns={columns} data={data ?? []} rowKey={(a) => a.id} isLoading={isLoading} emptyMessage="No algorithms." />
    </div>
  )
}
