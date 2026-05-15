import { Icon } from '@iconify/react';
import type { ChatMessage } from '../contracts';

export type IntakeChatPanelProps = {
  messages: ChatMessage[];
  composerValue: string;
  isSending: boolean;
  onComposerChange(value: string): void;
  onSubmit(): void;
};

export function IntakeChatPanel({ messages, composerValue, isSending, onComposerChange, onSubmit }: IntakeChatPanelProps) {
  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[#fffaf0] shadow-[0_24px_80px_rgba(120,72,20,0.12)]">
      <header className="border-b border-amber-200/70 bg-white/70 px-6 py-5 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-700/20">
            <Icon icon="solar:diploma-verified-bold-duotone" height={25} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Conversational intake</p>
            <h2 className="text-xl font-bold text-slate-950">AI Master</h2>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={isUser ? 'max-w-[78%] rounded-3xl rounded-br-md bg-slate-950 px-5 py-3 text-sm leading-6 text-white shadow-lg shadow-slate-950/10' : 'max-w-[78%] rounded-3xl rounded-bl-md border border-amber-100 bg-white px-5 py-3 text-sm leading-6 text-slate-800 shadow-sm'}>
                {message.content}
                {message.metadata?.savedFields?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {message.metadata.savedFields.map((field) => (
                      <span key={field} className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        saved: {field}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="border-t border-amber-200/70 bg-white/80 p-4 backdrop-blur">
        <div className="rounded-3xl border border-amber-200 bg-[#fffaf0] p-2">
          <textarea
            value={composerValue}
            onChange={(event) => onComposerChange(event.target.value)}
            placeholder="Ceritakan bebas: lembaga, bidang, program, target peserta, masalah industri..."
            className="min-h-28 w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            disabled={isSending}
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <p className="text-xs text-slate-500">Mock UI. Backend nanti hanya perlu ikuti kontrak state.</p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSending || !composerValue.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-700/20 transition hover:-translate-y-0.5 hover:bg-amber-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? 'Mengirim...' : 'Kirim'}
              <Icon icon="solar:plain-bold" height={16} />
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}
