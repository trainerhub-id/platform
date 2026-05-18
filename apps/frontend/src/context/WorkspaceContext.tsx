import { createContext, useContext, type ReactNode } from 'react'
import type { Workspace } from '../api/workspace.api'

const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace
  children: ReactNode
}) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): Workspace {
  const ws = useContext(WorkspaceContext)
  if (!ws) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider> (route under /:slug/*)')
  }
  return ws
}

export function useOptionalWorkspace(): Workspace | null {
  return useContext(WorkspaceContext)
}
