import { API_URL } from '@/config'
import { ApiError, apiRequest } from '@/api/client'
import type {
  AddMembersRequest,
  AddMembersResponse,
  RuleGroup,
  RuleGroupCreateRequest,
  RuleGroupDetail,
  RuleGroupFilters,
  RuleGroupListResponse,
  RuleGroupUpdateRequest,
} from '@/api/types'

export function getGroups(filters: RuleGroupFilters): Promise<RuleGroupListResponse> {
  return apiRequest<RuleGroupListResponse>('/groups', { query: { ...filters } })
}

export function getGroup(id: string): Promise<RuleGroupDetail> {
  return apiRequest<RuleGroupDetail>(`/groups/${id}`)
}

export function createGroup(payload: RuleGroupCreateRequest): Promise<RuleGroup> {
  return apiRequest<RuleGroup>('/groups', { method: 'POST', body: payload })
}

export function updateGroup(id: string, payload: RuleGroupUpdateRequest): Promise<RuleGroup> {
  return apiRequest<RuleGroup>(`/groups/${id}`, { method: 'PATCH', body: payload })
}

export function deleteGroup(id: string, members: 'detach' | 'delete'): Promise<void> {
  return apiRequest<void>(`/groups/${id}`, { method: 'DELETE', query: { members } })
}

// Unlike every other endpoint, `POST /groups/{id}/members`'s 409 response is
// *itself* the normal AddMembersResponseDTO shape (conflicts populated,
// created empty) — not the {error:{...}} envelope. So this bypasses
// apiRequest's throw-on-non-2xx behavior and returns the body either way;
// only a genuinely unexpected status (5xx, network) throws.
export async function addMembers(groupId: string, payload: AddMembersRequest): Promise<AddMembersResponse> {
  const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (response.status === 201 || response.status === 409) {
    return data as AddMembersResponse
  }
  throw new ApiError(response.status, data?.error?.code ?? 'UNKNOWN_ERROR', data?.error?.message ?? 'Request failed', data?.error?.details ?? {})
}
