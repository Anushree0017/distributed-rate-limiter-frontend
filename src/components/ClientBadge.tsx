import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useClientLookup } from '@/queries/useClients'

interface ClientBadgeProps {
  clientId: string
  link?: boolean
}

export function ClientBadge({ clientId, link = true }: ClientBadgeProps) {
  const lookup = useClientLookup()
  const client = lookup.get(clientId)
  const disabled = client?.status === 'disabled'

  const content = (
    <Badge variant={disabled ? 'secondary' : 'outline'} className="font-mono">
      {clientId}
      {disabled && <span className="ml-1 font-sans text-[10px] font-normal uppercase tracking-wide">disabled</span>}
    </Badge>
  )

  if (!link) return content
  return (
    <Link to={`/clients/${clientId}`} className="hover:opacity-80">
      {content}
    </Link>
  )
}
