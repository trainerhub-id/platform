// src/trainer/docx-trainer-document.factory.mjs
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  HeadingLevel,
} from "docx";

const FONT = "Arial";
const COLORS = {
  accent: "B8863B",
  accentDark: "7A5524",
  headerFill: "F4E8D2",
  softFill: "FBF7EF",
  border: "000000",
  white: "FFFFFF",
  ink: "1F2937",
  muted: "6B7280",
};
const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.border },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(text, opts = {}) {
  return new TextRun({ text: String(text ?? "-"), font: FONT, size: opts.size ?? 22, bold: opts.bold, color: opts.color ?? COLORS.ink, italics: opts.italics });
}

function para(children, opts = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { after: opts.after ?? 100, before: opts.before ?? 0 },
    heading: opts.heading,
    children: Array.isArray(children) ? children : [run(children, opts)],
  });
}

function title(text) {
  return para([run(text, { bold: true, size: 28, color: COLORS.accentDark })], { align: AlignmentType.CENTER, after: 200 });
}

function sectionHead(text) {
  return para([run(text, { bold: true, size: 22, color: COLORS.accentDark })], { after: 80, before: 160 });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    borders: BORDER,
    children: [para([run(text, { bold: opts.bold, size: 20 })], { after: 60 })],
  });
}

function headerRow(cols) {
  return new TableRow({ children: cols.map((c) => cell(c, { bold: true, fill: COLORS.headerFill })) });
}

function dataRow(cols, band = false) {
  return new TableRow({ children: cols.map((c) => cell(c, { fill: band ? COLORS.softFill : COLORS.white })) });
}

function kvTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value], i) =>
      new TableRow({
        children: [
          cell(label, { bold: true, fill: COLORS.headerFill, width: 35 }),
          cell(value ?? "-", { fill: i % 2 === 0 ? COLORS.white : COLORS.softFill, width: 65 }),
        ],
      })
    ),
  });
}

function docHeader(title_text, subtitle = "") {
  return [
    para([run(title_text, { bold: true, size: 28, color: COLORS.accentDark })], { align: AlignmentType.CENTER, after: 60 }),
    subtitle ? para([run(subtitle, { size: 20, color: COLORS.muted })], { align: AlignmentType.CENTER, after: 200 }) : null,
  ].filter(Boolean);
}

function makeDoc(children) {
  return new Document({
    creator: "TrainerHub",
    styles: {
      default: {
        document: { run: { font: FONT, size: 22, color: COLORS.ink }, paragraph: { spacing: { after: 100 } } },
      },
    },
    sections: [{ children }],
  });
}

// ─── View model helpers ───────────────────────────────────────────────────────

function get(obj, ...keys) {
  for (const key of keys) {
    const val = key.split(".").reduce((o, k) => o?.[k], obj);
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return "-";
}

function trainerInfo(p) {
  return {
    nama: get(p, "trainer.name", "brainstorming.trainer_name"),
    lembaga: get(p, "organizer.name", "brainstorming.institution"),
    bidang: get(p, "brainstorming.expertise"),
    program: get(p, "training.name", "training_details.program_name"),
    unitCode: get(p, "unit.code", "unit_selection.selected_unit_code"),
    unitTitle: get(p, "unit.name"),
    audience: get(p, "brainstorming.audience"),
    outcome: get(p, "brainstorming.outcome"),
    elements: Array.isArray(p?.unit?.elements) ? p.unit.elements : [],
  };
}

// ─── Document generators ─────────────────────────────────────────────────────

function genProgramPelatihan(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("PROGRAM PELATIHAN", t.program),
    kvTable([
      ["Nama Program", t.program],
      ["Nama Trainer", t.nama],
      ["Lembaga", t.lembaga],
      ["Bidang Keahlian", t.bidang],
      ["Target Peserta", t.audience],
      ["Hasil yang Diharapkan", t.outcome],
      ["Kode Unit SKKNI", t.unitCode],
      ["Judul Unit", t.unitTitle],
    ]),
    sectionHead("Elemen Kompetensi"),
    t.elements.length > 0
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["No", "Elemen", "KUK"]),
            ...t.elements.flatMap((el, i) =>
              (el.kuk ?? []).map((kuk, j) =>
                dataRow([j === 0 ? String(i + 1) : "", j === 0 ? el.element_text ?? el.elementTitle ?? "-" : "", kuk.kuk_text ?? kuk.description ?? "-"], i % 2 === 0)
              )
            ),
          ],
        })
      : para("Belum ada elemen kompetensi."),
  ]);
}

function genLessonPlan(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("LESSON PLAN", t.program),
    kvTable([
      ["Nama Trainer", t.nama],
      ["Lembaga", t.lembaga],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
      ["Target Peserta", t.audience],
    ]),
    sectionHead("Rencana Sesi Pembelajaran"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Elemen Kompetensi", "Metode", "Durasi (JP)", "Media"]),
        ...t.elements.map((el, i) =>
          dataRow([String(i + 1), el.element_text ?? el.elementTitle ?? "-", "Ceramah, Diskusi, Praktik", "2", "Modul, Slide"], i % 2 === 0)
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "-", "-", "-"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genJSA(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("JOB SAFETY ANALYSIS (JSA)", t.program),
    kvTable([
      ["Nama Trainer", t.nama],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
    ]),
    sectionHead("Analisis Keselamatan Kerja"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Langkah Kerja", "Potensi Bahaya", "Tindakan Pencegahan"]),
        ...t.elements.map((el, i) =>
          dataRow([String(i + 1), el.element_text ?? el.elementTitle ?? "-", "-", "-"], i % 2 === 0)
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "-", "-"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genTest(p, isPost = false) {
  const t = trainerInfo(p);
  const label = isPost ? "POST-TEST" : "PRE-TEST";
  return makeDoc([
    ...docHeader(`LEMBAR SOAL ${label}`, t.program),
    kvTable([
      ["Nama Peserta", "___________________________"],
      ["Tanggal", "___________________________"],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
    ]),
    sectionHead("Soal"),
    ...t.elements.flatMap((el, i) => [
      para([run(`${i + 1}. ${el.element_text ?? el.elementTitle ?? "-"}`, { bold: true })], { after: 60 }),
      ...(el.kuk ?? []).map((kuk, j) =>
        para(`   ${String.fromCharCode(97 + j)}. ${kuk.kuk_text ?? kuk.description ?? "-"}`)
      ),
    ]),
    t.elements.length === 0 ? para("Soal belum tersedia.") : null,
  ].filter(Boolean));
}

function genEvaluasi(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("FORM EVALUASI PELATIHAN", t.program),
    kvTable([
      ["Nama Trainer", t.nama],
      ["Program", t.program],
      ["Tanggal", "___________________________"],
    ]),
    sectionHead("Penilaian Peserta"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Aspek Penilaian", "Nilai (1-5)", "Keterangan"]),
        ...["Materi pelatihan relevan", "Trainer menguasai materi", "Metode pembelajaran efektif", "Fasilitas memadai", "Durasi sesuai"].map((asp, i) =>
          dataRow([String(i + 1), asp, "", ""], i % 2 === 0)
        ),
      ],
    }),
    sectionHead("Saran dan Masukan"),
    para("_______________________________________________"),
    para("_______________________________________________"),
  ]);
}

function genTNA(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("TRAINING NEEDS ANALYSIS (TNA)", t.program),
    kvTable([
      ["Nama Trainer", t.nama],
      ["Lembaga", t.lembaga],
      ["Bidang", t.bidang],
      ["Target Peserta", t.audience],
      ["Kebutuhan Pelatihan", t.outcome],
    ]),
    sectionHead("Analisis Kebutuhan"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Kompetensi yang Dibutuhkan", "Gap", "Prioritas"]),
        ...t.elements.map((el, i) =>
          dataRow([String(i + 1), el.element_text ?? el.elementTitle ?? "-", "Perlu pelatihan", "Tinggi"], i % 2 === 0)
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "-", "-"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genPetaKompetensi(p) {
  const t = trainerInfo(p);
  const map = p?.competency_map ?? {};
  return makeDoc([
    ...docHeader("PETA KOMPETENSI", t.program),
    kvTable([
      ["Tujuan Utama", map.main_goal ?? "-"],
      ["Fungsi Kunci", map.key_function ?? "-"],
      ["Fungsi Utama", map.main_function ?? "-"],
      ["Fungsi Dasar", map.basic_function ?? "-"],
      ["Kode Unit", t.unitCode],
      ["Judul Unit", t.unitTitle],
    ]),
    sectionHead("Elemen Kompetensi"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Elemen", "Kriteria Unjuk Kerja"]),
        ...t.elements.flatMap((el, i) =>
          (el.kuk ?? []).map((kuk, j) =>
            dataRow([j === 0 ? String(i + 1) : "", j === 0 ? el.element_text ?? el.elementTitle ?? "-" : "", kuk.kuk_text ?? kuk.description ?? "-"], i % 2 === 0)
          )
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "-"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genDaftarBahan(p) {
  const t = trainerInfo(p);
  const materials = Array.isArray(p?.resources?.materials) ? p.resources.materials : [];
  return makeDoc([
    ...docHeader("DAFTAR KEBUTUHAN BAHAN", t.program),
    kvTable([["Nama Trainer", t.nama], ["Program", t.program]]),
    sectionHead("Daftar Bahan"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Nama Bahan", "Spesifikasi", "Jumlah", "Satuan"]),
        ...materials.map((m, i) =>
          dataRow([String(i + 1), m.name ?? "-", m.spec ?? "-", String(m.qty ?? 1), m.unit ?? "buah"], i % 2 === 0)
        ),
        materials.length === 0 ? dataRow(["1", "Modul pelatihan", "Sesuai kebutuhan", "1", "set"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genDaftarPeralatan(p) {
  const t = trainerInfo(p);
  const equipment = Array.isArray(p?.resources?.equipment) ? p.resources.equipment : [];
  return makeDoc([
    ...docHeader("DAFTAR KEBUTUHAN PERALATAN", t.program),
    kvTable([["Nama Trainer", t.nama], ["Program", t.program]]),
    sectionHead("Daftar Peralatan"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Nama Peralatan", "Spesifikasi", "Jumlah", "Satuan"]),
        ...equipment.map((e, i) =>
          dataRow([String(i + 1), e.name ?? "-", e.spec ?? "-", String(e.qty ?? 1), e.unit ?? "unit"], i % 2 === 0)
        ),
        equipment.length === 0 ? dataRow(["1", "Laptop/Komputer", "Processor i5, RAM 8GB", "1", "unit"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genPenilaian(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("PENILAIAN PELATIHAN", t.program),
    kvTable([
      ["Nama Peserta", "___________________________"],
      ["Nama Trainer", t.nama],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
    ]),
    sectionHead("Rekap Nilai"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Elemen Kompetensi", "Nilai Pre-Test", "Nilai Post-Test", "Keterangan"]),
        ...t.elements.map((el, i) =>
          dataRow([String(i + 1), el.element_text ?? el.elementTitle ?? "-", "", "", ""], i % 2 === 0)
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "", "", ""]) : null,
      ].filter(Boolean),
    }),
  ]);
}

function genFRIA01(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("FR.IA.01 CEKLIS OBSERVASI", t.program),
    para([run("Aktivitas di Tempat Kerja atau Tempat Kerja Simulasi", { bold: true, size: 22 })], { align: AlignmentType.CENTER, after: 200 }),
    kvTable([
      ["Nama Asesi", "___________________________"],
      ["Nama Asesor", t.nama],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
      ["Tanggal", "___________________________"],
    ]),
    sectionHead("Ceklis Observasi"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Elemen / KUK", "K", "BK", "Catatan"]),
        ...t.elements.flatMap((el, i) => [
          new TableRow({
            children: [
              cell(String(i + 1), { bold: true, fill: COLORS.headerFill }),
              cell(el.element_text ?? el.elementTitle ?? "-", { bold: true, fill: COLORS.headerFill }),
              cell("", { fill: COLORS.headerFill }),
              cell("", { fill: COLORS.headerFill }),
              cell("", { fill: COLORS.headerFill }),
            ],
          }),
          ...(el.kuk ?? []).map((kuk, j) =>
            dataRow(["", `${i + 1}.${j + 1} ${kuk.kuk_text ?? kuk.description ?? "-"}`, "☐", "☐", ""], i % 2 === 0)
          ),
        ]),
        t.elements.length === 0 ? dataRow(["1", "-", "☐", "☐", ""]) : null,
      ].filter(Boolean),
    }),
    sectionHead("Rekomendasi"),
    para("☐ Kompeten    ☐ Belum Kompeten"),
  ]);
}

function genFRIA02(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("FR.IA.02 TUGAS PRAKTIK DEMONSTRASI", t.program),
    kvTable([
      ["Nama Asesi", "___________________________"],
      ["Nama Asesor", t.nama],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
    ]),
    sectionHead("Instruksi Tugas"),
    ...t.elements.map((el, i) =>
      para([run(`${i + 1}. Demonstrasikan: ${el.element_text ?? el.elementTitle ?? "-"}`, { size: 22 })])
    ),
    t.elements.length === 0 ? para("Instruksi belum tersedia.") : null,
    sectionHead("Penilaian"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Kriteria Penilaian", "K", "BK"]),
        ...t.elements.flatMap((el, i) =>
          (el.kuk ?? []).map((kuk, j) =>
            dataRow([`${i + 1}.${j + 1}`, kuk.kuk_text ?? kuk.description ?? "-", "☐", "☐"], i % 2 === 0)
          )
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "☐", "☐"]) : null,
      ].filter(Boolean),
    }),
  ].filter(Boolean));
}

function genFRIA03(p) {
  const t = trainerInfo(p);
  return makeDoc([
    ...docHeader("FR.IA.03 PERTANYAAN LISAN", t.program),
    kvTable([
      ["Nama Asesi", "___________________________"],
      ["Nama Asesor", t.nama],
      ["Unit Kompetensi", `${t.unitCode} - ${t.unitTitle}`],
    ]),
    sectionHead("Daftar Pertanyaan"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["No", "Pertanyaan", "Jawaban yang Diharapkan", "K", "BK"]),
        ...t.elements.flatMap((el, i) =>
          (el.kuk ?? []).map((kuk, j) =>
            dataRow([`${i + 1}.${j + 1}`, `Jelaskan ${kuk.kuk_text ?? kuk.description ?? "-"}`, "-", "☐", "☐"], i % 2 === 0)
          )
        ),
        t.elements.length === 0 ? dataRow(["1", "-", "-", "☐", "☐"]) : null,
      ].filter(Boolean),
    }),
  ]);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

const GENERATORS = {
  "trainer-program-pelatihan": genProgramPelatihan,
  "trainer-lesson-plan": genLessonPlan,
  "trainer-job-safety-analysis": genJSA,
  "trainer-pre-test": (p) => genTest(p, false),
  "trainer-post-test": (p) => genTest(p, true),
  "trainer-evaluasi-pelatihan": genEvaluasi,
  "trainer-tna": genTNA,
  "trainer-peta-kompetensi": genPetaKompetensi,
  "trainer-daftar-bahan": genDaftarBahan,
  "trainer-daftar-peralatan": genDaftarPeralatan,
  "trainer-penilaian-pre-test": genPenilaian,
  "trainer-fr-ia-01": genFRIA01,
  "trainer-fr-ia-02": genFRIA02,
  "trainer-fr-ia-03": genFRIA03,
};

export async function packDocxTrainerDocument(documentType, payload) {
  const generator = GENERATORS[documentType];
  if (!generator) throw new Error(`Unknown trainer document type: ${documentType}`);
  const doc = generator(payload);
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export const TRAINER_DOCUMENT_TYPES = Object.keys(GENERATORS);
