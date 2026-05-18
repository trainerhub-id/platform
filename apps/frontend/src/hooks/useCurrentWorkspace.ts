import { useMemo } from 'react'
import { useParams } from 'react-router'
import type { Workspace } from '../api/workspace.api'
import { useWorkspaces } from './useWorkspaces'

export type CurrentWorkspaceResult =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-workspaces' }
  | { status: 'mismatch'; defaultSlug: string }
  | { status: 'ok'; workspace: Workspace }

export function useCurrentWorkspace(): CurrentWorkspaceResult {
  const { slug } = useParams<{ slug: string }>()
  const { data: workspaces, isLoading, isError } = useWorkspaces()

  return useMemo<CurrentWorkspaceResult>(() => {
    if (isLoading) return { status: 'loading' }
    if (isError || !workspaces) return { status: 'unauthenticated' }
    if (workspaces.length === 0) return { status: 'no-workspaces' }

    const matched = workspaces.find((w) => w.slug === slug)
    if (matched) return { status: 'ok', workspace: matched }

    const sorted = [...workspaces].sort((a, b) => {
      const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
      const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
      return bTs - aTs
    })
    return { status: 'mismatch', defaultSlug: sorted[0].slug }
  }, [isLoading, isError, workspaces, slug])
}
