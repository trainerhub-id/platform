import { Icon } from '@iconify/react';
import type { SkkniCandidate } from '../contracts';

type Props = {
  minimumComplete: boolean;
  candidates: SkkniCandidate[];
  selectedUnitId: string | null;
  onSearch(): void;
  onSelect(unitId: string): void;
};

export function SkkniCandidatePanel({ minimumComplete, candidates, selectedUnitId, onSearch, onSelect }: Props) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Search bridge</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">SKKNI Match</h2>
          <p className="mt-1 text-sm text-slate-500">Backend nanti return candidates + evidence.</p>
        </div>
        <button type="button" disabled={!minimumComplete} onClick={onSearch} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40">
          <Icon icon="solar:magnifer-bold" height={16} />
          Cari
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-500">
            Lengkapi 5 field inti dulu. Panel ini sengaja kosong sampai backend/search siap.
          </div>
        ) : candidates.map((candidate) => {
          const selected = candidate.id === selectedUnitId;
          return (
            <button key={candidate.id} type="button" onClick={() => onSelect(candidate.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{candidate.unitCode}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{candidate.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{candidate.reason}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{Math.round(candidate.relevanceScore * 100)}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
