import { Icon } from '@iconify/react';
import { AI_MASTER_CORE_FIELDS, AI_MASTER_OPTIONAL_FIELDS, type AiMasterFieldKey, type SlotState } from '../contracts';

type SlotStatePanelProps = {
  slots: Partial<Record<AiMasterFieldKey, SlotState>>;
  minimumComplete: boolean;
  onAcceptSlot(field: AiMasterFieldKey): void;
};

const statusClass: Record<SlotState['status'], string> = {
  empty: 'bg-slate-100 text-slate-500',
  draft: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-slate-200 text-slate-600',
  needs_review: 'bg-rose-100 text-rose-700',
};

function SlotCard({ slot, onAcceptSlot }: { slot: SlotState; onAcceptSlot(field: AiMasterFieldKey): void }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-950">{slot.label}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{slot.value || 'Belum diisi'}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[slot.status]}`}>{slot.status}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{slot.source}</span>
        <span>{Math.round(slot.confidence * 100)}%</span>
      </div>
      {slot.status === 'draft' ? (
        <button type="button" onClick={() => onAcceptSlot(slot.key)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50" aria-label={`Terima ${slot.label}`}>
          <Icon icon="solar:check-circle-bold" height={14} />
          Terima draft
        </button>
      ) : null}
    </div>
  );
}

export function SlotStatePanel({ slots, minimumComplete, onAcceptSlot }: SlotStatePanelProps) {
  const coreSlots = AI_MASTER_CORE_FIELDS.map((field) => slots[field]).filter(Boolean) as SlotState[];
  const optionalSlots = AI_MASTER_OPTIONAL_FIELDS.map((field) => slots[field]).filter(Boolean) as SlotState[];

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Canonical data</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Structured State</h2>
        </div>
        <span className={minimumComplete ? 'rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700' : 'rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600'}>
          {minimumComplete ? 'Minimum lengkap' : 'Butuh 5 inti'}
        </span>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Core fields</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {coreSlots.map((slot) => <SlotCard key={slot.key} slot={slot} onAcceptSlot={onAcceptSlot} />)}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Draft / enrichment</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {optionalSlots.map((slot) => <SlotCard key={slot.key} slot={slot} onAcceptSlot={onAcceptSlot} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
