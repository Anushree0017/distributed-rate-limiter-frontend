import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as clientsApi from '@/api/clients'
import type { Client, ClientCreateRequest, ClientFilters, ClientUpdateRequest } from '@/api/types'

// Fetched once and cached for a few minutes (plan Section 7) — resolves
// slugs to display names and feeds `ClientPicker` without a per-row fetch.
const CLIENTS_STALE_TIME = 5 * 60 * 1000

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsApi.getClients(filters),
    staleTime: CLIENTS_STALE_TIME,
    placeholderData: (previous) => previous,
  })
}

/** Slug -> Client lookup, backed by the single cached `page_size: 100`
 * clients fetch (same query key as `ClientPicker`'s) — `ClientBadge` reads
 * from this instead of fetching per row. */
export function useClientLookup(): Map<string, Client> {
  const { data } = useClients({ page_size: 100 })
  const lookup = new Map<string, Client>()
  for (const client of data?.items ?? []) lookup.set(client.client_id, client)
  return lookup
}

export function useClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ['clients', clientId],
    queryFn: () => clientsApi.getClient(clientId as string),
    enabled: Boolean(clientId),
    staleTime: CLIENTS_STALE_TIME,
  })
}

// `gcTime: 0` — the response carries the new client's first plaintext
// secret, which must never linger in the query cache (plan Section 6).
export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreateRequest) => clientsApi.createClient(payload),
    gcTime: 0,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientUpdateRequest) => clientsApi.patchClient(clientId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })
}

// `gcTime: 0` on both secret mutations: the plaintext secret must never
// linger in the TanStack Query cache (plan Section 6). Callers read it off
// the mutation result and hand it to `SecretRevealDialog` via local state.
export function useAddSecret(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clientsApi.addSecret(clientId),
    gcTime: 0,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', clientId] }),
  })
}

export function useRevokeSecret(clientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (secretId: string) => clientsApi.revokeSecret(clientId, secretId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', clientId] }),
  })
}
