import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ClientBadge } from '@/components/ClientBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DetachRuleModal } from '@/components/DetachRuleModal'
import { EffectiveParamsPreview } from '@/components/forms/EffectiveParamsPreview'
import { MoveToGroupModal } from '@/components/MoveToGroupModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeleteRule, useRule } from '@/queries/useRules'

export function RuleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: rule, isLoading } = useRule(id)
  const deleteRule = useDeleteRule()
  const [showDelete, setShowDelete] = useState(false)
  const [showDetach, setShowDetach] = useState(false)
  const [showMove, setShowMove] = useState(false)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!rule) return <p className="text-sm text-destructive">Rule not found.</p>

  const redisScope = `${rule.algorithm.name}:${rule.identifier_signature}`

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-semibold">{rule.endpoint}</h1>
          <p className="text-sm text-muted-foreground">{rule.identifier_signature}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/rules/${rule.id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Client</dt>
              <dd>
                <ClientBadge clientId={rule.client_id} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Algorithm</dt>
              <dd>{rule.algorithm.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Priority</dt>
              <dd>{rule.priority}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={rule.status === 'active' ? 'success' : 'secondary'}>{rule.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Version</dt>
              <dd>{rule.version}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Group</dt>
              <dd>
                {rule.group_id ? (
                  <Link to={`/groups/${rule.group_id}`} className="text-primary hover:underline">
                    view group
                  </Link>
                ) : (
                  <span className="text-muted-foreground">standalone</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Created by</dt>
              <dd>{rule.created_by}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Effective params</CardTitle>
        </CardHeader>
        <CardContent>
          <EffectiveParamsPreview baseParams={rule.params} overrides={rule.overrides} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redis scope</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Never render the raw identifier value/digest — algorithm:signature only. */}
          <p className="font-mono text-sm">{redisScope}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMove(true)}>
            Move to group
          </Button>
          {rule.group_id && (
            <Button variant="outline" onClick={() => setShowDetach(true)}>
              Detach
            </Button>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete rule"
        description="This is irreversible — there is no undo in the API."
        confirmLabel="Delete"
        isPending={deleteRule.isPending}
        onConfirm={async () => {
          await deleteRule.mutateAsync(rule.id)
          navigate('/rules')
        }}
      />

      <DetachRuleModal ruleId={rule.id} open={showDetach} onOpenChange={setShowDetach} />
      <MoveToGroupModal ruleId={rule.id} open={showMove} onOpenChange={setShowMove} />
    </div>
  )
}
