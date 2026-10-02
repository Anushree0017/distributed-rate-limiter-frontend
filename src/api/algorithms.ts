import { apiRequest } from '@/api/client'
import type { Algorithm } from '@/api/types'

export function getAlgorithms(): Promise<Algorithm[]> {
  return apiRequest<Algorithm[]>('/algorithms')
}
