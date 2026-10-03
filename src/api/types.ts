export const IDENTIFIER_TYPES = [
  'global',
  'user_id',
  'api_key',
  'client_id',
  'ip',
  'tenant_id',
  'session_id',
  'device_id',
  'organization_id',
  'account_id',
  'region',
  'user_agent',
  'request_source',
  'subscription_tier',
  'webhook_id',
  'ip_range',
  'endpoint',
] as const

export type IdentifierType = (typeof IDENTIFIER_TYPES)[number]

export const MAX_IDENTIFIERS_PER_RULE = 3

export type RuleStatus = 'active' | 'inactive'

export interface AlgorithmSummary {
  id: string
  name: string
}

export interface Algorithm {
  id: string
  name: string
  description: string | null
  param_schema: Record<string, unknown>
}

export interface Rule {
  id: string
  client_id: string
  endpoint: string
  identifier_types: string[]
  identifier_signature: string
  algorithm: AlgorithmSummary
  params: Record<string, unknown>
  status: RuleStatus
  priority: number
  version: number
  group_id: string | null
  overrides: Record<string, unknown> | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface RuleListResponse {
  items: Rule[]
  page: number
  page_size: number
  total: number
}

export interface RuleFilters {
  client_id?: string
  endpoint?: string
  identifier_type?: string
  identifier_signature?: string
  status?: RuleStatus
  algorithm_id?: string
  page?: number
  page_size?: number
}

export interface RuleCreateRequest {
  client_id: string
  endpoint: string
  identifier_types: string[]
  algorithm_id: string
  params: Record<string, unknown>
  priority: number
  created_by: string
}

export interface RuleUpdateRequest {
  algorithm_id?: string
  params?: Record<string, unknown>
  priority?: number
  status?: RuleStatus
  overrides?: Record<string, unknown>
  updated_by: string
  expected_version?: number
}

export interface DetachRuleRequest {
  algorithm: string
  params: Record<string, unknown>
}

export interface MoveToGroupRequest {
  group_id: string
  overrides?: Record<string, unknown>
  updated_by: string
}

export interface GroupMemberInput {
  endpoint: string
  overrides: Record<string, unknown>
}

export interface RuleGroup {
  id: string
  client_id: string
  name: string
  description: string | null
  algorithm: AlgorithmSummary
  identifier_types: string[]
  identifier_signature: string
  params: Record<string, unknown>
  priority: number
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface RuleGroupListItem extends RuleGroup {
  member_count: number
}

export interface GroupMember {
  rule_id: string
  endpoint: string
  overrides: Record<string, unknown>
  params: Record<string, unknown>
  is_active: boolean
}

export interface RuleGroupDetail extends RuleGroup {
  members: GroupMember[]
}

export interface RuleGroupListResponse {
  items: RuleGroupListItem[]
  page: number
  page_size: number
  total: number
}

export interface RuleGroupFilters {
  client_id?: string
  name_contains?: string
  page?: number
  page_size?: number
}

export interface RuleGroupCreateRequest {
  client_id: string
  name: string
  description?: string | null
  algorithm_id: string
  identifier_types: string[]
  params: Record<string, unknown>
  priority: number
  created_by: string
  members?: GroupMemberInput[]
}

export interface RuleGroupUpdateRequest {
  name?: string
  description?: string | null
  params?: Record<string, unknown>
  priority?: number
  updated_by: string
}

export interface AddMembersRequest {
  members: GroupMemberInput[]
}

export interface MemberDiffEntry {
  endpoint: string
  rule_id: string | null
  overrides: Record<string, unknown> | null
}

export interface MemberConflictEntry {
  endpoint: string
  reason: string
  existing_rule_id: string | null
  existing_group_id: string | null
}

export interface AddMembersResponse {
  created: MemberDiffEntry[]
  conflicts: MemberConflictEntry[]
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details: Record<string, unknown>
  }
}

export type ClientStatus = 'active' | 'disabled'
export type ClientScope = 'check' | 'admin'

export interface Client {
  client_id: string
  name: string
  description: string | null
  status: ClientStatus
  scopes: ClientScope[]
  created_at: string
  updated_at: string
}

export interface ClientSecret {
  id: string
  secret_hint: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

// `GET /clients/{client_id}` is assumed to embed the secrets list (plan
// Section 5's "Secrets panel") — there's no separate list-secrets endpoint
// in the backend contract summary.
export interface ClientDetail extends Client {
  secrets: ClientSecret[]
}

export interface ClientListResponse {
  items: Client[]
  page: number
  page_size: number
  total: number
}

export interface ClientFilters {
  name?: string
  status?: ClientStatus
  page?: number
  page_size?: number
}

export interface ClientCreateRequest {
  client_id: string
  name: string
  description?: string | null
  scopes: ClientScope[]
}

export interface ClientUpdateRequest {
  name?: string
  description?: string | null
  scopes?: ClientScope[]
  status?: ClientStatus
}

export interface ClientSecretCreateResponse {
  secret: ClientSecret
  plaintext_secret: string
}

// `POST /clients` returns the new client plus its first secret's plaintext
// — the only other place (besides add-secret) the plaintext is ever sent.
export interface ClientCreateResponse extends Client {
  plaintext_secret: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface OAuthErrorBody {
  error: string
  error_description?: string
}
