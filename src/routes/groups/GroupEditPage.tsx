import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { AlgorithmParamsFields } from '@/components/forms/AlgorithmParamsFields'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useGroup, useUpdateGroup } from '@/queries/useGroups'

// Correction 1: no Active toggle — `rule_groups` has no `is_active` column,
// only member rules do. Algorithm/identifier types are also immutable here
// (the API rejects them with extra="forbid"), so only name/description/base
// params/priority are editable.
export function GroupEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: group, isLoading } = useGroup(id)
  const { data: algorithms } = useAlgorithms()
  const updateGroup = useUpdateGroup(id ?? '')

  const [name, setName] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [params, setParams] = useState<Record<string, unknown> | null>(null)
  const [priority, setPriority] = useState<number | null>(null)
  const [actor, setActor] = useState(getStoredActor())
  const [error, setError] = useState<ApiError | null>(null)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!group) return <p className="text-sm text-destructive">Group not found.</p>

  const currentAlgorithm = algorithms?.find((a) => a.id === group.algorithm.id)
  const nameValue = name ?? group.name
  const descriptionValue = description ?? group.description ?? ''
  const paramsValue = params ?? group.params
  const priorityValue = priority ?? group.priority

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!actor) return
    setStoredActor(actor)
    try {
      await updateGroup.mutateAsync({
        name: nameValue,
        description: descriptionValue,
        params: paramsValue,
        priority: priorityValue,
        updated_by: actor,
      })
      navigate(`/groups/${id}`)
    } catch (err) {
      if (err instanceof ApiError) setError(err)
      else throw err
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Edit group</h1>
      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        {error && <ConflictErrorBanner error={error} />}

        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Algorithm ({group.algorithm.name}) and identifier types ({group.identifier_types.join('+')}) are immutable after
          creation.
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-name">Name</Label>
          <Input id="group-name" value={nameValue} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-description">Description</Label>
          <Textarea id="group-description" value={descriptionValue} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Base params</Label>
          <AlgorithmParamsFields
            schema={currentAlgorithm?.param_schema as any}
            value={paramsValue}
            onChange={(v) => setParams(v)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-priority">Priority</Label>
          <Input id="group-priority" type="number" value={priorityValue} onChange={(e) => setPriority(Number(e.target.value))} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-actor">Updated by</Label>
          <Input id="group-actor" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="you@example.com" required />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={updateGroup.isPending}>
            {updateGroup.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
