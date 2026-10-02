import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import type { ClientScope } from '@/api/types'
import { ConflictErrorBanner } from '@/components/forms/ConflictErrorBanner'
import { ScopesPicker } from '@/components/forms/ScopesPicker'
import { SecretRevealDialog } from '@/components/SecretRevealDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateClient } from '@/queries/useClients'

const schema = z.object({
  clientId: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,62}$/, 'Lowercase letters, digits, hyphens; 3-63 characters; must start with a letter or digit'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  scopes: z.array(z.enum(['check', 'admin'])).min(1, 'At least one scope is required'),
})

type FormValues = z.infer<typeof schema>

export function ClientCreatePage() {
  const navigate = useNavigate()
  const createClient = useCreateClient()
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: '', name: '', description: '', scopes: ['check'] },
  })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    try {
      const created = await createClient.mutateAsync({
        client_id: values.clientId,
        name: values.name,
        description: values.description || undefined,
        scopes: values.scopes as ClientScope[],
      })
      setCreatedClientId(created.client_id)
      setRevealedSecret(created.plaintext_secret)
    } catch (err) {
      if (err instanceof ApiError) setSubmitError(err)
      else throw err
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create client</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        {submitError && <ConflictErrorBanner error={submitError} />}

        <div className="space-y-1">
          <Label htmlFor="client-slug">Slug</Label>
          <Input id="client-slug" placeholder="orders-service" className="font-mono" {...register('clientId')} />
          <p className="text-xs text-muted-foreground">Immutable after creation.</p>
          {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="client-name">Name</Label>
          <Input id="client-name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="client-description">Description</Label>
          <Textarea id="client-description" {...register('description')} />
        </div>

        <div className="space-y-1">
          <Label>Scopes</Label>
          <Controller
            control={control}
            name="scopes"
            render={({ field }) => <ScopesPicker value={field.value} onChange={field.onChange} />}
          />
          {errors.scopes && <p className="text-xs text-destructive">{errors.scopes.message}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={createClient.isPending}>
            {createClient.isPending ? 'Creating…' : 'Create client'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>

      <SecretRevealDialog
        open={revealedSecret !== null}
        secret={revealedSecret}
        onDone={() => {
          setRevealedSecret(null)
          createClient.reset()
          if (createdClientId) navigate(`/clients/${createdClientId}`)
        }}
      />
    </div>
  )
}
