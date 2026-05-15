/**
 * Plan Tool UI Component
 * Displays implementation plans with progress tracking
 */

"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
  Plan,
  PlanErrorBoundary,
  parseSerializablePlan,
} from "@/components/tool-ui/plan/index";

export const ShowPlanUI = makeAssistantToolUI({
  toolName: "show_plan",
  render: ({ result }) => {
    // Tool outputs stream in; `result` will be `undefined` until the tool resolves.
    if (result === undefined) {
      return (
        <div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Sedang menyiapkan rencana...</span>
          </div>
        </div>
      );
    }

    const plan = parseSerializablePlan(result);
    return (
      <PlanErrorBoundary>
        <Plan
          {...plan}
          responseActions={[
            { id: "approve", label: "Terima Rencana" },
            { id: "revise", label: "Minta Perubahan", variant: "secondary" },
          ]}
          onResponseAction={(id) => {
            if (id === "approve") {
              console.log("Plan approved");
              // Kirim konfirmasi ke AI
              if ((window as any).__sendChatMessage) {
                (window as any).__sendChatMessage("Rencana telah disetujui, lanjutkan!");
              }
            } else if (id === "revise") {
              // Biarkan user ketik sendiri perubahan yang diminta
              console.log("User wants to revise plan");
            }
          }}
        />
      </PlanErrorBoundary>
    );
  },
});
