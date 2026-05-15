"use client";

import React, { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { DataTable } from "@/components/tool-ui/data-table/index";
import { Button } from "@/components/ui/button";


interface SkkniUnit {
    id: string;
    code: string;
    title: string;
}

interface SkkniDocument {
    id: string;
    title: string;
    number: string;
    unitCount: number;
    units: SkkniUnit[];
}

interface SkkniSearchResult {
    documents: SkkniDocument[];
    summary: {
        totalDocuments: number;
        totalUnits: number;
    };
}

// React component for SKKNI search results (can use hooks)
const SkkniSearchContent: React.FC<{ result?: any; args?: any; toolName?: string }> = (props) => {
    const { result, args, toolName } = props;
    
    const searchResult = result as SkkniSearchResult | undefined;
    const [view, setView] = useState<'docs' | 'units'>('docs');
    const [selectedDoc, setSelectedDoc] = useState<SkkniDocument | null>(null);

    if (!searchResult || !searchResult.documents) {
        return (
            <div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
                Sedang menyiapkan daftar referensi...
            </div>
        );
    }

    const { documents } = searchResult;

    // View: List of Units for a selected Document
    if (view === 'units' && selectedDoc) {
        return (
            <div className="bg-card w-full max-w-3xl rounded-xl border p-4 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" onClick={() => setView('docs')}>
                        ← Kembali
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{selectedDoc.title}</h4>
                        <p className="text-xs text-muted-foreground">{selectedDoc.number}</p>
                    </div>
                </div>

                <DataTable
                    rowIdKey="id"
                    data={selectedDoc.units}
                    columns={[
                        { key: 'code', label: 'Kode', truncate: true },
                        { key: 'title', label: 'Nama Materi' },
                    ]}
                    onRowClick={(unit) => {
                        if ((window as any).__sendChatMessage) {
                            (window as any).__sendChatMessage(`Saya pilih materi dengan kode ${unit.code}: ${unit.title}`);
                        } else {
                            console.log("Selected unit:", unit);
                        }
                    }}
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                    Klik baris untuk memilih materi
                </p>
            </div>
        );
    }

    // View: List of Documents
    return (
        <div className="bg-card w-full max-w-3xl rounded-xl border p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">Hasil pencarian referensi</h3>
                <span className="text-xs text-muted-foreground">{searchResult.summary.totalDocuments} dokumen ditemukan</span>
            </div>

            <DataTable
                rowIdKey="id"
                data={documents}
                columns={[
                    { key: 'title', label: 'Judul', priority: 'primary' },
                    { key: 'number', label: 'Nomor', priority: 'secondary' },
                    { key: 'unitCount', label: 'Jumlah Materi', align: 'center', format: { kind: 'number' } },
                ]}
                onRowClick={(doc) => {
                    setSelectedDoc(doc);
                    setView('units');
                }}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
                Pilih dokumen untuk melihat daftar materi
            </p>
        </div>
    );
};

// Register multiple tool UIs for different possible tool names
// Mastra may use "skkni_search", "_2", "_3", "_4", "_5", etc. depending on tool registration order
export const SkkniSearchUI = makeAssistantToolUI({
    toolName: "skkni_search",
    render: (props) => <SkkniSearchContent {...props} />,
});

export const SkkniSearchUI_2 = makeAssistantToolUI({
    toolName: "_2",
    render: (props) => <SkkniSearchContent {...props} />,
});

export const SkkniSearchUI_3 = makeAssistantToolUI({
    toolName: "_3",
    render: (props) => <SkkniSearchContent {...props} />,
});

export const SkkniSearchUI_4 = makeAssistantToolUI({
    toolName: "_4",
    render: (props) => <SkkniSearchContent {...props} />,
});

export const SkkniSearchUI_5 = makeAssistantToolUI({
    toolName: "_5",
    render: (props) => <SkkniSearchContent {...props} />,
});
