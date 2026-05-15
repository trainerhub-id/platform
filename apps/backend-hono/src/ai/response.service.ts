import { streamText } from "ai";
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
      const fieldKey = key.includes(".") ? key.split(".")[1] : key;
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
  constructor(private readonly modelService = new ModelService()) {}

  async stream(input: ResponseInput): Promise<Response> {
    const result = streamText({
      model: this.modelService.getLanguageModel(),
      system: interviewerPrompt,
      prompt: buildResponsePrompt(input),
    });

    return result.toTextStreamResponse();
  }
}
