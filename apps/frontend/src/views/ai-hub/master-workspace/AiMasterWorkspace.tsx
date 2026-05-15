import { useEffect } from 'react';
import { BackendContractPanel } from './components/BackendContractPanel';
import { DocumentDraftPanel } from './components/DocumentDraftPanel';
import { IntakeChatPanel } from './components/IntakeChatPanel';
import { SkkniCandidatePanel } from './components/SkkniCandidatePanel';
import { SlotStatePanel } from './components/SlotStatePanel';
import { useAiMasterWorkspaceStore } from './store';

export default function AiMasterWorkspace() {
  const state = useAiMasterWorkspaceStore((store) => store.state);
  const isLoading = useAiMasterWorkspaceStore((store) => store.isLoading);
  const isSending = useAiMasterWorkspaceStore((store) => store.isSending);
  const error = useAiMasterWorkspaceStore((store) => store.error);
  const composerValue = useAiMasterWorkspaceStore((store) => store.composerValue);
  const setComposerValue = useAiMasterWorkspaceStore((store) => store.setComposerValue);
  const load = useAiMasterWorkspaceStore((store) => store.load);
  const sendMessage = useAiMasterWorkspaceStore((store) => store.sendMessage);
  const acceptSlot = useAiMasterWorkspaceStore((store) => store.acceptSlot);
  const searchSkkni = useAiMasterWorkspaceStore((store) => store.searchSkkni);
  const selectSkkniUnit = useAiMasterWorkspaceStore((store) => store.selectSkkniUnit);
  const generateAllDocuments = useAiMasterWorkspaceStore((store) => store.generateAllDocuments);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading || !state) {
    return <div className="flex min-h-[70vh] items-center justify-center text-slate-500">Memuat mock AI Master workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f0e3] px-5 py-6 text-slate-950 lg:px-8">
      <div className="mx-auto max-w-[1680px] space-y-6">
        <header className="overflow-hidden rounded-[2.5rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(120,72,20,0.10)]">
          <div className="grid gap-6 p-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-700">Frontend-only prototype</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 lg:text-6xl">AI for Master Workspace</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">UI ini tidak bergantung backend. Semua flow pakai mock adapter dan kontrak typed supaya backend baru tinggal plug response shape yang sama.</p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current phase</p>
              <p className="mt-1 text-2xl font-black text-amber-300">{state.phase}</p>
            </div>
          </div>
        </header>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

        <main className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
          <IntakeChatPanel messages={state.messages} composerValue={composerValue} isSending={isSending} onComposerChange={setComposerValue} onSubmit={() => void sendMessage()} />
          <div className="space-y-6">
            <SlotStatePanel slots={state.slots} minimumComplete={state.minimumComplete} onAcceptSlot={(field) => void acceptSlot(field)} />
            <SkkniCandidatePanel minimumComplete={state.minimumComplete} candidates={state.skkniCandidates} selectedUnitId={state.selectedSkkniUnitId} onSearch={() => void searchSkkni()} onSelect={(unitId) => void selectSkkniUnit(unitId)} />
            <DocumentDraftPanel generationReady={state.generationReady} progress={state.documentProgress} onGenerateAll={() => void generateAllDocuments()} />
            <BackendContractPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
