const A4_PORTRAIT_SIZE = { width: 595.28, height: 841.89 };
const BUKTI1_FOOTER_TOP = 806;
function text(value, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}
function formatLabel(value) {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase());
}
function normalizeCell(value) {
  if (value === null || value === void 0) {
    return "-";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "-";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCell(item)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([key, nestedValue]) => `${formatLabel(key)}: ${normalizeCell(nestedValue)}`).join(" | ");
  }
  return String(value);
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function buildBlocksFromValue(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [{ type: "paragraph", text: normalizeCell(value) }];
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ type: "paragraph", text: "-" }];
    }
    if (value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean")) {
      return [{ type: "list", items: value.map((item) => normalizeCell(item)) }];
    }
    if (value.every((item) => isRecord(item))) {
      const headers = Array.from(
        value.reduce((set, row) => {
          Object.keys(row).forEach((key) => set.add(key));
          return set;
        }, /* @__PURE__ */ new Set())
      );
      return [
        {
          type: "table",
          headers,
          rows: value.map((row) => headers.map((header) => normalizeCell(row[header])))
        }
      ];
    }
    return [{ type: "paragraph", text: normalizeCell(value) }];
  }
  if (isRecord(value)) {
    const nonEmptyEntries = Object.entries(value).filter(([, nestedValue]) => {
      if (nestedValue === null || nestedValue === void 0) return false;
      if (typeof nestedValue === "string") return nestedValue.trim().length > 0;
      if (Array.isArray(nestedValue)) return nestedValue.length > 0;
      if (typeof nestedValue === "object") return Object.keys(nestedValue).length > 0;
      return true;
    });
    if (nonEmptyEntries.length === 0) {
      return [{ type: "paragraph", text: "-" }];
    }
    return nonEmptyEntries.map(([nestedKey, nestedValue]) => ({
      type: "paragraph",
      text: `${formatLabel(nestedKey)}: ${normalizeCell(nestedValue)}`
    }));
  }
  return [{ type: "paragraph", text: "-" }];
}
function joinSentences(values) {
  return values.map((item) => item.trim()).filter(Boolean).join(" ");
}
function joinParagraphs(values) {
  return values.map((item) => item.trim()).filter(Boolean).join("\n\n");
}
function bulletList(items) {
  return items.map((item) => item.trim()).filter(Boolean).map((item) => `\u2022 ${item}`).join("\n");
}
function normalizeBukti8ResultSectionTitle(rawTitle, index) {
  const normalizedText = rawTitle.trim().replace(/^\d+\.\d+\s+/, "");
  const sectionNumber = index + 1;
  return `4.${sectionNumber} ${normalizedText || "Hasil Evaluasi"}`;
}
function toBukti7Party(label, party) {
  const normalized = isRecord(party) ? party : {};
  return {
    label,
    organizationName: text(normalized.organization_name, "-"),
    representativeName: text(normalized.representative_name, "-"),
    representativeTitle: text(normalized.representative_title, "-"),
    address: text(normalized.address, "-")
  };
}
function buildBukti7ArticleEntries(payload) {
  return Object.entries(payload).filter(([key, value]) => /^pasal_\d+_/i.test(key) && isRecord(value)).sort(([left], [right]) => left.localeCompare(right, "en", { numeric: true })).map(([key, value], index) => {
    const article = value;
    return {
      key,
      number: index + 1,
      title: text(article.title, `Pasal ${index + 1}`),
      content: text(article.content, "-"),
      emphasis: text(article.payment_terms || article.cost_estimate, "") || void 0
    };
  });
}
function buildBukti1EditorialViewModel(payload) {
  const regionContext = isRecord(payload.region_context) ? payload.region_context : {};
  const introduction = isRecord(payload.introduction) ? payload.introduction : {};
  const competencyReference = isRecord(payload.competency_reference) ? payload.competency_reference : {};
  const methodology = isRecord(payload.methodology) ? payload.methodology : {};
  const needsAnalysis = isRecord(payload.needs_analysis) ? payload.needs_analysis : {};
  const dataCollection = isRecord(payload.data_collection) ? payload.data_collection : {};
  const signOff = isRecord(payload.sign_off) ? payload.sign_off : {};
  const methodsUsed = Array.isArray(methodology.methods_used) ? methodology.methods_used.filter(isRecord).map((item) => ({
    title: text(item.name, "Metode"),
    description: text(item.description)
  })) : [];
  const findings = Array.isArray(payload.key_findings) ? payload.key_findings.filter(isRecord).map((item) => ({
    title: text(item.title, "Temuan"),
    description: text(item.description)
  })) : [];
  const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations.filter(isRecord).map((item) => ({
    title: text(item.title, "Rekomendasi"),
    description: text(item.description)
  })) : [];
  const organizationName = text(regionContext.organization_name);
  const organizationCity = text(regionContext.organization_city);
  const regionLabel = text(regionContext.primary_region);
  const targetContext = text(regionContext.target_context);
  const unitCode = text(competencyReference.unit_code);
  const unitTitle = text(competencyReference.unit_title);
  const methodologyBody = joinSentences([
    text(methodology.approach_summary),
    methodsUsed.length > 0 ? `Metode yang digunakan: ${methodsUsed.map((item) => `${item.title}${item.description ? ` - ${item.description}` : ""}`).join("; ")}.` : ""
  ]);
  const currentCondition = text(needsAnalysis.current_condition);
  const gapAnalysis = text(needsAnalysis.gap_analysis);
  const idealCondition = text(introduction.training_objective) ? `Kondisi ideal yang dituju adalah tercapainya ${text(introduction.training_objective).toLowerCase()} secara konsisten melalui penerapan kompetensi ${unitCode || unitTitle || "terpilih"}.` : "";
  const priorityNeeds = Array.isArray(needsAnalysis.priority_needs) ? needsAnalysis.priority_needs.map((item) => text(item)).filter(Boolean) : [];
  const findingsBody = findings.length > 0 ? findings.map((item, index) => `${index + 1}. ${item.title}${item.description ? ` - ${item.description}` : ""}`).join(" ") : "";
  const recommendationsBody = recommendations.length > 0 ? recommendations.map((item, index) => `${index + 1}. ${item.title}${item.description ? ` - ${item.description}` : ""}`).join(" ") : "";
  const conciseCompetencyReason = unitTitle ? `Unit ini dipilih karena paling relevan untuk menjawab masalah ${text(introduction.problem_statement) || "utama"} pada peserta sasaran.` : "";
  const conciseCompetencySummary = unitTitle ? `Fokus unit ini adalah membekali peserta dengan kompetensi inti pada area ${unitTitle.toLowerCase()} agar dapat diterapkan lebih konsisten dalam konteks kerja nyata.` : "";
  const competencyNarrative = [
    "Dokumen TNA ini bertujuan untuk menganalisis kebutuhan pelatihan dan merumuskan kebutuhan kompetensi berdasarkan standar yang relevan.",
    "Dasar analisis kompetensi dalam dokumen ini meliputi:",
    unitCode ? `\u2022 SKKNI / standar yang dipakai: ${unitCode}` : "",
    unitTitle ? `\u2022 Unit kompetensi yang dipilih: ${unitTitle}` : "",
    conciseCompetencyReason ? `\u2022 ${conciseCompetencyReason}` : "",
    conciseCompetencySummary ? `\u2022 ${conciseCompetencySummary}` : ""
  ].filter(Boolean).join("\n");
  return {
    variant: "bukti-1-editorial",
    header: {
      eyebrow: "AI for Master \xB7 Bukti 1",
      title: text(payload.document_title, "TRAINING NEED ANALYSIS"),
      subtitle: text(payload.document_subtitle, "TNA MAKRO"),
      heroTitle: text(payload.program_title, "Program Pelatihan"),
      heroSummary: joinSentences([
        text(introduction.background),
        text(introduction.problem_statement)
      ])
    },
    meta: [
      { label: "Lembaga", value: organizationName || "-" },
      { label: "Wilayah Utama", value: text(regionContext.primary_region) },
      { label: "Sektor", value: text(regionContext.sector) },
      { label: "Unit SKKNI", value: text(competencyReference.unit_code) }
    ],
    highlights: [
      { label: "Masalah Utama", value: text(introduction.problem_statement) },
      { label: "Tujuan Pelatihan", value: text(introduction.training_objective) },
      { label: "Peluang Pengembangan", value: text(regionContext.generated_opportunity_summary) }
    ],
    sections: [
      {
        key: "introduction",
        title: "1. Pendahuluan",
        body: joinParagraphs([
          `Latar Belakang
${text(introduction.background) || "-"}`,
          `Penjelasan Tujuan Laporan
${text(introduction.report_objective) || text(introduction.training_objective) || "-"}`,
          competencyNarrative,
          `Gambaran Umum Program
${text(introduction.program_overview) || text(payload.program_title) || "-"}`,
          `Profil Wilayah dan Konteks Bisnis
Wilayah sasaran utama mencakup ${regionLabel || "-"} dengan penyelenggara program ${organizationName || "-"}${organizationCity ? ` yang berbasis di ${organizationCity}` : ""}.${targetContext ? ` Sasaran pengguna program adalah ${targetContext}.` : ""}
${text(regionContext.generated_regional_profile) || "-"}
${text(regionContext.generated_business_landscape) || "-"}
${text(regionContext.generated_opportunity_summary) || "-"}`
        ])
      },
      {
        key: "methodology",
        title: "2. Metodologi",
        body: joinParagraphs([
          `Pendekatan Analisis
${text(methodology.approach_summary) || methodologyBody || "-"}`,
          `Metode Pengumpulan Data
${bulletList(
            methodsUsed.length > 0 ? methodsUsed.map((item) => `${item.title}${item.description ? ` - ${item.description}` : ""}`) : ["Survey", "Wawancara", "Observasi", "Data sekunder"]
          )}`,
          `Cara Analisis
Data dianalisis dengan membaca hubungan antara masalah industri, karakteristik peserta, konteks wilayah, dan tuntutan kompetensi pada unit ${unitCode || unitTitle || "terpilih"}.`
        ])
      },
      {
        key: "data-collection",
        title: "3. Pengumpulan Data",
        body: joinParagraphs([
          `Hasil Survey
${text(dataCollection.survey_summary) || "-"}`,
          `Hasil Wawancara
${text(dataCollection.interview_summary) || "-"}`,
          `Data Sekunder
${text(dataCollection.secondary_data_summary) || text(regionContext.generated_opportunity_summary) || "-"}`
        ])
      },
      {
        key: "data-analysis",
        title: "4. Analisis Data",
        body: joinParagraphs([
          `Kondisi Saat Ini
${currentCondition || "-"}`,
          `Kondisi Ideal
${text(needsAnalysis.ideal_condition) || idealCondition || "-"}`,
          `Gap Kompetensi
${gapAnalysis || "-"}`,
          priorityNeeds.length > 0 ? `Prioritas Kebutuhan
${bulletList(priorityNeeds)}` : "",
          findingsBody ? `Temuan Utama
${findingsBody.split(/\s(?=\d+\.)/).filter(Boolean).map((item) => `\u2022 ${item.trim()}`).join("\n")}` : ""
        ])
      },
      {
        key: "recommendations",
        title: "5. Rekomendasi",
        body: joinParagraphs([
          `Rekomendasi Utama
${recommendations.length > 0 ? bulletList(
            recommendations.map((item) => `${item.title}${item.description ? ` - ${item.description}` : ""}`)
          ) : recommendationsBody || "-"}`,
          `Arah Implementasi
Program pelatihan perlu dirancang agar langsung menjawab gap kompetensi, sesuai konteks peserta ${text(payload.program_title) || "yang menjadi sasaran"} dan kebutuhan implementasi di wilayah ${regionLabel || "-"}.`
        ])
      },
      {
        key: "conclusion",
        title: "6. Kesimpulan",
        body: text(payload.conclusion) || "-"
      }
    ],
    methodology: methodsUsed,
    findings,
    recommendations,
    signOff: {
      preparedBy: text(signOff.prepared_by),
      city: text(signOff.city),
      date: text(signOff.date)
    }
  };
}
function buildBukti2EditorialViewModel(payload) {
  const organizationProfile = isRecord(payload.organization_profile) ? payload.organization_profile : {};
  const programIdentity = isRecord(payload.program_identity) ? payload.program_identity : {};
  const targetRoleAnalysis = isRecord(payload.target_role_analysis) ? payload.target_role_analysis : {};
  const competencyNeedsAnalysis = isRecord(payload.competency_needs_analysis) ? payload.competency_needs_analysis : {};
  const signOff = isRecord(payload.sign_off) ? payload.sign_off : {};
  const mainTasks = Array.isArray(targetRoleAnalysis.main_tasks) ? targetRoleAnalysis.main_tasks.map((item) => text(item)).filter(Boolean) : [];
  const performanceStandards = Array.isArray(targetRoleAnalysis.performance_standards) ? targetRoleAnalysis.performance_standards.map((item) => text(item)).filter(Boolean) : [];
  const keyGapFindings = Array.isArray(competencyNeedsAnalysis.key_gap_findings) ? competencyNeedsAnalysis.key_gap_findings.map((item) => text(item)).filter(Boolean) : [];
  const priorityCompetencies = Array.isArray(competencyNeedsAnalysis.priority_competencies) ? competencyNeedsAnalysis.priority_competencies.map((item) => text(item)).filter(Boolean) : [];
  const recommendations = Array.isArray(payload.training_recommendations) ? payload.training_recommendations.filter(isRecord).map((item) => ({
    title: text(item.title, "Rekomendasi"),
    description: text(item.description)
  })) : [];
  const trainingUnits = Array.isArray(payload.training_unit_recommendations) ? payload.training_unit_recommendations.filter(isRecord).map((item) => ({
    unitCode: text(item.unit_code),
    unitTitle: text(item.unit_title, "Unit Kompetensi"),
    reason: text(item.reason)
  })) : [];
  const assessmentRows = Array.isArray(competencyNeedsAnalysis.assessment_rows) ? competencyNeedsAnalysis.assessment_rows.filter(isRecord).map((item, index) => ({
    indicator: text(item.indicator, "-"),
    scoreAverage: formatBukti2FallbackScore(index, item.score_average),
    gapNote: text(item.gap_note)
  })) : [];
  return {
    variant: "bukti-2-editorial",
    header: {
      eyebrow: "AI for Master \xB7 Bukti 2",
      title: text(payload.document_title, "TRAINING NEED ANALYSIS"),
      subtitle: text(payload.document_subtitle, "TNA MIKRO"),
      roleTitle: text(targetRoleAnalysis.role_title, "Peran Sasaran"),
      roleSummary: joinSentences([
        text(targetRoleAnalysis.role_description),
        text(programIdentity.core_problem)
      ])
    },
    organizationMeta: [
      { label: "Organisasi", value: text(organizationProfile.organization_name) },
      { label: "Sektor", value: text(organizationProfile.sector) }
    ],
    programMeta: [
      { label: "Program", value: text(programIdentity.program_name) },
      { label: "Peserta Sasaran", value: text(programIdentity.target_participants) },
      { label: "Fokus Kompetensi", value: text(programIdentity.competency_focus) }
    ],
    targetRole: {
      mainFunction: text(targetRoleAnalysis.main_function),
      mainTasks,
      performanceStandards
    },
    competencySummary: text(competencyNeedsAnalysis.analysis_summary),
    assessmentMeta: [
      { label: "Metode Assessment", value: text(competencyNeedsAnalysis.assessment_method) || normalizeCell(competencyNeedsAnalysis.assessment_methods) },
      { label: "Skala Penilaian", value: text(competencyNeedsAnalysis.assessment_scale) }
    ],
    assessmentRows,
    keyGapFindings,
    priorityCompetencies,
    recommendations,
    trainingUnits,
    conclusion: text(payload.conclusion),
    signOff: {
      preparedBy: text(signOff.prepared_by),
      city: text(signOff.city),
      date: text(signOff.date)
    }
  };
}
function buildBukti3CompetencyMapViewModel(payload) {
  const rows = Array.isArray(payload.rows) ? payload.rows.filter(isRecord).map((item) => ({
    tujuanUtama: text(item.tujuan_utama),
    fungsiKunci: text(item.fungsi_kunci),
    fungsiUtama: text(item.fungsi_utama),
    fungsiDasar: text(item.fungsi_dasar)
  })) : [];
  return {
    variant: "bukti-3-competency-map",
    title: text(payload.document_title, "PEMETAAN KOMPETENSI"),
    rows: rows.length > 0 ? rows : [
      {
        tujuanUtama: "-",
        fungsiKunci: "-",
        fungsiUtama: "-",
        fungsiDasar: "-"
      }
    ],
    signOff: {
      city: text(payload.document_city),
      date: text(payload.document_date),
      preparedBy: text(payload.prepared_by)
    }
  };
}
function buildBukti4UnitViewModel(payload) {
  const signOff = isRecord(payload.sign_off) ? payload.sign_off : {};
  const variableConstraintsRecord = isRecord(payload.variable_constraints) ? payload.variable_constraints : {};
  const variableContext = isRecord(variableConstraintsRecord.context) ? variableConstraintsRecord.context : {};
  const rawVariableList = [
    ...Array.isArray(variableContext.explanatory_notes) ? variableContext.explanatory_notes : [],
    ...Array.isArray(payload.variable_constraints) ? payload.variable_constraints : []
  ].map((item) => normalizeCell(item)).filter((item) => item !== "-");
  const selfManagementSource = normalizeCell(Array.isArray(variableContext.definitions) ? variableContext.definitions[0] : "") || rawVariableList.find((item) => item.includes("meliputi:")) || "";
  const selfManagementItems = selfManagementSource ? selfManagementSource.split(":").slice(1).join(":").split(";").map((item) => item.trim()).filter(Boolean).map((item) => item.replace(/[.;]+$/g, "").trim()) : [];
  const scope = normalizeCell(Array.isArray(variableContext.scope) ? variableContext.scope[0] : "") || rawVariableList[0] || "-";
  const normalizedEquipment = Array.isArray(payload.tools_equipment) ? payload.tools_equipment.map((item) => normalizeCell(item)).filter((item) => item !== "-") : Array.isArray(variableConstraintsRecord.equipment) ? variableConstraintsRecord.equipment.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [];
  const explicitMaterials = Array.isArray(payload.materials) ? payload.materials.map((item) => normalizeCell(item)).filter((item) => item !== "-") : Array.isArray(variableConstraintsRecord.materials) ? variableConstraintsRecord.materials.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [];
  const normalizedMaterials = explicitMaterials.length > 0 ? explicitMaterials : normalizedEquipment.filter((item) => /^Formulir /i.test(item));
  const normalizedTools = explicitMaterials.length > 0 ? normalizedEquipment : normalizedEquipment.filter((item) => !/^Formulir /i.test(item));
  const normalizedNorms = Array.isArray(payload.norms_standards) ? payload.norms_standards.map((item) => normalizeCell(item)).filter((item) => item !== "-") : Array.isArray(variableConstraintsRecord.norms_and_standards) ? variableConstraintsRecord.norms_and_standards.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [];
  const standards = normalizedNorms.filter((item) => /SOP|Standard Operating Procedure/i.test(item));
  const norms = normalizedNorms.filter((item) => !standards.includes(item));
  const assessmentContext = Array.isArray(payload.assessment_context) ? payload.assessment_context.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [];
  const competencyRequirements = Array.isArray(payload.competency_requirements) ? payload.competency_requirements.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [];
  const additionalNotes = rawVariableList.filter((item) => item !== scope && item !== selfManagementSource);
  return {
    variant: "bukti-4-unit",
    title: "C. Uraian Unit Kompetensi",
    meta: [
      { label: "KODE UNIT", value: text(payload.unit_code, "-") },
      { label: "JUDUL UNIT", value: text(payload.unit_title, "-") },
      { label: "DESKRIPSI UNIT", value: text(payload.unit_description, "-") }
    ],
    elements: (Array.isArray(payload.elements) ? payload.elements : []).filter(isRecord).map((element, index) => ({
      number: normalizeCell(element.element_number ?? index + 1),
      title: text(element.element_title, "-"),
      criteria: (Array.isArray(element.performance_criteria) ? element.performance_criteria : []).filter(isRecord).map((criterion, criterionIndex) => ({
        code: normalizeBukti4CriterionCode(criterion.code, `${index + 1}.${criterionIndex + 1}`),
        description: text(criterion.description, "-")
      }))
    })),
    variableContext: {
      scope,
      selfManagementItems,
      additionalNotes
    },
    toolsEquipment: {
      tools: normalizedTools,
      supplies: normalizedMaterials
    },
    regulations: Array.isArray(payload.regulations) ? payload.regulations.map((item) => normalizeCell(item)).filter((item) => item !== "-") : Array.isArray(variableConstraintsRecord.regulations) ? variableConstraintsRecord.regulations.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [],
    normsStandards: {
      norms: norms.length > 0 ? norms : ["Norma-norma kerja yang berlaku di tempat kerja"],
      standards: standards.length > 0 ? standards : ["Standard Operating Procedure (SOP) yang berlaku di tempat kerja"]
    },
    assessmentGuide: {
      context: assessmentContext,
      competencyRequirements,
      knowledge: Array.isArray(payload.required_knowledge) ? payload.required_knowledge.map((item) => normalizeBukti4ListEntry(item)).filter((item) => item !== "-") : [],
      skills: Array.isArray(payload.required_skills) ? payload.required_skills.map((item) => normalizeBukti4ListEntry(item)).filter((item) => item !== "-") : [],
      workAttitude: Array.isArray(payload.work_attitudes) ? payload.work_attitudes.map((item) => normalizeCell(item)).filter((item) => item !== "-") : [],
      criticalAspects: Array.isArray(payload.critical_aspects) ? payload.critical_aspects.map((item) => normalizeCell(item)).filter((item) => item !== "-") : []
    },
    signOff: {
      city: text(signOff.city, "-"),
      date: text(signOff.date, "-"),
      preparedBy: text(signOff.prepared_by, "-")
    }
  };
}
function buildBukti6EditorialViewModel(payload) {
  const programIdentity = isRecord(payload.program_identity) ? payload.program_identity : {};
  const marketAnalysis = isRecord(payload.market_analysis) ? payload.market_analysis : {};
  const valueProposition = isRecord(payload.value_proposition) ? payload.value_proposition : {};
  const marketingStrategy = isRecord(payload.marketing_strategy) ? payload.marketing_strategy : {};
  const signOff = isRecord(payload.sign_off) ? payload.sign_off : {};
  const objectives = Array.isArray(payload.marketing_objectives) ? payload.marketing_objectives.filter(isRecord).map((item) => `${text(item.objective, "Objective")} - ${text(item.target_metric)} (${text(item.timeframe)})`) : [];
  const segments = Array.isArray(payload.market_segments) ? payload.market_segments.filter(isRecord).map((item) => `${text(item.segment_name, "Segmen")} - ${text(item.description)}${text(item.needs) ? ` | Kebutuhan: ${text(item.needs)}` : ""}`) : [];
  const competitors = Array.isArray(payload.competitor_analysis) ? payload.competitor_analysis.filter(isRecord).map((item) => `${text(item.competitor_name, "Kompetitor")} - Kekuatan: ${text(item.strengths)} | Kelemahan: ${text(item.weaknesses)} | Gap: ${text(item.positioning_gap)}`) : [];
  const differentiators = Array.isArray(valueProposition.key_differentiators) ? valueProposition.key_differentiators.map((item) => normalizeCell(item)) : [];
  const budgets = Array.isArray(payload.budget_breakdown) ? payload.budget_breakdown.filter(isRecord).map((item) => `${text(item.item, "Item")} - ${normalizeCell(item.amount_idr)}${text(item.description) ? ` | ${text(item.description)}` : ""}`) : [];
  const timeline = Array.isArray(payload.timeline) ? payload.timeline.filter(isRecord).map((item) => `${text(item.phase, "Fase")} - ${text(item.activity)} (${text(item.period)})`) : [];
  const kpiItems = Array.isArray(payload.kpi) ? payload.kpi.filter(isRecord).map((item) => `${text(item.name, "KPI")} - Target: ${text(item.target)} | Measurement: ${text(item.measurement)}`) : [];
  return {
    variant: "bukti-6-editorial",
    header: {
      eyebrow: "AI for Master \xB7 Bukti 6",
      title: text(payload.document_title, "MARKETING PLAN"),
      subtitle: text(programIdentity.training_name),
      heroTitle: text(programIdentity.program_name, "Program Pelatihan"),
      heroSummary: text(payload.executive_summary, "-")
    },
    meta: [
      { label: "Lembaga", value: text(programIdentity.organization_name) },
      { label: "Kota", value: text(programIdentity.organization_city) },
      { label: "Sektor", value: text(programIdentity.sector) },
      { label: "Peserta Sasaran", value: text(programIdentity.target_participants) },
      { label: "Metode", value: text(programIdentity.delivery_method) },
      { label: "Durasi", value: text(programIdentity.duration) }
    ],
    highlights: [
      { label: "Main Value", value: text(valueProposition.main_value) },
      { label: "Problem Context", value: text(marketAnalysis.problem_context) },
      { label: "Objective Utama", value: objectives[0] ?? "-" }
    ],
    sections: [
      {
        key: "program-executive-summary",
        title: "1. Program Identity & Executive Summary",
        body: joinParagraphs([
          `Program Identity
${[
            `Program: ${text(programIdentity.program_name) || "-"}`,
            `Training: ${text(programIdentity.training_name) || "-"}`,
            `Lembaga: ${text(programIdentity.organization_name) || "-"}`,
            `Sektor: ${text(programIdentity.sector) || "-"}`,
            `Peserta: ${text(programIdentity.target_participants) || "-"}`
          ].join("\n")}`,
          `Executive Summary
${text(payload.executive_summary) || "-"}`
        ])
      },
      {
        key: "objectives-market-analysis",
        title: "2. Marketing Objectives & Market Analysis",
        body: joinParagraphs([
          `Marketing Objectives
${bulletList(objectives) || "-"}`,
          `Market Analysis
Kondisi Saat Ini: ${text(marketAnalysis.current_market_condition) || "-"}
Target Market: ${text(marketAnalysis.target_market_overview) || "-"}
Problem Context: ${text(marketAnalysis.problem_context) || "-"}
Opportunity Analysis: ${text(marketAnalysis.opportunity_analysis) || "-"}`
        ])
      },
      {
        key: "segments-competitors",
        title: "3. Market Segments & Competitor Analysis",
        body: joinParagraphs([
          `Market Segments
${bulletList(segments) || "-"}`,
          `Competitor Analysis
${bulletList(competitors) || "-"}`
        ])
      },
      {
        key: "value-strategy",
        title: "4. Value Proposition & Marketing Strategy",
        body: joinParagraphs([
          `Value Proposition
Main Value: ${text(valueProposition.main_value) || "-"}
Differentiators:
${bulletList(differentiators) || "-"}`,
          `Marketing Strategy
Product Strategy: ${text(marketingStrategy.product_strategy) || "-"}
Pricing Strategy: ${text(marketingStrategy.pricing_strategy) || "-"}
Promotion Strategy: ${text(marketingStrategy.promotion_strategy) || "-"}
Distribution Strategy: ${text(marketingStrategy.distribution_strategy) || "-"}
Communication Strategy: ${text(marketingStrategy.communication_strategy) || "-"}`
        ])
      },
      {
        key: "budget-timeline-kpi",
        title: "5. Budget Breakdown, Timeline & KPI",
        body: joinParagraphs([
          `Budget Breakdown
${bulletList(budgets) || "-"}`,
          `Timeline
${bulletList(timeline) || "-"}`,
          `KPI
${bulletList(kpiItems) || "-"}`
        ])
      },
      {
        key: "conclusion-signoff",
        title: "6. Conclusion",
        body: joinParagraphs([
          `Conclusion
${text(payload.conclusion) || "-"}`
        ])
      }
    ],
    signOff: {
      preparedBy: text(signOff.prepared_by),
      city: text(signOff.city),
      date: text(signOff.date)
    }
  };
}
function buildBukti5EvidenceViewModel(payload) {
  const programIdentity = isRecord(payload.program_identity) ? payload.program_identity : {};
  const evidences = Array.isArray(payload.evidence_images) ? payload.evidence_images.filter(isRecord).map((item) => ({
    title: text(item.title, "Evidence"),
    imageDataUri: text(item.dataUri || item.image_data_uri),
    objectPosition: text(item.objectPosition || item.object_position)
  })).filter((item) => item.imageDataUri) : [];
  return {
    variant: "bukti-5-evidence",
    title: text(payload.document_title, "BUKTI PELAKSANAAN KELAS"),
    subtitle: text(programIdentity.program_name, "Program Pelatihan"),
    evidences
  };
}
function buildBukti7EditorialViewModel(payload) {
  return {
    variant: "bukti-7-editorial",
    header: {
      eyebrow: "AI for Master \xB7 Bukti 7",
      title: text(payload.document_title, "PERJANJIAN KERJASAMA"),
      subtitle: text(payload.document_subtitle, "Draft PKS / MoU"),
      documentNumber: text(payload.document_number),
      agreementDate: text(payload.agreement_date),
      agreementLocation: text(payload.agreement_location)
    },
    parties: [
      toBukti7Party("PIHAK PERTAMA", payload.party_one),
      toBukti7Party("PIHAK KEDUA", payload.party_two)
    ],
    premisePoints: Array.isArray(payload.premise_points) ? payload.premise_points.map((item) => text(item)).filter(Boolean) : [],
    articles: buildBukti7ArticleEntries(payload),
    closingParagraph: text(payload.closing_paragraph)
  };
}
function buildBukti8EvaluationViewModel(payload) {
  const implementationInfo = isRecord(payload.implementation_info) ? payload.implementation_info : {};
  const methodology = isRecord(payload.methodology) ? payload.methodology : {};
  const chart = isRecord(payload.chart) ? payload.chart : {};
  const signOff = isRecord(payload.sign_off) ? payload.sign_off : {};
  const resultSections = Array.isArray(payload.result_sections) ? payload.result_sections.filter(isRecord).map((item, index) => ({
    title: normalizeBukti8ResultSectionTitle(text(item.title, "Hasil Evaluasi"), index),
    body: text(item.summary, "-")
  })) : [];
  return {
    variant: "bukti-8-evaluation",
    header: {
      eyebrow: "AI for Master \xB7 Bukti 8",
      title: text(payload.document_title, "LAPORAN EVALUASI PELATIHAN"),
      subtitle: text(payload.document_subtitle, "Evaluasi Pelatihan"),
      heroTitle: text(implementationInfo.training_name, "Program Pelatihan"),
      heroSummary: joinSentences([
        text(payload.evaluation_objective),
        text(payload.conclusion)
      ])
    },
    implementationInfo: [
      { label: "Nama Pelatihan", value: text(implementationInfo.training_name) },
      { label: "Tema", value: text(implementationInfo.theme) },
      { label: "Tanggal", value: normalizeCell(implementationInfo.date) },
      { label: "Lokasi", value: text(implementationInfo.location) },
      { label: "Penyelenggara", value: text(implementationInfo.organizer) },
      { label: "Trainer/Fasilitator", value: text(implementationInfo.trainer) },
      { label: "Jumlah Peserta", value: normalizeCell(implementationInfo.participant_count) },
      { label: "Jumlah Responden", value: normalizeCell(implementationInfo.respondent_count) }
    ],
    evaluationObjective: text(payload.evaluation_objective),
    methodologyMeta: [
      { label: "Metode", value: text(methodology.method) },
      { label: "Skala Penilaian", value: text(methodology.scale) },
      { label: "Waktu Pengambilan Data", value: text(methodology.data_collection_time) },
      { label: "Jumlah Responden", value: normalizeCell(methodology.respondent_count) }
    ],
    chart: {
      title: text(chart.title, "Grafik Kepuasan Peserta per Aspek"),
      scaleLabel: text(chart.scale_label, "Persentase kepuasan"),
      bars: Array.isArray(chart.bars) ? chart.bars.filter(isRecord).map((item) => ({
        label: text(item.label, "Aspek"),
        percentage: Number(item.percentage ?? 0),
        favorableCount: Number(item.favorable_count ?? 0)
      })) : []
    },
    resultSections,
    analysis: text(payload.analysis),
    conclusion: text(payload.conclusion),
    recommendations: Array.isArray(payload.recommendations) ? payload.recommendations.map((item) => text(item)).filter(Boolean) : [],
    signOff: {
      preparedBy: text(signOff.prepared_by),
      city: text(signOff.city),
      date: text(signOff.date)
    }
  };
}
function buildGenericMasterPayloadViewModel(documentType, payload) {
  const title = normalizeCell(payload.document_title || payload.document_type || documentType);
  const subtitle = normalizeCell(payload.document_subtitle || "");
  const meta = [];
  if (payload.document_type) {
    meta.push({ label: "Document Type", value: normalizeCell(payload.document_type) });
  }
  if (payload.document_number) {
    meta.push({ label: "Nomor Dokumen", value: normalizeCell(payload.document_number) });
  }
  if (payload.agreement_date || payload.document_date) {
    meta.push({
      label: "Tanggal",
      value: normalizeCell(payload.agreement_date || payload.document_date)
    });
  }
  if (payload.agreement_location) {
    meta.push({ label: "Lokasi", value: normalizeCell(payload.agreement_location) });
  }
  const sectionKeys = Object.keys(payload).filter(
    (key) => !["document_type", "document_title", "document_subtitle", "document_number", "agreement_date", "agreement_location"].includes(key)
  );
  const sections = sectionKeys.map((key) => ({
    key,
    title: formatLabel(key),
    blocks: buildBlocksFromValue(payload[key])
  }));
  return {
    variant: "generic",
    title,
    subtitle: subtitle === "-" ? "" : subtitle,
    meta,
    sections
  };
}
function buildMasterPayloadViewModel(documentType, payload) {
  if (documentType === "bukti-1") {
    return buildBukti1EditorialViewModel(payload);
  }
  if (documentType === "bukti-2") {
    return buildBukti2EditorialViewModel(payload);
  }
  if (documentType === "bukti-3") {
    return buildBukti3CompetencyMapViewModel(payload);
  }
  if (documentType === "bukti-6") {
    return buildBukti6EditorialViewModel(payload);
  }
  if (documentType === "bukti-7") {
    return buildBukti7EditorialViewModel(payload);
  }
  if (documentType === "bukti-4") {
    return buildBukti4UnitViewModel(payload);
  }
  if (documentType === "bukti-5") {
    return buildBukti5EvidenceViewModel(payload);
  }
  if (documentType === "bukti-8") {
    return buildBukti8EvaluationViewModel(payload);
  }
  return buildGenericMasterPayloadViewModel(documentType, payload);
}
function normalizeBukti4CriterionCode(value, fallback) {
  const raw = text(value, fallback);
  return raw.replace(/^KUK[-\s]*/i, "").trim() || fallback;
}
function normalizeBukti4ListEntry(value) {
  const normalized = normalizeCell(value);
  if (normalized === "-") {
    return normalized;
  }
  return normalized.replace(/^\d+(?:\.\d+)+\s+/, "").trim() || normalized;
}
function formatBukti2FallbackScore(index, rawScore) {
  const normalized = normalizeCell(rawScore);
  if (normalized !== "-") {
    return normalized;
  }
  const fallbackScore = Math.max(1.1, 1.5 - index * 0.1);
  return fallbackScore.toFixed(1).replace(/\.0$/, "");
}
export {
  buildMasterPayloadViewModel
};
