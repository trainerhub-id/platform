export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
}

let menuIdCounter = 0;
const nextMenuId = () => "menu-" + ++menuIdCounter;

// Menu untuk Peserta
export const PesertaMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Menu Peserta",
    items: [
      {
        heading: "",
        children: [
          {
            name: "Home",
            icon: "solar:home-smile-line-duotone",
            id: nextMenuId(),
            url: "/user/home",
          },
          {
            name: "Info Training",
            icon: "solar:book-bookmark-line-duotone",
            id: nextMenuId(),
            url: "/user/training/info",
          },
          {
            name: "Profil",
            icon: "solar:user-id-line-duotone",
            id: nextMenuId(),
            url: "/user/profile",
          },
          {
            name: "Kelas",
            icon: "solar:bookmark-square-minimalistic-line-duotone",
            id: nextMenuId(),
            url: "/user/kelas",
          },
          {
            name: "Dokumen",
            icon: "solar:folder-with-files-line-duotone",
            id: nextMenuId(),
            url: "/user/dokumen",
          },
          // {
          //   name: "Generator Dokumen",
          //   icon: "solar:document-text-line-duotone",
          //   id: nextMenuId(),
          //   url: "/user/documents",
          // },
          {
            name: "AI Rebuild",
            icon: "solar:magic-stick-3-line-duotone",
            id: nextMenuId(),
            url: "/user/ai-hub",
          },
          {
            name: "Sertifikat",
            icon: "solar:diploma-line-duotone",
            id: nextMenuId(),
            url: "/user/sertifikat",
          },
        ],
      },
    ]
  },
];

// Menu untuk Admin
export const AdminMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Menu Admin",
    items: [
      {
        heading: "",
        children: [
          {
            name: "Home",
            icon: "solar:home-2-line-duotone",
            id: nextMenuId(),
            url: "/admin/home",
          },
          {
            name: "Manage Training",
            icon: "solar:settings-minimalistic-line-duotone",
            id: nextMenuId(),
            url: "/admin/manage-training",
          },
          {
            name: "Tier Management",
            icon: "solar:widget-4-line-duotone",
            id: nextMenuId(),
            url: "/admin/tier-management",
          },
          {
            name: "Daftar Peserta",
            icon: "solar:users-group-rounded-line-duotone",
            id: nextMenuId(),
            url: "/admin/daftar-peserta",
          },
          {
            name: "Daftar Trainer",
            icon: "solar:user-speak-rounded-line-duotone",
            id: nextMenuId(),
            url: "/admin/daftar-trainer",
          },
          {
            name: "Manage Kelas",
            icon: "solar:book-bookmark-line-duotone",
            id: nextMenuId(),
            url: "/admin/manage-kelas",
          },
          {
            name: "Settings",
            icon: "solar:settings-line-duotone",
            id: nextMenuId(),
            url: "/admin/settings",
          },
        ],
      },
    ],
  },
];

// Menu untuk Trainer
export const TrainerMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Menu Trainer",
    items: [
      {
        heading: "",
        children: [
          {
            name: "Home",
            icon: "solar:home-smile-line-duotone",
            id: nextMenuId(),
            url: "/user/home",
          },
          {
            name: "Dokumen",
            icon: "solar:document-text-line-duotone",
            id: nextMenuId(),
            url: "/trainer/documents",
          },
          {
            name: "AI Rebuild",
            icon: "solar:magic-stick-3-line-duotone",
            id: nextMenuId(),
            url: "/user/ai-hub",
          },
          {
            name: "Profil",
            icon: "solar:user-id-line-duotone",
            id: nextMenuId(),
            url: "/user/profile",
          },
        ],
      },
    ]
  },
];

// Default export untuk backward compatibility
const SidebarContent: MenuItem[] = PesertaMenuItems;

export default SidebarContent;
