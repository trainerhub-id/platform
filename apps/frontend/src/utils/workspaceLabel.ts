import type { Workspace } from 'src/api/workspace.api'

export function formatWorkspaceLabel(workspace: Pick<Workspace, 'displayName' | 'slug'>): string {
  const batchMatch = workspace.displayName.match(/Batch\s+(\d+)/i) ?? workspace.slug.match(/btch(\d+)/i)

  if (batchMatch) {
    return `Batch ${batchMatch[1]} - Trainers`
  }

  return workspace.displayName
}
