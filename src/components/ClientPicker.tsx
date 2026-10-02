import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClients } from '@/queries/useClients'

interface ClientPickerProps {
  value: string
  onChange: (clientId: string) => void
  disabled?: boolean
  /** Adds an "All clients" option (value becomes `''`) — used by list
   * filters and the header switcher, never by create forms. */
  includeAllOption?: boolean
  /** Create forms only ever offer `active` clients (plan Section 5); list
   * filters and the switcher also need disabled ones, since existing rows
   * can still belong to a disabled client. */
  includeDisabled?: boolean
  placeholder?: string
  className?: string
}

export function ClientPicker({
  value,
  onChange,
  disabled,
  includeAllOption,
  includeDisabled,
  placeholder = 'Select a client',
  className,
}: ClientPickerProps) {
  const { data } = useClients({ page_size: 100 })
  const clients = (data?.items ?? []).filter((c) => includeDisabled || c.status === 'active')

  return (
    <Select value={value || (includeAllOption ? 'all' : '')} onValueChange={(v) => onChange(v === 'all' ? '' : v)} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value="all">All clients</SelectItem>}
        {clients.map((c) => (
          <SelectItem key={c.client_id} value={c.client_id}>
            {c.name} ({c.client_id})
            {c.status === 'disabled' ? ' — disabled' : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
