/**
 * AI Generator Page
 *
 * Interview flow for AI document generation.
 * Integrates document selection and interview components.
 *
 * Flow:
 * 1. Select document type (DocumentSelector)
 * 2. Answer interview questions (InterviewPhase)
 * Requirements: All requirements integration
 */

import { useContext, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { CustomizerContext } from 'src/context/CustomizerContext';
import aiHeroImg from 'src/assets/images/aipage/ai asset 2 1.png';
import { useAiGenerator } from './hooks/useAiGenerator';
import { Loading } from 'src/components/ui/loading';
import {
  useDocumentStore,
  useDocumentType,
  useIsInterviewing,
  useAvailableAgents,
} from 'src/stores';
import { InterviewPhase } from 'src/components/interview';

// ============================================
// Types
// ============================================

type FlowPhase = 'select' | 'interview' | 'edit';

// ============================================
// Step Wizard Component
// ============================================

interface StepWizardProps {
  currentPhase: FlowPhase;
}

const aiGenerationSteps = [
  { id: 1, label: 'Pilih jenis dokumen.', phase: 'select' as FlowPhase },
  { id: 2, label: 'Jawab pertanyaan AI.', phase: 'interview' as FlowPhase },
  { id: 3, label: 'Review hasil', phase: 'interview' as FlowPhase },
];

const StepWizard: React.FC<StepWizardProps> = ({ currentPhase }) => {
  const getStepStatus = (stepPhase: FlowPhase, stepId: number) => {
    const phaseOrder = { select: 1, interview: 2, edit: 3 };
    const currentOrder = phaseOrder[currentPhase];
    const stepOrder = phaseOrder[stepPhase];

    if (stepOrder < currentOrder) return 'completed';
    if (stepOrder === currentOrder) return 'current';
    return 'upcoming';
  };

  return (
    <div className="relative pt-4 max-w-4xl">
      {/* Connecting Line */}
      <div className="absolute top-[28px] left-[10px] right-[10px] h-[1.5px] bg-[#B58E36]/20 -z-0">
        <div
          className="h-full bg-[#B58E36] transition-all duration-500"
          style={{
            width:
              currentPhase === 'select'
                ? '0%'
                : currentPhase === 'interview'
                  ? '33%'
                  : '100%',
          }}
        />
      </div>

      <div className="flex justify-between w-full relative z-10">
        {aiGenerationSteps.map((step) => {
          const status = getStepStatus(step.phase, step.id);
          return (
            <div key={step.id} className="flex flex-col items-center gap-3 w-1/4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${
                    status === 'current'
                      ? 'bg-[#B58E36] text-white shadow-md shadow-[#B58E36]/10'
                      : status === 'completed'
                        ? 'bg-[#B58E36] text-white'
                        : 'bg-[#FEF5E5] text-[#B58E36]'
                  }`}
              >
                {status === 'completed' ? (
                  <Icon icon="solar:check-circle-bold" width={16} />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-[10px] md:text-[11px] font-semibold text-[#888] text-center px-1">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// Document Type Card Component
// ============================================

interface DocumentTypeCardProps {
  doc: {
    id: string;
    title: string;
    description: string;
    image: string;
    duration: string;
    hasDraft: boolean;
    type?: string;
  };
  onSelect: (type: string) => void;
  isBorderRadius: number;
}

const DocumentTypeCard: React.FC<DocumentTypeCardProps> = ({
  doc,
  onSelect,
  isBorderRadius,
}) => {
  return (
    <div
      className="group relative h-[300px] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={{ borderRadius: `${isBorderRadius}px` }}
      onClick={() => onSelect(doc.type || doc.id)}
    >
      {/* Background Image */}
      <img
        src={doc.image}
        alt={doc.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t 
          ${
            doc.hasDraft
              ? 'from-[#2563EB]/90 via-[#3B82F6]/60 to-transparent'
              : 'from-[#AA8D55]/95 via-[#AA8D55]/60 to-transparent'
          }`}
      />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div className="flex justify-start">
          <Badge
            className={`border-none font-normal text-xs px-3 py-1.5 backdrop-blur-md
              ${
                doc.hasDraft
                  ? 'bg-blue-600/80 text-white'
                  : 'bg-[#AA8D55]/80 text-white'
              }`}
          >
            {doc.hasDraft ? 'Ada draft' : 'Belum ada draft'}
          </Badge>
        </div>

        <div className="space-y-2 text-white">
          <h3 className="text-2xl font-bold leading-tight text-white">{doc.title}</h3>
          <p className="text-sm text-white/90 font-medium">{doc.description}</p>

          <div className="pt-4 flex items-center gap-2 text-xs text-white/80">
            <Icon icon="solar:clock-circle-linear" height={16} />
            <span>Estimasi: {doc.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

const AiGenerator = () => {
  const { isBorderRadius } = useContext(CustomizerContext);
  const { documentTypes, loading } = useAiGenerator();

  // Zustand store
  const documentType = useDocumentType();
  const isInterviewing = useIsInterviewing();
  const agents = useAvailableAgents();

  const {
    setDocumentType,
    fetchInterviewQuestions,
    resetStore,
    resetInterview,
    fetchAgents,
  } = useDocumentStore();

  // Fetch agents on mount
  useEffect(() => {
    if (agents.length === 0) {
      fetchAgents();
    }
  }, [agents.length, fetchAgents]);

  // Determine current phase
  const getCurrentPhase = (): FlowPhase => {
    if (documentType && isInterviewing) return 'interview';
    if (documentType) return 'interview';
    return 'select';
  };

  const currentPhase = getCurrentPhase();

  // Get agent name for display
  const getAgentName = () => {
    const agent = agents.find((a) => a.type === documentType);
    if (agent) return agent.name;

    const doc = documentTypes.find((d) => d.id === documentType || d.type === documentType);
    return doc?.title || 'Dokumen';
  };

  // Handle document type selection
  const handleSelectDocumentType = useCallback(
    async (type: string) => {
      setDocumentType(type);
      await fetchInterviewQuestions(type);
    },
    [setDocumentType, fetchInterviewQuestions]
  );

  // Handle back to selection
  const handleBackToSelection = useCallback(() => {
    resetInterview();
    setDocumentType(null);
  }, [resetInterview, setDocumentType]);

  // Handle generation complete
  const handleGenerationComplete = useCallback(() => {
    // Document is generated, phase will automatically change to 'edit'
  }, []);

  if (loading) {
    return <Loading fullPage />;
  }

  return (
    <div className="space-y-12 pb-20 relative min-h-screen">
      {/* Hero Section - Always visible */}
      <div className="flex flex-col md:flex-row items-center gap-10 py-6">
        {/* 3D Illustration */}
        <div className="shrink-0 w-40 md:w-48">
          <img
            src={aiHeroImg}
            alt="AI Generator Illustration"
            className="w-full h-auto object-contain"
          />
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-[#001534] tracking-tight leading-none">
              AI Document <br /> Generator.
            </h1>
            <p className="text-[#C1C1C1] text-base font-medium">
              {currentPhase === 'select' && 'Pilih jenis dokumen yang ingin kamu susun bersama AI.'}
              {currentPhase === 'interview' && `Jawab pertanyaan untuk membuat ${getAgentName()}.`}
            </p>
          </div>

          {/* Steps Wizard */}
          <StepWizard currentPhase={currentPhase} />
        </div>
      </div>

      {/* Phase Content */}
      {currentPhase === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {documentTypes.length === 0 ? (
            <div className="col-span-4 text-center text-gray-400 py-10">
              Belum ada agen AI yang tersedia saat ini.
            </div>
          ) : (
            documentTypes.map((doc) => (
              <DocumentTypeCard
                key={doc.id}
                doc={doc}
                onSelect={handleSelectDocumentType}
                isBorderRadius={isBorderRadius}
              />
            ))
          )}
        </div>
      )}

      {currentPhase === 'interview' && (
        <div className="max-w-4xl mx-auto">
          <InterviewPhase
            agentName={getAgentName()}
            onGenerate={handleGenerationComplete}
            onBack={handleBackToSelection}
          />
        </div>
      )}
    </div>
  );
};

export default AiGenerator;
