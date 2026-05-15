import { Icon } from '@iconify/react';
import type { DocumentProgress } from '../contracts';

type Props = {
  generationReady: boolean;
  progress: DocumentProgress[];
  onGenerateAll(): void;
};

const statusClass: Record<DocumentProgress['status'], string> = {
  locked: 'bg-slate-100 text-slate-500',
  ready: 'bg-blue-100 text-blue-700',
  generating: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  needs_review: 'bg-orange-100 text-orange-700',
};

export function DocumentDraftPanel({ generationReady, progress, onGenerateAll }: Props) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Document draft</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">Generate Outputs</h2>
          <p className="mt-1 text-sm text-slate-500">Generate boleh dari minimum fields + review flags.</p>
        </div>
        <button type="button" disabled={!generationReady} onClick={onGenerateAll} className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-700/20 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40">
          <Icon icon="solar:document-add-bold" height={16} />
          Generate
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {progress.map((item) => (
          <div key={item.documentType} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">Missing: {item.missingFields.length === 0 ? 'Tidak ada' : item.missingFields.join(', ')}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass[item.status]}`}>{item.status}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${item.completionPercent}%` }} />
            </div>
            {item.downloadUrl ? <a href={item.downloadUrl} className="mt-3 inline-flex text-sm font-bold text-amber-700">Download mock output</a> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
