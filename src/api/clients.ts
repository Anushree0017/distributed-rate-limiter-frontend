import { apiRequest } from '@/api/client'
import type {
  Client,
  ClientCreateRequest,
  ClientCreateResponse,
  ClientDetail,
  ClientFilters,
  ClientListResponse,
  ClientSecretCreateResponse,
  ClientUpdateRequest,
} from '@/api/types'

export function getClients(filters: ClientFilters): Promise<ClientListResponse> {
  return apiRequest<ClientListResponse>('/clients', { query: { ...filters } })
}

export function getClient(clientId: string): Promise<ClientDetail> {
  return apiRequest<ClientDetail>(`/clients/${clientId}`)
}

export function createClient(payload: ClientCreateRequest): Promise<ClientCreateResponse> {
  return apiRequest<ClientCreateResponse>('/clients', { method: 'POST', body: payload })
}

export function patchClient(clientId: string, payload: ClientUpdateRequest): Promise<Client> {
  return apiRequest<Client>(`/clients/${clientId}`, { method: 'PATCH', body: payload })
}

export function addSecret(clientId: string): Promise<ClientSecretCreateResponse> {
  return apiRequest<ClientSecretCreateResponse>(`/clients/${clientId}/secrets`, { method: 'POST' })
}

export function revokeSecret(clientId: string, secretId: string): Promise<void> {
  return apiRequest<void>(`/clients/${clientId}/secrets/${secretId}`, { method: 'DELETE' })
}
