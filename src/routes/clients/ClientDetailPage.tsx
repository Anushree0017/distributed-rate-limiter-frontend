import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import type { ClientSecret } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { SecretRevealDialog } from '@/components/SecretRevealDialog'
import { ToggleClientStatusDialog } from '@/components/ToggleClientStatusDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAddSecret, useClient, useRevokeSecret, useUpdateClient } from '@/queries/useClients'

const MAX_ACTIVE_SECRETS = 2

export function ClientDetailPage() {
  const { client_id: clientId } = useParams<{ client_id: string }>()
  const navigate = useNavigate()
  const { data: client, isLoading } = useClient(clientId)
  const addSecret = useAddSecret(clientId ?? '')
  const revokeSecret = useRevokeSecret(clientId ?? '')
  const updateClient = useUpdateClient(clientId ?? '')
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ClientSecret | null>(null)
  const [revokeError, setRevokeError] = useState<ApiError | null>(null)
  const [showToggle, setShowToggle] = useState(false)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!client) return <p className="text-sm text-destructive">Client not found.</p>

  const activeSecretCount = client.secrets.filter((s) => !s.revoked_at).length
  const atSecretLimit = activeSecretCount >= MAX_ACTIVE_SECRETS

  const secretColumns: DataTableColumn<ClientSecret>[] = [
    { key: 'secret_hint', header: 'Secret', render: (s) => <span className="font-mono text-sm">••••{s.secret_hint}</span> },
    { key: 'created_at', header: 'Created', render: (s) => new Date(s.created_at).toLocaleString() },
    { key: 'expires_at', header: 'Expires', render: (s) => (s.expires_at ? new Date(s.expires_at).toLocaleString() : '—') },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (s.revoked_at ? <Badge variant="secondary">revoked</Badge> : <Badge variant="success">active</Badge>),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (s) =>
        !s.revoked_at ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRevokeError(null)
              setRevokeTarget(s)
            }}
          >
            Revoke
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{client.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{client.client_id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/clients/${client.client_id}/edit`)}>
            Edit
          </Button>
          <Button variant={client.status === 'active' ? 'destructive' : 'default'} onClick={() => setShowToggle(true)}>
            {client.status === 'active' ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>{client.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Scopes</dt>
              <dd>{client.scopes.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt>
              <dd>{new Date(client.created_at).toLocaleString()}</dd>
            </div>
            {client.description && (
              <div className="col-span-full">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Description</dt>
                <dd>{client.description}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <Link to={`/rules?client=${client.client_id}`} className="text-primary hover:underline">
            View rules
          </Link>
          <Link to={`/groups?client=${client.client_id}`} className="text-primary hover:underline">
            View groups
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Secrets</CardTitle>
          <span title={atSecretLimit ? 'Two active secrets already exist — revoke one before adding another.' : undefined}>
            <Button
              size="sm"
              disabled={atSecretLimit || addSecret.isPending}
              onClick={async () => {
                const result = await addSecret.mutateAsync()
                setRevealedSecret(result.plaintext_secret)
              }}
            >
              {addSecret.isPending ? 'Adding…' : 'Add secret'}
            </Button>
          </span>
        </CardHeader>
        <CardContent>
          <DataTable columns={secretColumns} data={client.secrets} rowKey={(s) => s.id} emptyMessage="No secrets yet." />
          {revokeError && <p className="mt-2 text-sm text-destructive">{revokeError.message}</p>}
        </CardContent>
      </Card>

      <SecretRevealDialog
        open={revealedSecret !== null}
        secret={revealedSecret}
        onDone={() => {
          setRevealedSecret(null)
          addSecret.reset()
        }}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke secret"
        description="Callers using this secret will immediately stop authenticating. This cannot be undone."
        confirmLabel="Revoke"
        isPending={revokeSecret.isPending}
        onConfirm={async () => {
          if (!revokeTarget) return
          try {
            await revokeSecret.mutateAsync(revokeTarget.id)
            setRevokeTarget(null)
          } catch (err) {
            if (err instanceof ApiError) {
              setRevokeError(err)
              setRevokeTarget(null)
            } else throw err
          }
        }}
      />

      <ToggleClientStatusDialog
        client={client}
        open={showToggle}
        onOpenChange={setShowToggle}
        isPending={updateClient.isPending}
        onConfirm={async () => {
          await updateClient.mutateAsync({ status: client.status === 'active' ? 'disabled' : 'active' })
          setShowToggle(false)
        }}
      />
    </div>
  )
}
