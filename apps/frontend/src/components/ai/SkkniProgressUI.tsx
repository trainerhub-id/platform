"use client";

import React, { useState, useEffect } from "react";
import { ProgressTracker } from "@/components/tool-ui/progress-tracker";
import type { ProgressStep } from "@/components/tool-ui/progress-tracker";

interface SkkniProgressUIProps {
  unitCode: string;
  onComplete?: () => void;
}

const SKKNI_FETCH_STEPS: ProgressStep[] = [
  {
    id: "confirm",
    label: "Konfirmasi Pilihan",
    description: "Memverifikasi kode unit kompetensi",
    status: "pending",
  },
  {
    id: "fetch",
    label: "Mengambil Data dari WSP",
    description: "Mengunduh elemen dan KUK dari database SKKNI",
    status: "pending",
  },
  {
    id: "transform",
    label: "Transformasi KUK",
    description: "Mengubah KUK ke kalimat aktif dengan AI",
    status: "pending",
  },
  {
    id: "save",
    label: "Menyimpan ke Dokumen",
    description: "Menyimpan unit kompetensi ke dokumen pelatihan",
    status: "pending",
  },
];

export const SkkniProgressUI: React.FC<SkkniProgressUIProps> = ({ 
  unitCode,
  onComplete 
}) => {
  const [steps, setSteps] = useState<ProgressStep[]>(SKKNI_FETCH_STEPS);
  const [startTime] = useState(() => Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    const isComplete = steps.every(s => s.status === "completed" || s.status === "failed");
    if (isComplete) return;

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, [startTime, steps]);

  // Listen for progress events from backend
  useEffect(() => {
    const handleProgress = (event: CustomEvent<{ step: string; status: ProgressStep["status"]; description?: string }>) => {
      const { step, status, description } = event.detail;
      
      setSteps(prev => prev.map(s => {
        if (s.id === step) {
          return { ...s, status, description: description || s.description };
        }
        return s;
      }));

      // Check if all complete
      if (step === "save" && status === "completed") {
        onComplete?.();
      }
    };

    window.addEventListener("skkni-progress", handleProgress as EventListener);
    return () => window.removeEventListener("skkni-progress", handleProgress as EventListener);
  }, [onComplete]);

  const isComplete = steps.every(s => s.status === "completed");
  const hasFailed = steps.some(s => s.status === "failed");
  const [finishedAt, setFinishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (isComplete || hasFailed) {
      setFinishedAt((current) => current ?? new Date().toISOString());
      return;
    }

    setFinishedAt(null);
  }, [hasFailed, isComplete]);

  return (
    <ProgressTracker
      id={`skkni-progress-${unitCode}`}
      steps={steps}
      elapsedTime={elapsedTime}
      choice={(isComplete || hasFailed) && finishedAt ? {
        outcome: hasFailed ? "failed" : "success",
        summary: hasFailed ? "Gagal mengambil data" : "Unit berhasil disimpan",
        at: finishedAt,
      } : undefined}
    />
  );
};

// Simpler inline progress component for streaming
export const SkkniInlineProgress: React.FC<{
  currentStep: "confirm" | "fetch" | "transform" | "save" | "complete" | "error";
  unitCode: string;
  error?: string;
}> = ({ currentStep, unitCode, error }) => {
  const [finishedAt, setFinishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep === "complete" || currentStep === "error") {
      setFinishedAt((current) => current ?? new Date().toISOString());
      return;
    }

    setFinishedAt(null);
  }, [currentStep]);

  const getSteps = (): ProgressStep[] => {
    const stepOrder = ["confirm", "fetch", "transform", "save"];
    const currentIndex = stepOrder.indexOf(currentStep);

    return [
      {
        id: "confirm",
        label: "Konfirmasi",
        status: currentIndex > 0 ? "completed" : currentIndex === 0 ? "in-progress" : "pending",
      },
      {
        id: "fetch",
        label: "Ambil Data WSP",
        description: currentStep === "fetch" ? `Mengunduh ${unitCode}...` : undefined,
        status: currentIndex > 1 ? "completed" : currentIndex === 1 ? "in-progress" : "pending",
      },
      {
        id: "transform",
        label: "Transform KUK",
        description: currentStep === "transform" ? "Mengubah ke kalimat aktif..." : undefined,
        status: currentIndex > 2 ? "completed" : currentIndex === 2 ? "in-progress" : "pending",
      },
      {
        id: "save",
        label: "Simpan",
        status: currentStep === "complete" ? "completed" : 
               currentStep === "error" ? "failed" :
               currentIndex === 3 ? "in-progress" : "pending",
        description: error,
      },
    ];
  };

  return (
    <ProgressTracker
      id={`skkni-inline-${unitCode}`}
      steps={getSteps()}
      choice={currentStep === "complete" && finishedAt ? {
        outcome: "success",
        summary: "Unit tersimpan",
        at: finishedAt,
      } : currentStep === "error" && finishedAt ? {
        outcome: "failed",
        summary: error || "Terjadi kesalahan",
        at: finishedAt,
      } : undefined}
    />
  );
};

export const SkkniSearchInlineProgress: React.FC<{
  keyword: string;
  stage?: "analyze" | "retrieve" | "rank" | "complete" | "error";
  error?: string;
}> = ({ keyword, stage = "retrieve", error }) => {
  const [finishedAt, setFinishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (stage === "complete" || stage === "error") {
      setFinishedAt((current) => current ?? new Date().toISOString());
      return;
    }

    setFinishedAt(null);
  }, [stage]);

  const steps: ProgressStep[] = [
    {
      id: "analyze",
      label: "Analisis Kebutuhan",
      description: `Memahami konteks "${keyword}"`,
      status:
        stage === "analyze"
          ? "in-progress"
          : ["retrieve", "rank", "complete"].includes(stage)
            ? "completed"
            : stage === "error"
              ? "failed"
              : "pending",
    },
    {
      id: "retrieve",
      label: "Cari Kandidat",
      description: "Mengambil kandidat unit kompetensi",
      status:
        stage === "retrieve"
          ? "in-progress"
          : ["rank", "complete"].includes(stage)
            ? "completed"
            : stage === "error"
              ? "failed"
              : "pending",
    },
    {
      id: "rank",
      label: "Susun Ranking",
      description: stage === "rank" ? "Menilai kecocokan hasil..." : "Merapikan hasil terbaik",
      status:
        stage === "rank"
          ? "in-progress"
          : stage === "complete"
            ? "completed"
            : stage === "error"
              ? "failed"
              : "pending",
    },
  ];

  return (
    <ProgressTracker
      id={`skkni-search-${keyword}`}
      steps={steps}
      choice={stage === "complete" && finishedAt ? {
        outcome: "success",
        summary: "Referensi siap dipilih",
        at: finishedAt,
      } : stage === "error" && finishedAt ? {
        outcome: "failed",
        summary: error || "Pencarian referensi gagal",
        at: finishedAt,
      } : undefined}
    />
  );
};

export default SkkniProgressUI;
