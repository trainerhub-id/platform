export interface ChildItem {
  id?: number | string
  name?: string
  icon?: any
  children?: ChildItem[]
  item?: any
  url?: any
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  badgeContent?: string
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: any
  id?: number
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: any
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
}

let menuIdCounter = 0
const nextMenuId = () => 'menu-' + ++menuIdCounter

// Menu untuk Peserta (dynamic slug)
export const getPesertaMenuItems = (slug: string): MenuItem[] => [
  {
    id: 1,
    name: 'Menu Peserta',
    items: [
      {
        heading: '',
        children: [
          {
            name: 'Home',
            icon: 'solar:home-smile-line-duotone',
            id: nextMenuId(),
            url: `/${slug}`,
          },
          {
            name: 'Info Training',
            icon: 'solar:book-bookmark-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/training`,
          },
          {
            name: 'Profil',
            icon: 'solar:user-id-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/profile`,
          },
          {
            name: 'Kelas',
            icon: 'solar:bookmark-square-minimalistic-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/kelas`,
          },
          {
            name: 'Dokumen',
            icon: 'solar:folder-with-files-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/dokumen`,
          },
          {
            name: 'AI Hub',
            icon: 'solar:magic-stick-3-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/ai-hub`,
          },
          {
            name: 'Sertifikat',
            icon: 'solar:diploma-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/sertifikat`,
          },
        ],
      },
    ],
  },
]

// Static fallback (used when no slug available)
export const PesertaMenuItems: MenuItem[] = getPesertaMenuItems('_')

// Menu untuk Admin
export const AdminMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Menu Admin',
    items: [
      {
        heading: '',
        children: [
          {
            name: 'Home',
            icon: 'solar:home-2-line-duotone',
            id: nextMenuId(),
            url: '/admin/home',
          },
          {
            name: 'Kelola Batch',
            icon: 'solar:settings-minimalistic-line-duotone',
            id: nextMenuId(),
            url: '/admin/batches',
          },
          {
            name: 'Paket & Akses',
            icon: 'solar:widget-4-line-duotone',
            id: nextMenuId(),
            url: '/admin/tier-management',
          },
          {
            name: 'Kelas / Bonus',
            icon: 'solar:book-bookmark-line-duotone',
            id: nextMenuId(),
            url: '/admin/manage-kelas',
          },
          {
            name: 'Mentor',
            icon: 'solar:user-speak-rounded-line-duotone',
            id: nextMenuId(),
            url: '/admin/daftar-trainer',
          },
          {
            name: 'Settings',
            icon: 'solar:settings-line-duotone',
            id: nextMenuId(),
            url: '/admin/settings',
          },
        ],
      },
    ],
  },
]

// Menu untuk Trainer
export const getTrainerMenuItems = (slug: string): MenuItem[] => [
  {
    id: 1,
    name: 'Menu Trainer',
    items: [
      {
        heading: '',
        children: [
          {
            name: 'Home',
            icon: 'solar:home-smile-line-duotone',
            id: nextMenuId(),
            url: `/${slug}`,
          },
          {
            name: 'Dokumen',
            icon: 'solar:document-text-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/ai-hub/trainer-workspace`,
          },
          {
            name: 'AI Hub',
            icon: 'solar:magic-stick-3-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/ai-hub`,
          },
          {
            name: 'Profil',
            icon: 'solar:user-id-line-duotone',
            id: nextMenuId(),
            url: `/${slug}/profile`,
          },
        ],
      },
    ],
  },
]

export const TrainerMenuItems: MenuItem[] = getTrainerMenuItems('_')

// Default export untuk backward compatibility
const SidebarContent: MenuItem[] = PesertaMenuItems

export default SidebarContent
