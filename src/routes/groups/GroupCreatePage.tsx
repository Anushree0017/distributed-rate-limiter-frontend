import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { ApiError } from '@/api/client'
import type { GroupMemberInput } from '@/api/types'
import { useClientContext } from '@/clients/ClientContext'
import { ClientPicker } from '@/components/ClientPicker'
import { AlgorithmParamsFields } from '@/components/forms/AlgorithmParamsFields'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { IdentifierTypesPicker } from '@/components/forms/IdentifierTypesPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getStoredActor, setStoredActor } from '@/lib/actor'
import { useAlgorithms } from '@/queries/useAlgorithms'
import { useCreateGroup } from '@/queries/useGroups'

interface MemberRow {
  endpoint: string
  overrides: Record<string, string>
}

interface GroupCreateLocationState {
  initialMembers?: { endpoint: string; overrides: Record<string, unknown> }[]
  initialName?: string
  initialClientId?: string
}

export function GroupCreatePage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: GroupCreateLocationState }
  const { selectedClient } = useClientContext()
  const { data: algorithms } = useAlgorithms()
  const createGroup = useCreateGroup()

  // Populated when arriving from the Import review page's "Create group"
  // action (Section 4, Step 2) — otherwise this is a plain manual create.
  const prefilledMembers = location.state?.initialMembers
  const prefilledName = location.state?.initialName
  const prefilledClientId = location.state?.initialClientId

  const [name, setName] = useState(prefilledName ?? '')
  const [clientId, setClientId] = useState(prefilledClientId ?? selectedClient ?? '')
  const [description, setDescription] = useState('')
  const [algorithmId, setAlgorithmId] = useState('')
  const [identifierTypes, setIdentifierTypes] = useState<string[]>([])
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [priority, setPriority] = useState(100)
  const [actor, setActor] = useState(getStoredActor())
  const [members, setMembers] = useState<MemberRow[]>(
    prefilledMembers?.map((m) => ({ endpoint: m.endpoint, overrides: {} })) ?? [],
  )
  const [error, setError] = useState<ApiError | null>(null)

  const selectedAlgorithm = algorithms?.find((a) => a.id === algorithmId)

  function addMemberRow() {
    setMembers((prev) => [...prev, { endpoint: '', overrides: {} }])
  }

  function updateMember(index: number, patch: Partial<MemberRow>) {
    setMembers((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  function updateMemberOverride(index: number, key: string, value: string) {
    setMembers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m
        const overrides = { ...m.overrides }
        if (value === '') delete overrides[key]
        else overrides[key] = value
        return { ...m, overrides }
      }),
    )
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name || !clientId || !algorithmId || identifierTypes.length === 0 || !actor) return
    setStoredActor(actor)

    const memberInputs: GroupMemberInput[] = members
      .filter((m) => m.endpoint.trim() !== '')
      .map((m) => ({ endpoint: m.endpoint.trim(), overrides: m.overrides }))

    try {
      const group = await createGroup.mutateAsync({
        client_id: clientId,
        name,
        description: description || undefined,
        algorithm_id: algorithmId,
        identifier_types: identifierTypes,
        params,
        priority,
        created_by: actor,
        members: memberInputs.length > 0 ? memberInputs : undefined,
      })
      navigate(`/groups/${group.id}`)
    } catch (err) {
      if (err instanceof ApiError) setError(err)
      else throw err
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create group</h1>
      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        {error && <ConflictErrorBanner error={error} />}

        <div className="space-y-1">
          <Label>Client</Label>
          <ClientPicker value={clientId} onChange={setClientId} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-name">Name</Label>
          <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-description">Description</Label>
          <Textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Algorithm</Label>
          <Select value={algorithmId} onValueChange={setAlgorithmId}>
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
        </div>

        <div className="space-y-1">
          <Label>Identifier types</Label>
          <IdentifierTypesPicker value={identifierTypes} onChange={setIdentifierTypes} />
        </div>

        <div className="space-y-1">
          <Label>Base params</Label>
          <AlgorithmParamsFields schema={selectedAlgorithm?.param_schema as any} value={params} onChange={setParams} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-priority">Priority</Label>
          <Input id="group-priority" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="group-actor">Created by</Label>
          <Input id="group-actor" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="you@example.com" required />
        </div>

        <div className="space-y-2">
          <Label>Initial members (optional)</Label>
          {members.map((m, index) => (
            <div key={index} className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="/api/v1/orders"
                  value={m.endpoint}
                  onChange={(e) => updateMember(index, { endpoint: e.target.value })}
                  className="font-mono"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {Object.keys(params).length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(params).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs">
                        {key} <span className="text-muted-foreground">(base: {String(params[key])})</span>
                      </Label>
                      <Input
                        value={m.overrides[key] ?? ''}
                        placeholder="inherit base value"
                        onChange={(e) => updateMemberOverride(index, key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addMemberRow}>
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={createGroup.isPending}>
            {createGroup.isPending ? 'Creating…' : 'Create group'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
