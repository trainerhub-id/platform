import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaces, type Workspace } from '../api/workspace.api'

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
    staleTime: 60_000, // 1 min
  })
}
