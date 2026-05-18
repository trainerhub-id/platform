import { useNavigate, useLocation } from 'react-router'
import { useWorkspaces } from '../../hooks/useWorkspaces'
import { useOptionalWorkspace } from '../../context/WorkspaceContext'
import { Icon } from '@iconify/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { formatWorkspaceLabel } from '../../utils/workspaceLabel'

type WorkspaceSwitcherProps = {
  placement?: 'header' | 'sidebar'
  collapsed?: boolean
}

export function WorkspaceSwitcher({
  placement = 'header',
  collapsed = false,
}: WorkspaceSwitcherProps) {
  const { data: workspaces } = useWorkspaces()
  const current = useOptionalWorkspace()
  const navigate = useNavigate()
  const location = useLocation()

  if (!workspaces || workspaces.length === 0) {
    return null
  }

  const sorted = [...workspaces].sort((a, b) => {
    const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
    const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
    return bTs - aTs
  })
  const active = current ?? sorted[0]
  const label = active ? formatWorkspaceLabel(active) : 'Workspace'
  const isSidebar = placement === 'sidebar'

  const goTo = (slug: string) => {
    if (current) {
      const parts = location.pathname.split('/').filter(Boolean)
      parts[0] = slug
      navigate(`/${parts.join('/')}`)
    } else {
      navigate(`/${slug}`)
    }
  }

  const triggerClass = isSidebar
    ? `w-full rounded-md px-4 py-3 text-sm text-link dark:text-darklink hover:text-primary dark:hover:text-primary hover:bg-lightprimary dark:hover:bg-lightprimary transition-colors duration-150 ease-out ${
        collapsed ? 'flex justify-center' : 'flex items-center gap-3 text-left'
      }`
    : 'px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-muted/80'

  const trigger = (
    <button
      type="button"
      className={triggerClass}
      data-testid="workspace-switcher-trigger"
      aria-label={collapsed ? label : 'Pilih workspace'}
      title={label}
    >
      <Icon
        icon="solar:case-round-minimalistic-linear"
        className="h-[18px] w-[18px] min-w-[18px]"
      />
      {!collapsed && (
        <>
          <span className="hide-menu min-w-0 flex-1 truncate">{label}</span>
          <Icon icon="solar:alt-arrow-down-line-duotone" className="hide-menu h-4 w-4 opacity-70" />
        </>
      )}
    </button>
  )

  const contentAlign = isSidebar ? 'start' : 'start'
  const contentSide = isSidebar ? 'right' : 'bottom'

  const handleCurrentClick = () => {
    if (active) goTo(active.slug)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={contentAlign} side={contentSide} className="min-w-64">
        <DropdownMenuLabel>Workspaces saya</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => goTo(ws.slug)}
            className={ws.id === current?.id ? 'font-bold' : ''}
            data-testid={`workspace-switcher-item-${ws.slug}`}
          >
            {formatWorkspaceLabel(ws)}
            {ws.id === current?.id ? ' ✓' : ''}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {active && (
          <DropdownMenuItem onSelect={handleCurrentClick}>
            Buka {formatWorkspaceLabel(active)}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate('/workspaces')}>
          Lihat semua workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
