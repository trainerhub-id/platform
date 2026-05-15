import { Icon } from "@iconify/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "src/lib/better-auth";
import { Button } from "src/components/ui/button";
import { Progress } from "src/components/ui/progress";
import api from "src/api/axios";

// SSE event types matching backend GenerateAllProgressEvent
interface ProgressEvent {
  type:
    | "wave_start"
    | "section_start"
    | "section_complete"
    | "section_error"
    | "wave_complete"
    | "all_complete";
  wave?: number;
  totalWaves?: number;
  section?: string;
  sectionsInWave?: string[];
  error?: string;
  progress?: { completed: number; total: number; percent: number };
}

interface GenerateAllResult {
  success: boolean;
  completedSections: string[];
  failedSections: { section: string; error: string }[];
  totalTime: number;
  totalSuccess?: number;
  totalFailed?: number;
  totalRequested?: number;
}

type SectionStatus = "pending" | "generating" | "done" | "error";

interface SectionState {
  name: string;
  status: SectionStatus;
  error?: string;
}

interface GenerateAllProgressProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  mode?: "trainer" | "master";
}

const TRAINER_GENERATE_ALL_DOCUMENT_TYPES = [
  'training_needs_analysis',
  'training_program',
  'competency_map',
  'lesson_plan',
  'material_list',
  'equipment_list',
  'job_safety_analysis',
  'pretest',
  'posttest',
  'training_evaluation',
  'fr_ia_01_observation',
  'fr_ia_02_demonstration',
  'fr_ia_03_oral',
  'pretest_scoring',
] as const;

const SECTION_LABELS: Record<string, string> = {
  organizer: "Penyelenggara",
  document: "Dokumen",
  people: "SDM",
  requirements: "Persyaratan",
  competency_map: "Peta Kompetensi",
  curriculum: "Kurikulum",
  training: "Detail Pelatihan",
  time_allocation: "Alokasi Waktu",
  resources: "Sumber Daya",
  lesson_plan: "Rencana Pembelajaran",
  pretest: "Pre-Test",
  posttest: "Post-Test",
  evaluations: "Evaluasi",
  test: "Halaman Uji",
  evaluation_level1: "Evaluasi Level 1",
  evaluation_level2: "Evaluasi Level 2",
  training_needs: "Kebutuhan Pelatihan",
  safety: "K3 & Keselamatan",
  assessment: "Asesmen",
  certification: "Sertifikasi",
  signatures: "Tanda Tangan",
};

export const GenerateAllProgress: React.FC<GenerateAllProgressProps> = ({
  documentId,
  isOpen,
  onClose,
  onComplete,
  mode = "trainer",
}) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [sections, setSections] = useState<SectionState[]>([]);
  const [currentWave, setCurrentWave] = useState(0);
  const [totalWaves, setTotalWaves] = useState(4);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [result, setResult] = useState<GenerateAllResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMasterMode = mode === "master";

  const startGeneration = useCallback(async () => {
    setStatus("running");
    setResult(null);
    setErrorMessage(null);
    setSections([]);
    setGlobalProgress(0);
    setCurrentWave(0);

    const controller = new AbortController();
    abortRef.current = controller;
    let sectionGenerationErrored = false;

    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error("Sesi belum siap. Silakan refresh halaman dan coba lagi.");
      }

      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error("Sesi login tidak valid atau telah berakhir. Silakan login ulang.");
      }

      if (!isMasterMode) {
        const baseURL = api.defaults.baseURL || "";
        const url = `${baseURL}/ai/document/${documentId}/generate-all-sections`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const parsed = JSON.parse(raw);

              const event: ProgressEvent | null =
                parsed.type === "tool-result" && parsed.payload?.result?.type
                  ? parsed.payload.result
                  : parsed.type && parsed.type !== "result" && parsed.type !== "finish" && parsed.type !== "error"
                    ? parsed
                    : null;

              if (event) {
                handleProgressEvent(event);
              }

              if (parsed.type === "result" && parsed.payload) {
                setResult(parsed.payload as GenerateAllResult);
                setStatus("done");
              }

              if (parsed.type === "error") {
                setErrorMessage(parsed.payload?.message || "Unknown error");
                setStatus("error");
                sectionGenerationErrored = true;
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      if (!sectionGenerationErrored) {
        const batchResponse = await api.post(`/ai/ai-document/${documentId}/generate-batch`, {
          documentTypes: isMasterMode
            ? ['bukti-1', 'bukti-2', 'bukti-3', 'bukti-4', 'bukti-5', 'bukti-6', 'bukti-7', 'bukti-8']
            : [...TRAINER_GENERATE_ALL_DOCUMENT_TYPES],
        });
        const batchData = batchResponse.data;
        const totalFailed = Number(batchData?.totalFailed || 0);
        const totalSuccess = Number(batchData?.totalSuccess || 0);

        setGlobalProgress(100);
        if (isMasterMode) {
          setSections([
            { name: 'bukti-1', status: 'done' },
            { name: 'bukti-2', status: 'done' },
            { name: 'bukti-3', status: 'done' },
            { name: 'bukti-4', status: 'done' },
            { name: 'bukti-5', status: 'done' },
            { name: 'bukti-6', status: 'done' },
            { name: 'bukti-7', status: 'done' },
            { name: 'bukti-8', status: 'done' },
          ].map((item, index) => ({
            ...item,
            status: index < totalSuccess ? "done" : totalFailed > 0 ? "error" : "done",
          })));
        }

        setResult({
          success: totalFailed === 0,
          completedSections: [],
          failedSections: totalFailed > 0 ? [{ section: 'document-batch', error: `${totalFailed} dokumen gagal dibuat` }] : [],
          totalTime: 0,
          totalSuccess,
          totalFailed,
          totalRequested: Number(batchData?.totalRequested || 0),
        });
        setStatus(totalFailed > 0 ? "error" : "done");
        if (totalFailed > 0) {
          setErrorMessage(`${totalSuccess} dokumen berhasil dibuat, ${totalFailed} gagal.`);
        }
      } else {
        setStatus((prev) => (prev === "running" ? "done" : prev));
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setErrorMessage(err.message || "Connection failed");
      setStatus("error");
    }
  }, [documentId, getToken, isLoaded, isSignedIn, isMasterMode]);

  const handleProgressEvent = (event: ProgressEvent) => {
    switch (event.type) {
      case "wave_start":
        setCurrentWave(event.wave || 0);
        setTotalWaves(event.totalWaves || 4);
        if (event.sectionsInWave) {
          setSections((prev) => {
            const existing = new Set(prev.map((s) => s.name));
            const newSections = event.sectionsInWave!
              .filter((name) => !existing.has(name))
              .map((name) => ({ name, status: "pending" as SectionStatus }));
            return [...prev, ...newSections];
          });
        }
        break;

      case "section_start":
        setSections((prev) =>
          prev.map((s) =>
            s.name === event.section ? { ...s, status: "generating" } : s
          )
        );
        break;

      case "section_complete":
        setSections((prev) =>
          prev.map((s) =>
            s.name === event.section ? { ...s, status: "done" } : s
          )
        );
        if (event.progress) setGlobalProgress(event.progress.percent);
        break;

      case "section_error":
        setSections((prev) =>
          prev.map((s) =>
            s.name === event.section
              ? { ...s, status: "error", error: event.error }
              : s
          )
        );
        if (event.progress) setGlobalProgress(event.progress.percent);
        break;

      case "wave_complete":
        if (event.progress) setGlobalProgress(event.progress.percent);
        break;

      case "all_complete":
        setGlobalProgress(100);
        break;
    }
  };

  // Auto-start when opened — wait for auth session to be loaded first
  useEffect(() => {
    if (isOpen && status === "idle" && isLoaded && isSignedIn) {
      startGeneration();
    }
  }, [isOpen, status, startGeneration, isLoaded, isSignedIn]);

  // Reset on close
  const handleClose = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStatus("idle");
    setSections([]);
    setGlobalProgress(0);
    setResult(null);
    setErrorMessage(null);
    onClose();
    if (status === "done") {
      onComplete?.();
    }
  };

  if (!isOpen) return null;

  const doneCount = sections.filter((s) => s.status === "done").length;
  const errorCount = sections.filter((s) => s.status === "error").length;
  const generatedDocSuccess = Number(result?.totalSuccess || 0);
  const generatedDocFailed = Number(result?.totalFailed || 0);
  const displaySections = isMasterMode
    ? sections.map((section) => ({
        ...section,
        name: {
          'bukti-1': 'Bukti 1',
          'bukti-2': 'Bukti 2',
          'bukti-3': 'Bukti 3',
          'bukti-4': 'Bukti 4',
          'bukti-5': 'Bukti 5',
          'bukti-6': 'Bukti 6',
          'bukti-7': 'Bukti 7',
          'bukti-8': 'Bukti 8',
        }[section.name] || section.name,
      }))
    : sections;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon
                  icon={
                    status === "done"
                      ? "solar:check-circle-bold"
                      : status === "error"
                        ? "solar:danger-triangle-bold"
                        : "solar:magic-stick-3-bold"
                  }
                  height={22}
                  className={
                    status === "done"
                      ? "text-green-600"
                      : status === "error"
                        ? "text-red-500"
                        : "text-primary"
                  }
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-dark">
                  {status === "done"
                    ? "Generate Selesai"
                    : status === "error"
                      ? "Generate Gagal"
                      : "Generate Semua Dokumen"}
                </h3>
                <p className="text-xs text-bodytext">
                  {status === "running"
                    ? isMasterMode
                      ? "Menyiapkan semua dokumen master"
                      : `Wave ${currentWave}/${totalWaves}`
                    : status === "done"
                      ? `${generatedDocSuccess || doneCount} berhasil${generatedDocFailed > 0 ? `, ${generatedDocFailed} gagal` : ""}`
                      : status === "error"
                        ? errorMessage || `${generatedDocSuccess} dokumen berhasil dibuat, ${generatedDocFailed} gagal.`
                        : "Mempersiapkan..."}
                </p>
              </div>
            </div>
            {(status === "done" || status === "error") && (
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Icon icon="solar:close-circle-linear" height={20} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Global progress */}
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Progress
              value={globalProgress}
              variant={status === "error" ? "default" : globalProgress === 100 ? "success" : "warning"}
              className="h-2 flex-1"
            />
            <span className="text-xs font-medium text-bodytext w-10 text-right">
              {globalProgress}%
            </span>
          </div>
        </div>

        {/* Section list */}
        <div className="px-6 py-3 max-h-72 overflow-y-auto space-y-1.5">
          {displaySections.length === 0 && status === "running" && (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Icon icon="svg-spinners:ring-resize" height={20} className="mr-2" />
              <span className="text-sm">
                {isMasterMode ? "Mempersiapkan dokumen..." : "Mempersiapkan seksi..."}
              </span>
            </div>
          )}
          {displaySections.map((section) => (
            <div
              key={section.name}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {section.status === "generating" && (
                  <Icon icon="svg-spinners:ring-resize" height={14} className="text-primary flex-shrink-0" />
                )}
                {section.status === "done" && (
                  <Icon icon="solar:check-circle-bold" height={14} className="text-green-500 flex-shrink-0" />
                )}
                {section.status === "error" && (
                  <Icon icon="solar:close-circle-bold" height={14} className="text-red-500 flex-shrink-0" />
                )}
                {section.status === "pending" && (
                  <Icon icon="solar:clock-circle-linear" height={14} className="text-gray-300 flex-shrink-0" />
                )}
                <span
                  className={`text-xs truncate ${
                    section.status === "done"
                      ? "text-green-700"
                      : section.status === "error"
                        ? "text-red-600"
                        : section.status === "generating"
                          ? "text-dark font-medium"
                          : "text-bodytext"
                  }`}
                >
                  {section.name}
                </span>
              </div>
              {section.error && (
                <span className="text-[10px] text-red-400 truncate max-w-[120px] ml-2">
                  {section.error}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          {status === "running" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              Batalkan
            </Button>
          )}
          {(status === "done" || status === "error") && (
            <Button
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              {status === "done" ? "Selesai" : "Tutup"}
            </Button>
          )}
        </div>

        {/* Result summary */}
        {result && (
          <div className="px-6 pb-4 -mt-2">
            <div className="text-[10px] text-bodytext text-center">
              Waktu: {Math.round(result.totalTime / 1000)}s
              {result.failedSections.length > 0 && (
                <> | Gagal: {result.failedSections.map((f) => SECTION_LABELS[f.section] || f.section).join(", ")}</>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
