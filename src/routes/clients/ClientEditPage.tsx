import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import type { ClientScope, ClientStatus } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { ScopesPicker } from '@/components/forms/ScopesPicker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useClient, useUpdateClient } from '@/queries/useClients'

export function ClientEditPage() {
  const { client_id: clientId } = useParams<{ client_id: string }>()
  const navigate = useNavigate()
  const { clientId: loggedInClientId } = useAuth()
  const { data: client, isLoading } = useClient(clientId)
  const updateClient = useUpdateClient(clientId ?? '')

  const [name, setName] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [scopes, setScopes] = useState<ClientScope[] | null>(null)
  const [status, setStatus] = useState<ClientStatus | null>(null)
  const [selfLockoutAck, setSelfLockoutAck] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!client) return <p className="text-sm text-destructive">Client not found.</p>

  const nameValue = name ?? client.name
  const descriptionValue = description ?? client.description ?? ''
  const scopesValue = scopes ?? client.scopes
  const statusValue = status ?? client.status

  // Same self-lockout guard as `ToggleClientStatusDialog` — this form is
  // another path to the same disable action, so it needs the same warning.
  const isSelfDisabling = statusValue === 'disabled' && client.status === 'active' && clientId === loggedInClientId

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (isSelfDisabling && !selfLockoutAck) return
    try {
      await updateClient.mutateAsync({
        name: nameValue,
        description: descriptionValue,
        scopes: scopesValue,
        status: statusValue,
      })
      navigate(`/clients/${clientId}`)
    } catch (err) {
      if (err instanceof ApiError) setError(err)
      else throw err
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit client</h1>
      <form onSubmit={onSubmit} className="max-w-xl space-y-6">
        {error && <ConflictErrorBanner error={error} />}

        <div className="space-y-1">
          <Label>Slug</Label>
          <Input value={client.client_id} disabled className="font-mono" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="client-name">Name</Label>
          <Input id="client-name" value={nameValue} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="client-description">Description</Label>
          <Textarea id="client-description" value={descriptionValue} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Scopes</Label>
          <ScopesPicker value={scopesValue} onChange={setScopes} />
        </div>

        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={statusValue}
            onValueChange={(v) => {
              setStatus(v as ClientStatus)
              setSelfLockoutAck(false)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSelfDisabling && (
          <label className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <Checkbox checked={selfLockoutAck} onCheckedChange={(v) => setSelfLockoutAck(Boolean(v))} />
            <span>This is the client you're currently logged in as — disabling it will log you out. I understand.</span>
          </label>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={updateClient.isPending || (isSelfDisabling && !selfLockoutAck)}>
            {updateClient.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
