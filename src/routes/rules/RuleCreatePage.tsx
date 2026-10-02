import { RuleForm } from '@/routes/rules/RuleForm'

export function RuleCreatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create rule</h1>
      <RuleForm mode="create" />
    </div>
  )
}
