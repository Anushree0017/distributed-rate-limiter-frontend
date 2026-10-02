import { useParams } from 'react-router-dom'
import { useGroup } from '@/queries/useGroups'
import { useRule } from '@/queries/useRules'
import { GroupedRuleOverridesForm } from '@/routes/rules/GroupedRuleOverridesForm'
import { RuleForm } from '@/routes/rules/RuleForm'

export function RuleEditPage() {
  const { id } = useParams<{ id: string }>()
  const { data: rule, isLoading } = useRule(id)
  const { data: group, isLoading: isGroupLoading } = useGroup(rule?.group_id ?? undefined)

  if (isLoading || (rule?.group_id && isGroupLoading)) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (!rule) return <p className="text-sm text-destructive">Rule not found.</p>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit rule</h1>
      {rule.group_id && group ? <GroupedRuleOverridesForm rule={rule} group={group} /> : <RuleForm mode="edit" rule={rule} />}
    </div>
  )
}
