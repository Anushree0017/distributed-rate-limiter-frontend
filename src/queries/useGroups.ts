import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as groupsApi from '@/api/groups'
import type {
  AddMembersRequest,
  RuleGroupCreateRequest,
  RuleGroupFilters,
  RuleGroupUpdateRequest,
} from '@/api/types'

export function useGroups(filters: RuleGroupFilters) {
  return useQuery({
    queryKey: ['groups', filters],
    queryFn: () => groupsApi.getGroups(filters),
    placeholderData: (previous) => previous,
  })
}

export function useGroup(id: string | undefined) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.getGroup(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RuleGroupCreateRequest) => groupsApi.createGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useUpdateGroup(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RuleGroupUpdateRequest) => groupsApi.updateGroup(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, members }: { id: string; members: 'detach' | 'delete' }) => groupsApi.deleteGroup(id, members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    },
  })
}

export function useAddMembers(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddMembersRequest) => groupsApi.addMembers(groupId, payload),
    onSuccess: (result) => {
      if (result.conflicts.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        queryClient.invalidateQueries({ queryKey: ['rules'] })
      }
    },
  })
}
