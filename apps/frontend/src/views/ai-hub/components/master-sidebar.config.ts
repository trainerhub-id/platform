type MasterJson = Record<string, any>;

export type MasterSidebarFieldConfig = {
  key: string;
  label: string;
};

export type MasterSidebarSectionId =
  | 'organization'
  | 'program'
  | 'target'
  | 'delivery'
  | 'unit';

export type MasterSidebarSectionConfig = {
  id: MasterSidebarSectionId;
  label: string;
  source: 'brainstorming_master' | 'unit' | 'master_profile';
  readOnly: boolean;
  fields: MasterSidebarFieldConfig[];
  buildSummary: (masterJson: MasterJson) => string;
  buildAskAiPrompt?: () => string;
};

export const MASTER_SIDEBAR_SECTIONS: readonly MasterSidebarSectionConfig[] = [
  {
    id: 'organization',
    label: 'Informasi Lembaga',
    source: 'brainstorming_master',
    readOnly: false,
    fields: [
      { key: 'organization_name', label: 'Nama lembaga' },
      { key: 'organization_city', label: 'Kota lembaga' },
    ],
    buildSummary: (masterJson) =>
      masterJson?.master_profile?.organization?.name ||
      masterJson?.brainstorming_master?.organization_name ||
      'Belum lengkap',
    buildAskAiPrompt: () =>
      'Bantu saya lengkapi informasi lembaga pelatihan: nama lembaga dan kota lembaga.',
  },
  {
    id: 'program',
    label: 'Program Pelatihan',
    source: 'brainstorming_master',
    readOnly: false,
    fields: [
      { key: 'program_name', label: 'Nama program' },
      { key: 'program_goal', label: 'Tujuan utama pelatihan' },
    ],
    buildSummary: (masterJson) =>
      masterJson?.master_profile?.program?.name ||
      masterJson?.brainstorming_master?.program_name ||
      'Belum lengkap',
    buildAskAiPrompt: () =>
      'Bantu saya merumuskan nama program pelatihan dan tujuan utamanya untuk dokumen AI for Master.',
  },
  {
    id: 'target',
    label: 'Target & Masalah',
    source: 'brainstorming_master',
    readOnly: false,
    fields: [
      { key: 'target_participants', label: 'Target peserta' },
      { key: 'industry_problem', label: 'Masalah industri' },
    ],
    buildSummary: (masterJson) =>
      masterJson?.master_profile?.target_participants?.summary ||
      masterJson?.brainstorming_master?.target_participants ||
      'Belum lengkap',
    buildAskAiPrompt: () =>
      'Bantu saya melengkapi target peserta dan masalah industri utama yang ingin diselesaikan program ini.',
  },
  {
    id: 'delivery',
    label: 'Pelaksanaan',
    source: 'brainstorming_master',
    readOnly: false,
    fields: [
      { key: 'training_location', label: 'Lokasi pelatihan' },
      { key: 'training_duration', label: 'Durasi pelatihan' },
    ],
    buildSummary: (masterJson) =>
      masterJson?.master_profile?.program?.location ||
      masterJson?.brainstorming_master?.training_location ||
      'Belum lengkap',
    buildAskAiPrompt: () =>
      'Bantu saya melengkapi lokasi dan durasi pelatihan untuk program ini.',
  },
  {
    id: 'unit',
    label: 'Unit SKKNI',
    source: 'unit',
    readOnly: true,
    fields: [
      { key: 'code', label: 'Kode unit' },
      { key: 'name', label: 'Nama unit' },
    ],
    buildSummary: (masterJson) => masterJson?.unit?.code || 'Belum dipilih',
    buildAskAiPrompt: () =>
      'Bantu saya mencari atau mengganti unit kompetensi SKKNI yang paling relevan untuk program ini.',
  },
] as const;
