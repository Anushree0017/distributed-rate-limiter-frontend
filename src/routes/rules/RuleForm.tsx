import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import type { Rule } from '@/api/types'
import { AlgorithmParamsFields } from '@/components/forms/AlgorithmParamsFields'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { IdentifierTypesPicker } from '@/components/forms/IdentifierTypesPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useCreateRule, useUpdateRule } from '@/queries/useRules'

const schema = z.object({
  endpoint: z.string().min(1, 'Endpoint is required'),
  identifierTypes: z.array(z.string()).min(1, 'At least one identifier type is required'),
  algorithmId: z.string().min(1, 'Algorithm is required'),
  priority: z.number().int(),
  actor: z.string().min(1, 'Required'),
  status: z.enum(['active', 'inactive']).optional(),
})

type FormValues = z.infer<typeof schema>

interface RuleFormProps {
  mode: 'create' | 'edit'
  rule?: Rule
}

/** Full rule create/edit form. Only used for standalone rules and rule
 * creation — a grouped rule's edit page renders `GroupedRuleOverridesForm`
 * instead (algorithm/identifier types/priority are group-governed). */
export function RuleForm({ mode, rule }: RuleFormProps) {
  const navigate = useNavigate()
  const { data: algorithms } = useAlgorithms()
  const createRule = useCreateRule()
  const updateRule = useUpdateRule(rule?.id ?? '')
  const [params, setParams] = useState<Record<string, unknown>>(rule?.params ?? {})
  const [submitError, setSubmitError] = useState<ApiError | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      endpoint: rule?.endpoint ?? '',
      identifierTypes: rule?.identifier_types ?? [],
      algorithmId: rule?.algorithm.id ?? '',
      priority: rule?.priority ?? 100,
      actor: getStoredActor(),
      status: rule?.status,
    },
  })

  const algorithmId = watch('algorithmId')
  const selectedAlgorithm = algorithms?.find((a) => a.id === algorithmId)

  useEffect(() => {
    if (mode === 'create' && algorithmId && algorithmId !== rule?.algorithm.id) {
      setParams({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithmId])

  const isPending = createRule.isPending || updateRule.isPending

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    setStoredActor(values.actor)
    try {
      if (mode === 'create') {
        const created = await createRule.mutateAsync({
          endpoint: values.endpoint,
          identifier_types: values.identifierTypes,
          algorithm_id: values.algorithmId,
          params,
          priority: values.priority,
          created_by: values.actor,
        })
        navigate(`/rules/${created.id}`)
      } else if (rule) {
        await updateRule.mutateAsync({
          algorithm_id: values.algorithmId,
          params,
          priority: values.priority,
          status: values.status,
          updated_by: values.actor,
          expected_version: rule.version,
        })
        navigate(`/rules/${rule.id}`)
      }
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err)
      else throw err
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      {submitError && <ConflictErrorBanner error={submitError} />}

      <div className="space-y-1">
        <Label htmlFor="endpoint">Endpoint</Label>
        <Input id="endpoint" placeholder="/api/v1/orders" disabled={mode === 'edit'} {...register('endpoint')} />
        {errors.endpoint && <p className="text-xs text-destructive">{errors.endpoint.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Identifier types</Label>
        <Controller
          control={control}
          name="identifierTypes"
          render={({ field }) => <IdentifierTypesPicker value={field.value} onChange={field.onChange} disabled={mode === 'edit'} />}
        />
        {errors.identifierTypes && <p className="text-xs text-destructive">{errors.identifierTypes.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Algorithm</Label>
        <Controller
          control={control}
          name="algorithmId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an algorithm" />
              </SelectTrigger>
              <SelectContent>
                {algorithms?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.algorithmId && <p className="text-xs text-destructive">{errors.algorithmId.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Params</Label>
        <AlgorithmParamsFields schema={selectedAlgorithm?.param_schema as any} value={params} onChange={setParams} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <Input id="priority" type="number" {...register('priority', { valueAsNumber: true })} />
      </div>

      {mode === 'edit' && (
        <div className="space-y-1">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="actor">{mode === 'create' ? 'Created by' : 'Updated by'}</Label>
        <Input id="actor" placeholder="you@example.com" {...register('actor')} />
        {errors.actor && <p className="text-xs text-destructive">{errors.actor.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : mode === 'create' ? 'Create rule' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
