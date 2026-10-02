import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  className?: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  pagination?: Pagination
}

/** Hand-rolled sort/paginate wrapper — no table library, per the build plan
 * (v1 resource lists are tens of rows). Pagination, when provided, is
 * server-driven (the API already paginates); sorting is client-side over the
 * current page only. */
export function DataTable<T>({ columns, data, rowKey, isLoading, emptyMessage = 'No results.', pagination }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return data
    const column = columns.find((c) => c.key === sort.key)
    if (!column?.sortValue) return data
    const copy = [...data]
    copy.sort((a, b) => {
      const av = column.sortValue!(a)
      const bv = column.sortValue!(b)
      if (av < bv) return sort.direction === 'asc' ? -1 : 1
      if (av > bv) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [data, sort, columns])

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortValue) return
    setSort((current) => {
      if (current?.key !== column.key) return { key: column.key, direction: 'asc' }
      return { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    })
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(column.className, column.sortValue && 'cursor-pointer select-none')}
                onClick={() => toggleSort(column)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortValue && <ChevronsUpDown className="h-3 w-3" />}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!isLoading && sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            sorted.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {totalPages} · {pagination.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
