import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as rulesApi from '@/api/rules'
import type {
  DetachRuleRequest,
  MoveToGroupRequest,
  RuleCreateRequest,
  RuleFilters,
  RuleUpdateRequest,
} from '@/api/types'

export function useRules(filters: RuleFilters) {
  return useQuery({
    queryKey: ['rules', filters],
    queryFn: () => rulesApi.getRules(filters),
    placeholderData: (previous) => previous,
  })
}

export function useRule(id: string | undefined) {
  return useQuery({
    queryKey: ['rules', id],
    queryFn: () => rulesApi.getRule(id as string),
    enabled: Boolean(id),
  })
}

export function useIdentifierTypes() {
  return useQuery({
    queryKey: ['identifier-types'],
    queryFn: rulesApi.getIdentifierTypes,
    staleTime: 60 * 60 * 1000,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RuleCreateRequest) => rulesApi.createRule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useUpdateRule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RuleUpdateRequest) => rulesApi.updateRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

/** Row-level status toggle on the Rules list — unlike `useUpdateRule`, the
 * rule id isn't known until the mutation is actually called. */
export function useToggleRuleStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, updatedBy }: { id: string; status: 'active' | 'inactive'; updatedBy: string }) =>
      rulesApi.updateRule(id, { status, updated_by: updatedBy }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useDeleteRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rulesApi.deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
  })
}

export function useDetachRule(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DetachRuleRequest) => rulesApi.detachRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export function useMoveRuleToGroup(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MoveToGroupRequest) => rulesApi.moveRuleToGroup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
