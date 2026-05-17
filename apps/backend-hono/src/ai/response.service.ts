import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { SkkniService } from "../skkni/skkni.service";
import { ModelService } from "./model.service";
import { interviewerPrompt } from "./prompts/interviewer.prompt";

export type ResponseInput = {
  message: string;
  phase: string;
  readiness: unknown;
  nextField: string | null;
  capturedFields?: Array<{ phaseKey: string; fieldKey: string; value: unknown }>;
  missingFields?: string[];
  flow?: "master" | "trainer";
  masterJson?: unknown;
};

export interface ResponseServiceLike {
  stream(input: ResponseInput): Promise<Response>;
}

const fieldLabels: Record<string, string> = {
  trainer_name: "Nama trainer",
  institution: "Institusi/lembaga",
  expertise: "Bidang keahlian",
  audience: "Target peserta",
  outcome: "Hasil yang diinginkan",
  organization_name: "Nama lembaga",
  organization_focus: "Fokus/bidang pelatihan",
  target_participants: "Target peserta",
  industry_problem: "Masalah industri",
  program_goal: "Tujuan program",
  training_location: "Lokasi pelatihan",
  training_duration: "Durasi pelatihan",
  activities: "Aktivitas belajar",
  training_objective: "Tujuan pelatihan",
  training_date: "Tanggal pelatihan",
  program_name: "Nama program",
  organization_city: "Kota lembaga",
  delivery_method: "Metode pelaksanaan",
  evaluation_methods: "Metode evaluasi",
  duration_jp: "Durasi (JP)",
};

function buildResponsePrompt(input: ResponseInput): string {
  const lines: string[] = [];

  lines.push(`Flow: ${input.flow ?? "unknown"}`);
  lines.push(`Phase: ${input.phase}`);
  lines.push(`User message: "${input.message}"`);
  lines.push("");

  if (input.capturedFields && input.capturedFields.length > 0) {
    lines.push("Informasi yang sudah dikumpulkan:");
    for (const field of input.capturedFields) {
      const label = fieldLabels[field.fieldKey] ?? field.fieldKey;
      const value = typeof field.value === "object" ? JSON.stringify(field.value) : String(field.value ?? "");
      lines.push(`- ${label}: ${value}`);
    }
    lines.push("");
  }

  const readiness = input.readiness as { missing?: string[]; ready?: boolean } | undefined;
  const missing = input.missingFields ?? readiness?.missing ?? [];
  if (missing.length > 0) {
    lines.push("Informasi yang masih dibutuhkan:");
    for (const key of missing) {
      const fieldKey = key.includes(".") ? (key.split(".")[1] ?? key) : key;
      const label = fieldLabels[fieldKey] ?? key;
      lines.push(`- ${label}`);
    }
    lines.push("");
  }

  if (readiness?.ready) {
    lines.push("Semua informasi inti sudah lengkap. Tawarkan untuk mencari unit SKKNI yang relevan.");
    lines.push("");
  }

  lines.push("Berdasarkan konteks di atas, berikan respons dalam bahasa Indonesia yang natural, singkat, dan profesional.");

  return lines.join("\n");
}

export class ResponseService implements ResponseServiceLike {
  constructor(
    private readonly modelService: Pick<ModelService, "getLanguageModel"> = new ModelService(),
    private readonly skkni: Pick<SkkniService, "searchMaster"> = new SkkniService(),
  ) {}

  async stream(input: ResponseInput): Promise<Response> {
    const shouldSearchSkkni = input.phase === "unit_selection" && isSearchConfirmation(input.message);
    const result = streamText({
      model: this.modelService.getLanguageModel(),
      system: interviewerPrompt,
      prompt: shouldSearchSkkni
        ? `${buildResponsePrompt(input)}\n\nUser sudah mengonfirmasi pencarian unit SKKNI. Panggil tool search_skkni_units, lalu tampilkan hasil sebagai daftar bernomor berisi kode unit, judul, dan skor singkat. Jika tidak ada hasil, minta kata kunci yang lebih spesifik.`
        : buildResponsePrompt(input),
      ...(shouldSearchSkkni
        ? {
            tools: {
              search_skkni_units: tool({
                description: "Mencari kandidat unit SKKNI yang relevan berdasarkan konteks program pelatihan yang sudah dikumpulkan.",
                inputSchema: z.object({}),
                execute: async () => ({
                  candidates: await this.skkni.searchMaster(input.masterJson),
                }),
              }),
            },
            toolChoice: { type: "tool" as const, toolName: "search_skkni_units" },
            stopWhen: stepCountIs(2),
          }
        : {}),
    });

    return result.toTextStreamResponse();
  }
}

function isSearchConfirmation(message: string): boolean {
  return /^(?:ya+a*|iya+h*|yes+|y+|ok+e*|oke+y*|setuju|lanjut|lanjutkan|siap|gas|boleh)(?:\s+(?:ya+a*|iya+h*|ok+e*|oke+y*|lanjut|lanjutkan|dong|aja|saja|nih))?$/i.test(
    message.trim(),
  );
}
