let menuIdCounter = 0
const nextMenuId = () => 'hmenu-' + ++menuIdCounter

// Menu untuk Peserta (Horizontal) - dynamic slug
export const getPesertaHorizontalMenu = (slug: string) => [
  { id: nextMenuId(), title: 'Home', icon: 'solar:home-smile-line-duotone', href: `/${slug}` },
  {
    id: nextMenuId(),
    title: 'Info Training',
    icon: 'solar:book-bookmark-line-duotone',
    href: `/${slug}/training`,
  },
  { id: nextMenuId(), title: 'Profil', icon: 'solar:user-id-line-duotone', href: `/${slug}/profile` },
  {
    id: nextMenuId(),
    title: 'Kelas',
    icon: 'solar:bookmark-square-minimalistic-line-duotone',
    href: `/${slug}/kelas`,
  },
  {
    id: nextMenuId(),
    title: 'Dokumen',
    icon: 'solar:folder-with-files-line-duotone',
    href: `/${slug}/dokumen`,
  },
  {
    id: nextMenuId(),
    title: 'AI Hub',
    icon: 'solar:magic-stick-3-line-duotone',
    href: `/${slug}/ai-hub`,
  },
  { id: nextMenuId(), title: 'Sertifikat', icon: 'solar:diploma-line-duotone', href: `/${slug}/sertifikat` },
]

// Static fallback
export const PesertaHorizontalMenu = getPesertaHorizontalMenu('_')

// Menu untuk Admin (Horizontal)
export const AdminHorizontalMenu = [
  { id: nextMenuId(), title: 'Home', icon: 'solar:home-2-line-duotone', href: '/admin/home' },
  {
    id: nextMenuId(),
    title: 'Kelola Batch',
    icon: 'solar:settings-minimalistic-line-duotone',
    href: '/admin/batches',
  },
  {
    id: nextMenuId(),
    title: 'Paket & Akses',
    icon: 'solar:widget-4-line-duotone',
    href: '/admin/tier-management',
  },
  {
    id: nextMenuId(),
    title: 'Kelas / Bonus',
    icon: 'solar:book-bookmark-line-duotone',
    href: '/admin/manage-kelas',
  },
  {
    id: nextMenuId(),
    title: 'Mentor',
    icon: 'solar:user-speak-rounded-line-duotone',
    href: '/admin/daftar-trainer',
  },
  { id: nextMenuId(), title: 'Settings', icon: 'solar:settings-line-duotone', href: '/admin/settings' },
]

// Default export
const Menuitems = PesertaHorizontalMenu
export default Menuitems
