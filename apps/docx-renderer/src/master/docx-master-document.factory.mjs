// src/master/docx-master-document.factory.ts
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from "docx";
import { buildMasterPayloadViewModel } from "./build-master-view-model.mjs";
var COLORS = {
  accent: "1F4E79",
  muted: "64748B",
  border: "CBD5E1",
  headerFill: "EAF2F8",
  softFill: "F8FAFC",
  white: "FFFFFF"
};
var CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.border }
};
function paragraph(text, options = {}) {
  return new Paragraph({
    heading: options.heading,
    alignment: options.alignment,
    spacing: { after: options.spacingAfter ?? 120 },
    children: [
      new TextRun({
        text: text || "-",
        bold: options.bold,
        color: options.color,
        size: options.size ?? 22,
        italics: options.italics
      })
    ]
  });
}
function titleParagraph(text) {
  return paragraph(text, {
    bold: true,
    color: COLORS.accent,
    size: 32,
    heading: HeadingLevel.HEADING_1,
    spacingAfter: 180
  });
}
function sectionTitle(text) {
  return paragraph(text, {
    bold: true,
    color: COLORS.accent,
    size: 25,
    heading: HeadingLevel.HEADING_2,
    spacingAfter: 100
  });
}
function muted(text) {
  return paragraph(text, { color: COLORS.muted, size: 19, spacingAfter: 90 });
}
function list(items) {
  if (items.length === 0) {
    return [paragraph("-")];
  }
  return items.map(
    (item) => new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text: item || "-", size: 21 })]
    })
  );
}
function numbered(items) {
  if (items.length === 0) {
    return [paragraph("-")];
  }
  return items.map(
    (item, index) => paragraph(`${index + 1}. ${item || "-"}`, { spacingAfter: 80 })
  );
}
function cell(text, options = {}) {
  return new TableCell({
    columnSpan: options.span,
    verticalAlign: VerticalAlign.CENTER,
    shading: options.header ? { type: ShadingType.CLEAR, fill: COLORS.headerFill, color: COLORS.white } : void 0,
    borders: CELL_BORDER,
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: [
      paragraph(text, {
        bold: options.header,
        color: options.header ? COLORS.accent : void 0,
        size: 19,
        spacingAfter: 0
      })
    ]
  });
}
function keyValueTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row) => new TableRow({
        children: [
          cell(row.label, { header: true }),
          cell(row.value || "-")
        ]
      })
    )
  });
}
function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((header) => cell(header, { header: true }))
      }),
      ...rows.map(
        (row) => new TableRow({
          children: headers.map((_, index) => cell(row[index] || "-"))
        })
      )
    ]
  });
}
function renderSectionCards(sections) {
  return sections.flatMap((section) => [
    sectionTitle(section.title),
    paragraph(section.body)
  ]);
}
function renderTitledItems(title, items) {
  return [
    sectionTitle(title),
    ...items.flatMap((item) => [
      paragraph(item.title, { bold: true, spacingAfter: 40 }),
      paragraph(item.description)
    ])
  ];
}
function renderSignOff(signOff) {
  return [
    paragraph(""),
    paragraph(`${signOff.city || "-"}${signOff.date ? `, ${signOff.date}` : ""}`, { spacingAfter: 40 }),
    paragraph("Disiapkan oleh,", { spacingAfter: 40 }),
    paragraph("", { spacingAfter: 600 }),
    paragraph(signOff.preparedBy || "-", { bold: true, spacingAfter: 0 })
  ];
}
function decodeImageDataUri(dataUri) {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUri);
  if (!match) {
    return null;
  }
  return {
    type: match[1].toLowerCase() === "png" ? "png" : "jpg",
    data: Buffer.from(match[2], "base64")
  };
}
function renderCoverPage(options) {
  return [
    paragraph("Disusun Oleh :", { italics: true, color: COLORS.muted, size: 20, spacingAfter: 40 }),
    paragraph(options.preparedBy || "-", { size: 22, spacingAfter: 200 }),
    paragraph(`Tahun ${options.year || "-"}`, { bold: true, size: 28, spacingAfter: 400 }),
    paragraph("", { spacingAfter: 400 }),
    titleParagraph(options.title || "-"),
    options.titleAccent ? paragraph(options.titleAccent, { color: COLORS.muted, size: 24, spacingAfter: 200 }) : paragraph("", { spacingAfter: 200 }),
    paragraph(`Institusi: ${options.institution || "-"}`, { size: 20, spacingAfter: 60 }),
    options.area ? paragraph(options.area, { size: 20, color: COLORS.muted, spacingAfter: 60 }) : null,
    paragraph(options.note || "sertifikasitrainer.com", { italics: true, color: COLORS.muted, size: 18, spacingAfter: 0 }),
  ].filter(Boolean);
}
function renderTocPage(items) {
  return [
    sectionTitle("Daftar Isi"),
    ...items.map((item) => paragraph(item, { spacingAfter: 80 })),
  ];
}
function extractCoverYear(...values) {
  for (const value of values) {
    const match = String(value || "").match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
  return String(new Date().getFullYear());
}
function renderBukti1(viewModel) {
  return [
    ...renderCoverPage({
      preparedBy: viewModel.signOff.preparedBy,
      year: extractCoverYear(viewModel.signOff.date),
      title: "Training Need Analysis (Makro)",
      titleAccent: `Program: ${viewModel.header.heroTitle || "-"}`,
      institution: viewModel.meta.find((m) => m.label === "Lembaga")?.value,
      area: `Wilayah: ${viewModel.meta.find((m) => m.label === "Wilayah Utama")?.value || "-"}`,
      note: "Dokumen Analisis Makro Kewilayahan",
    }),
    ...renderTocPage(["1. Pendahuluan", "2. Metodologi", "3. Pengumpulan Data", "4. Analisis Data", "5. Rekomendasi", "6. Kesimpulan"]),
    ...renderSectionCards(viewModel.sections),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderBukti2(viewModel) {
  return [
    muted(viewModel.header.eyebrow),
    titleParagraph(viewModel.header.title),
    paragraph(viewModel.header.subtitle, { italics: true }),
    sectionTitle(viewModel.header.roleTitle),
    paragraph(viewModel.header.roleSummary),
    sectionTitle("Profil Organisasi"),
    keyValueTable(viewModel.organizationMeta),
    sectionTitle("Profil Program"),
    keyValueTable(viewModel.programMeta),
    sectionTitle("Fungsi Jabatan Sasaran"),
    paragraph(viewModel.targetRole.mainFunction),
    ...list(viewModel.targetRole.mainTasks),
    sectionTitle("Standar Kinerja"),
    ...list(viewModel.targetRole.performanceStandards),
    sectionTitle("Ringkasan Kompetensi"),
    paragraph(viewModel.competencySummary),
    keyValueTable(viewModel.assessmentMeta),
    simpleTable(
      ["Indikator", "Skor Rata-rata", "Catatan Gap"],
      viewModel.assessmentRows.map((row) => [row.indicator, row.scoreAverage, row.gapNote])
    ),
    sectionTitle("Temuan Gap Kunci"),
    ...list(viewModel.keyGapFindings),
    sectionTitle("Prioritas Kompetensi"),
    ...list(viewModel.priorityCompetencies),
    ...renderTitledItems("Rekomendasi", viewModel.recommendations),
    simpleTable(
      ["Kode Unit", "Judul Unit", "Alasan"],
      viewModel.trainingUnits.map((unit) => [unit.unitCode, unit.unitTitle, unit.reason])
    ),
    sectionTitle("Kesimpulan"),
    paragraph(viewModel.conclusion),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderBukti3(viewModel) {
  return [
    titleParagraph(viewModel.title),
    simpleTable(
      ["Tujuan Utama", "Fungsi Kunci", "Fungsi Utama", "Fungsi Dasar"],
      viewModel.rows.map((row) => [
        row.tujuanUtama,
        row.fungsiKunci,
        row.fungsiUtama,
        row.fungsiDasar
      ])
    ),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderBukti4(viewModel) {
  return [
    titleParagraph(viewModel.title),
    keyValueTable(viewModel.meta),
    sectionTitle("Elemen dan Kriteria Unjuk Kerja"),
    ...viewModel.elements.flatMap((element) => [
      paragraph(`${element.number}. ${element.title}`, { bold: true }),
      simpleTable(
        ["Kode", "Kriteria Unjuk Kerja"],
        element.criteria.map((criterion) => [criterion.code, criterion.description])
      )
    ]),
    sectionTitle("Batasan Variabel"),
    paragraph(viewModel.variableContext.scope),
    ...list(viewModel.variableContext.selfManagementItems),
    ...list(viewModel.variableContext.additionalNotes),
    sectionTitle("Peralatan dan Perlengkapan"),
    ...list([...viewModel.toolsEquipment.tools, ...viewModel.toolsEquipment.supplies]),
    sectionTitle("Peraturan"),
    ...list(viewModel.regulations),
    sectionTitle("Norma dan Standar"),
    ...list([...viewModel.normsStandards.norms, ...viewModel.normsStandards.standards]),
    sectionTitle("Panduan Penilaian"),
    ...list([
      ...viewModel.assessmentGuide.context,
      ...viewModel.assessmentGuide.competencyRequirements,
      ...viewModel.assessmentGuide.knowledge,
      ...viewModel.assessmentGuide.skills,
      ...viewModel.assessmentGuide.workAttitude,
      ...viewModel.assessmentGuide.criticalAspects
    ]),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderBukti5(viewModel) {
  const evidenceBlocks = viewModel.evidences.flatMap((evidence) => {
    const decoded = decodeImageDataUri(evidence.imageDataUri);
    const blocks = [sectionTitle(evidence.title)];
    if (decoded) {
      blocks.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new ImageRun({
              type: decoded.type,
              data: decoded.data,
              transformation: { width: 470, height: 265 }
            })
          ]
        })
      );
    } else {
      blocks.push(paragraph("Gambar bukti belum tersedia."));
    }
    return blocks;
  });
  return [
    titleParagraph(viewModel.title),
    paragraph(viewModel.subtitle, { italics: true }),
    ...evidenceBlocks
  ];
}
function renderBukti6(viewModel) {
  return [
    muted(viewModel.header.eyebrow),
    titleParagraph(viewModel.header.title),
    paragraph(viewModel.header.subtitle, { italics: true }),
    sectionTitle(viewModel.header.heroTitle),
    paragraph(viewModel.header.heroSummary),
    keyValueTable(viewModel.meta),
    sectionTitle("Sorotan"),
    keyValueTable(viewModel.highlights),
    ...renderSectionCards(viewModel.sections),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderBukti7(viewModel) {
  return [
    muted(viewModel.header.eyebrow),
    titleParagraph(viewModel.header.title),
    paragraph(viewModel.header.subtitle, { italics: true }),
    keyValueTable([
      { label: "Nomor Dokumen", value: viewModel.header.documentNumber },
      { label: "Tanggal", value: viewModel.header.agreementDate },
      { label: "Lokasi", value: viewModel.header.agreementLocation }
    ]),
    sectionTitle("Para Pihak"),
    ...viewModel.parties.flatMap((party) => [
      paragraph(party.label, { bold: true }),
      keyValueTable([
        { label: "Organisasi", value: party.organizationName },
        { label: "Perwakilan", value: party.representativeName },
        { label: "Jabatan", value: party.representativeTitle },
        { label: "Alamat", value: party.address }
      ])
    ]),
    sectionTitle("Premis"),
    ...numbered(viewModel.premisePoints),
    ...viewModel.articles.flatMap((article) => [
      sectionTitle(`Pasal ${article.number} - ${article.title}`),
      paragraph(article.content),
      ...article.emphasis ? [paragraph(article.emphasis, { bold: true })] : []
    ]),
    sectionTitle("Penutup"),
    paragraph(viewModel.closingParagraph)
  ];
}
function renderBukti8(viewModel) {
  return [
    muted(viewModel.header.eyebrow),
    titleParagraph(viewModel.header.title),
    paragraph(viewModel.header.subtitle, { italics: true }),
    sectionTitle(viewModel.header.heroTitle),
    paragraph(viewModel.header.heroSummary),
    sectionTitle("Informasi Pelaksanaan"),
    keyValueTable(viewModel.implementationInfo),
    sectionTitle("Tujuan Evaluasi"),
    paragraph(viewModel.evaluationObjective),
    keyValueTable(viewModel.methodologyMeta),
    sectionTitle(viewModel.chart.title),
    simpleTable(
      ["Indikator", viewModel.chart.scaleLabel, "Jumlah Favorable"],
      viewModel.chart.bars.map((bar) => [
        bar.label,
        `${bar.percentage}%`,
        String(bar.favorableCount)
      ])
    ),
    ...renderSectionCards(viewModel.resultSections),
    sectionTitle("Analisis"),
    paragraph(viewModel.analysis),
    sectionTitle("Kesimpulan"),
    paragraph(viewModel.conclusion),
    sectionTitle("Rekomendasi"),
    ...list(viewModel.recommendations),
    ...renderSignOff(viewModel.signOff)
  ];
}
function renderGeneric(viewModel) {
  return [
    titleParagraph(viewModel.title),
    paragraph(viewModel.subtitle, { italics: true }),
    keyValueTable(viewModel.meta),
    ...viewModel.sections.flatMap((section) => [
      sectionTitle(section.title),
      ...section.blocks.flatMap((block) => {
        if (block.type === "paragraph") {
          return [paragraph(block.text)];
        }
        if (block.type === "list") {
          return list(block.items);
        }
        return [simpleTable(block.headers, block.rows)];
      })
    ])
  ];
}
function renderViewModel(viewModel) {
  switch (viewModel.variant) {
    case "bukti-1-editorial":
      return renderBukti1(viewModel);
    case "bukti-2-editorial":
      return renderBukti2(viewModel);
    case "bukti-3-competency-map":
      return renderBukti3(viewModel);
    case "bukti-4-unit":
      return renderBukti4(viewModel);
    case "bukti-5-evidence":
      return renderBukti5(viewModel);
    case "bukti-6-editorial":
      return renderBukti6(viewModel);
    case "bukti-7-editorial":
      return renderBukti7(viewModel);
    case "bukti-8-evaluation":
      return renderBukti8(viewModel);
    case "generic":
      return renderGeneric(viewModel);
  }
}
function createDocxMasterDocument(documentType, payload) {
  const viewModel = buildMasterPayloadViewModel(documentType, payload);
  return new Document({
    creator: "TrainerHub",
    title: "AI for Master Document",
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Halaman ", size: 18, color: COLORS.muted }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: COLORS.muted }),
                  new TextRun({ text: " dari ", size: 18, color: COLORS.muted }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: COLORS.muted })
                ]
              })
            ]
          })
        },
        children: renderViewModel(viewModel)
      }
    ]
  });
}
async function packDocxMasterDocument(documentType, payload) {
  return Packer.toBuffer(createDocxMasterDocument(documentType, payload));
}
export {
  createDocxMasterDocument,
  packDocxMasterDocument
};
