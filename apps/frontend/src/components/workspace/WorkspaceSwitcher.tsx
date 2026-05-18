import { useNavigate, useLocation } from 'react-router'
import { useWorkspaces } from '../../hooks/useWorkspaces'
import { useOptionalWorkspace } from '../../context/WorkspaceContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function WorkspaceSwitcher() {
  const { data: workspaces } = useWorkspaces()
  const current = useOptionalWorkspace()
  const navigate = useNavigate()
  const location = useLocation()

  if (!workspaces || workspaces.length === 0) {
    return null
  }

  const label = current?.displayName ?? 'Pilih workspace'

  const goTo = (slug: string) => {
    if (current) {
      const parts = location.pathname.split('/').filter(Boolean)
      parts[0] = slug
      navigate(`/${parts.join('/')}`)
    } else {
      navigate(`/${slug}`)
    }
  }

  if (workspaces.length === 1) {
    return (
      <div
        className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium"
        data-testid="workspace-switcher-single"
      >
        {label}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-muted/80"
          data-testid="workspace-switcher-trigger"
        >
          {label} ▼
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Workspaces saya</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => goTo(ws.slug)}
            className={ws.id === current?.id ? 'font-bold' : ''}
            data-testid={`workspace-switcher-item-${ws.slug}`}
          >
            {ws.displayName}
            {ws.id === current?.id ? ' ✓' : ''}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/workspaces')}>
          Lihat semua workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
