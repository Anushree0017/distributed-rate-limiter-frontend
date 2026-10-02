import { apiRequest } from '@/api/client'
import type {
  DetachRuleRequest,
  MoveToGroupRequest,
  Rule,
  RuleCreateRequest,
  RuleFilters,
  RuleListResponse,
  RuleUpdateRequest,
} from '@/api/types'

export function getRules(filters: RuleFilters): Promise<RuleListResponse> {
  return apiRequest<RuleListResponse>('/rules', { query: { ...filters } })
}

export function getRule(id: string): Promise<Rule> {
  return apiRequest<Rule>(`/rules/${id}`)
}

export function createRule(payload: RuleCreateRequest): Promise<Rule> {
  return apiRequest<Rule>('/rules', { method: 'POST', body: payload })
}

export function updateRule(id: string, payload: RuleUpdateRequest): Promise<Rule> {
  return apiRequest<Rule>(`/rules/${id}`, { method: 'PATCH', body: payload })
}

export function deleteRule(id: string): Promise<void> {
  return apiRequest<void>(`/rules/${id}`, { method: 'DELETE' })
}

export function detachRule(id: string, payload: DetachRuleRequest): Promise<Rule> {
  return apiRequest<Rule>(`/rules/${id}/detach`, { method: 'PATCH', body: payload })
}

export function moveRuleToGroup(id: string, payload: MoveToGroupRequest): Promise<Rule> {
  return apiRequest<Rule>(`/rules/${id}/move-to-group`, { method: 'POST', body: payload })
}

export function getIdentifierTypes(): Promise<{ identifier_types: string[] }> {
  return apiRequest<{ identifier_types: string[] }>('/rules/identifiers')
}
