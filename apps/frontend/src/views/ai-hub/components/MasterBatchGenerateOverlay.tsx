import { Icon } from "@iconify/react";
import { createPortal } from "react-dom";

interface MasterBatchGenerateOverlayProps {
  isOpen: boolean;
}

export const MasterBatchGenerateOverlay = ({
  isOpen,
}: MasterBatchGenerateOverlayProps) => {
  if (!isOpen) return null;

  const content = (
    <div
      data-testid="master-batch-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-slate-950 text-white shadow-[0_30px_120px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.24),_transparent_48%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.18),_transparent_42%)]" />
        <div className="relative px-6 py-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-400/10">
              <div className="absolute inset-0 rounded-2xl border border-sky-200/30 animate-ping" />
              <Icon icon="simple-icons:googlegemini" height={24} className="text-sky-200" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Generate Master
              </div>
              <h3 className="mt-1 text-lg font-semibold leading-tight text-white">
                AI sedang menyusun semua bukti master
              </h3>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-200">
            Mohon tunggu. Bukti 1 sampai Bukti 8 sedang diproses satu per satu.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3 text-sm text-slate-100">
              <Icon icon="svg-spinners:ring-resize" height={18} className="text-amber-300" />
              <span>Menyiapkan payload, render PDF, dan menyimpan hasil generate.</span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-300 animate-bounce [animation-delay:-0.24s]" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-bounce [animation-delay:-0.12s]" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-bounce" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
            <span>Jangan tutup tab ini dulu.</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200">
              Batch aktif
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
};
