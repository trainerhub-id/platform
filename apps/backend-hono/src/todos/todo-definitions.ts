export type TodoDefinition = {
  key: string
  title: string
  description: string
  category: 'Pra-Training' | 'Training' | 'Pasca-Training' | 'Sertifikat' | 'Admin'
  role: 'participant' | 'admin'
  ctaLabel: string
  ctaTarget: string
  isBlocking?: boolean
}

export const TODO_DEFINITIONS: Record<string, TodoDefinition> = {
  lakukan_pembayaran: {
    key: 'lakukan_pembayaran',
    title: 'Lakukan Pembayaran',
    description: 'Selesaikan pembayaran agar akses training kamu aktif.',
    category: 'Pra-Training',
    role: 'participant',
    ctaLabel: 'Lihat Pembayaran',
    ctaTarget: '/user/training/info',
    isBlocking: true,
  },
  selesaikan_kelas: {
    key: 'selesaikan_kelas',
    title: 'Selesaikan Kelas',
    description: 'Tonton materi kelas dan selesaikan progres belajar kamu.',
    category: 'Training',
    role: 'participant',
    ctaLabel: 'Buka Kelas',
    ctaTarget: '/user/kelas',
  },
  check_in_kehadiran: {
    key: 'check_in_kehadiran',
    title: 'Check-in Kehadiran',
    description: 'Konfirmasi kehadiran saat training berlangsung.',
    category: 'Training',
    role: 'participant',
    ctaLabel: 'Check-in',
    ctaTarget: '/user/training/info',
  },
  upload_dokumen: {
    key: 'upload_dokumen',
    title: 'Upload Dokumen',
    description: 'Upload dokumen yang dibutuhkan untuk proses sertifikasi.',
    category: 'Pasca-Training',
    role: 'participant',
    ctaLabel: 'Upload Dokumen',
    ctaTarget: '/user/dokumen',
    isBlocking: true,
  },
  coba_ai: {
    key: 'coba_ai',
    title: 'Coba AI for Trainer / AI for Master',
    description: 'Mulai gunakan AI untuk menyiapkan dokumen training kamu.',
    category: 'Pasca-Training',
    role: 'participant',
    ctaLabel: 'Buka AI',
    ctaTarget: '/user/ai-generator',
  },
}
