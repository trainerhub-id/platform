/**
 * DocumentSelector Component
 *
 * Displays available document agents as selectable cards.
 * Fetches agents from /api/documents/agents and allows users
 * to select an agent type to start the interview process.
 *
 * Requirements: 1.3, 2.1
 */

import React, { useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { cn } from 'src/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Skeleton } from 'src/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import {
  useDocumentStore,
  useAvailableAgents,
  useIsLoadingAgents,
  useAgentsError,
  type AgentInfo,
} from 'src/stores';

// ============================================
// Types
// ============================================

export interface DocumentSelectorProps {
  /** Callback when an agent is selected */
  onAgentSelect?: (agentType: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show as grid or list */
  layout?: 'grid' | 'list';
}

// ============================================
// Agent Icon Mapping
// ============================================

const agentIcons: Record<string, string> = {
  'lesson-plan': 'solar:notebook-bold-duotone',
  'syllabus': 'solar:document-text-bold-duotone',
  'assessment': 'solar:clipboard-check-bold-duotone',
  default: 'solar:document-bold-duotone',
};

const categoryColors: Record<string, string> = {
  training: 'bg-primary/10 text-primary border-primary/20',
  academic: 'bg-info/10 text-info border-info/20',
  evaluation: 'bg-success/10 text-success border-success/20',
  default: 'bg-secondary/10 text-secondary border-secondary/20',
};

// ============================================
// Helper Functions
// ============================================

function getAgentIcon(agentType: string): string {
  return agentIcons[agentType] || agentIcons.default;
}

function getCategoryColor(category: string): string {
  return categoryColors[category.toLowerCase()] || categoryColors.default;
}

// ============================================
// Sub-Components
// ============================================

interface AgentCardProps {
  agent: AgentInfo;
  onSelect: (agentType: string) => void;
  layout: 'grid' | 'list';
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect, layout }) => {
  const isGrid = layout === 'grid';

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:border-primary/50',
        'border-2 border-transparent',
        isGrid ? 'h-full' : 'flex items-center'
      )}
      onClick={() => onSelect(agent.type)}
    >
      <CardHeader className={cn(isGrid ? 'pb-2' : 'flex-shrink-0 py-4')}>
        <div className={cn('flex items-start gap-4', isGrid && 'flex-col')}>
          <div
            className={cn(
              'p-3 rounded-xl transition-colors',
              'bg-lightprimary group-hover:bg-primary',
              'text-primary group-hover:text-white'
            )}
          >
            <Icon icon={getAgentIcon(agent.type)} width={isGrid ? 32 : 24} height={isGrid ? 32 : 24} />
          </div>
          <div className="flex-1">
            <CardTitle className={cn('flex items-center gap-2', isGrid ? 'text-lg' : 'text-base')}>
              {agent.name}
            </CardTitle>
            {agent.category && (
              <Badge
                variant="outline"
                className={cn('mt-2 text-xs', getCategoryColor(agent.category))}
              >
                {agent.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(isGrid ? '' : 'flex-1 py-4')}>
        <CardDescription className={cn('text-sm', isGrid ? '' : 'line-clamp-2')}>
          {agent.description}
        </CardDescription>
        {isGrid && (
          <Button
            variant="lightprimary"
            className="w-full mt-4 group-hover:bg-primary group-hover:text-white"
          >
            <Icon icon="solar:play-bold" className="mr-2 h-4 w-4" />
            Mulai Interview
          </Button>
        )}
      </CardContent>
      {!isGrid && (
        <div className="pr-4">
          <Button variant="ghost" size="icon" className="group-hover:bg-primary group-hover:text-white">
            <Icon icon="solar:arrow-right-linear" width={20} />
          </Button>
        </div>
      )}
    </Card>
  );
};

interface LoadingSkeletonProps {
  layout: 'grid' | 'list';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ layout, count = 3 }) => {
  const isGrid = layout === 'grid';

  return (
    <div className={cn(isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3')}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className={cn(isGrid ? 'h-[220px]' : 'flex items-center h-[100px]')}>
          <CardHeader className={cn(isGrid ? 'pb-2' : 'flex-shrink-0 py-4')}>
            <div className={cn('flex items-start gap-4', isGrid && 'flex-col')}>
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn(isGrid ? '' : 'flex-1 py-4')}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
            {isGrid && <Skeleton className="h-10 w-full mt-4" />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  onRetry: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-lightprimary rounded-full mb-4">
        <Icon icon="solar:document-add-bold-duotone" width={48} height={48} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ada Agent Tersedia</h3>
      <p className="text-gray-500 max-w-md mb-4">
        Belum ada agent dokumen yang tersedia saat ini. Silakan coba lagi nanti atau hubungi administrator.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <Icon icon="solar:refresh-bold" className="mr-2 h-4 w-4" />
        Coba Lagi
      </Button>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  onAgentSelect,
  className,
  layout = 'grid',
}) => {
  // Store state
  const agents = useAvailableAgents();
  const isLoading = useIsLoadingAgents();
  const error = useAgentsError();

  // Store actions
  const { fetchAgents, setDocumentType, clearAgentsError } = useDocumentStore();

  // Fetch agents on mount
  useEffect(() => {
    if (agents.length === 0 && !isLoading && !error) {
      fetchAgents();
    }
  }, [agents.length, isLoading, error, fetchAgents]);

  // Handle agent selection
  const handleAgentSelect = useCallback(
    (agentType: string) => {
      setDocumentType(agentType);
      onAgentSelect?.(agentType);
    },
    [setDocumentType, onAgentSelect]
  );

  // Handle retry
  const handleRetry = useCallback(() => {
    clearAgentsError();
    fetchAgents();
  }, [clearAgentsError, fetchAgents]);

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Icon icon="solar:document-medicine-bold-duotone" className="text-primary" width={28} />
          Pilih Jenis Dokumen
        </h2>
        <p className="text-gray-500 mt-1">
          Pilih jenis dokumen yang ingin Anda buat. Sistem akan memandu Anda melalui serangkaian pertanyaan.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <Icon icon="solar:danger-triangle-bold-duotone" className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Agent</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <Icon icon="solar:refresh-bold" className="mr-1 h-3 w-3" />
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSkeleton layout={layout} />}

      {/* Empty State */}
      {!isLoading && !error && agents.length === 0 && <EmptyState onRetry={handleRetry} />}

      {/* Agent Cards */}
      {!isLoading && agents.length > 0 && (
        <div
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}
        >
          {agents.map((agent) => (
            <AgentCard
              key={agent.type}
              agent={agent}
              onSelect={handleAgentSelect}
              layout={layout}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;
