import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { GroupMember } from '@/api/types'
import { AddMembersModal } from '@/components/AddMembersModal'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { DeleteGroupDialog } from '@/components/DeleteGroupDialog'
import { DetachRuleModal } from '@/components/DetachRuleModal'
import { EffectiveParamsPreview } from '@/components/forms/EffectiveParamsPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeleteGroup, useGroup } from '@/queries/useGroups'

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: group, isLoading } = useGroup(id)
  const deleteGroup = useDeleteGroup()
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [detachTarget, setDetachTarget] = useState<GroupMember | null>(null)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!group) return <p className="text-sm text-destructive">Group not found.</p>

  const columns: DataTableColumn<GroupMember>[] = [
    { key: 'endpoint', header: 'Endpoint', render: (m) => <span className="font-mono text-sm">{m.endpoint}</span>, sortValue: (m) => m.endpoint },
    {
      key: 'overrides',
      header: 'Overrides',
      render: (m) => (Object.keys(m.overrides).length > 0 ? <Badge variant="secondary">{Object.keys(m.overrides).length} overridden</Badge> : <span className="text-muted-foreground">none</span>),
    },
    { key: 'effective_params', header: 'Effective params', render: (m) => <EffectiveParamsPreview baseParams={group.params} overrides={m.overrides} /> },
    { key: 'is_active', header: 'Active', render: (m) => <Badge variant={m.is_active ? 'success' : 'secondary'}>{m.is_active ? 'active' : 'inactive'}</Badge> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (m) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/rules/${m.rule_id}/edit`)}>
            Edit overrides
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDetachTarget(m)}>
            Detach
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{group.name}</h1>
          {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/edit`)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            Delete group
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base params</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Algorithm</dt>
              <dd>{group.algorithm.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Identifier types</dt>
              <dd className="font-mono">{group.identifier_types.join('+')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Priority</dt>
              <dd>{group.priority}</dd>
            </div>
          </dl>
          <EffectiveParamsPreview baseParams={group.params} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Members ({group.members.length})</CardTitle>
          <Button size="sm" onClick={() => setShowAddMembers(true)}>
            Add members
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={group.members} rowKey={(m) => m.rule_id} emptyMessage="No members yet." />
        </CardContent>
      </Card>

      <AddMembersModal group={group} open={showAddMembers} onOpenChange={setShowAddMembers} />

      <DeleteGroupDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        groupName={group.name}
        isPending={deleteGroup.isPending}
        onConfirm={async (members) => {
          await deleteGroup.mutateAsync({ id: group.id, members })
          navigate('/groups')
        }}
      />

      {detachTarget && (
        <DetachRuleModal
          ruleId={detachTarget.rule_id}
          open={Boolean(detachTarget)}
          onOpenChange={(open) => !open && setDetachTarget(null)}
        />
      )}
    </div>
  )
}
