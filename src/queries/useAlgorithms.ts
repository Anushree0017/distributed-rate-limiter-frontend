import { useQuery } from '@tanstack/react-query'
import { getAlgorithms } from '@/api/algorithms'

export function useAlgorithms() {
  return useQuery({
    queryKey: ['algorithms'],
    queryFn: getAlgorithms,
    staleTime: 5 * 60 * 1000,
  })
}
