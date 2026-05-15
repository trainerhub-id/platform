
interface appsLinkType {
  href: string;
  title: string;
  subtext: string;
  icon: string;
  iconbg: string;
  iconcolor: string;
}

const appsLink: appsLinkType[] = [
  {
    href: "/apps/chats",
    title: "Chat Application",
    subtext: "New messages arrived",
    icon: "solar:chat-line-bold-duotone",
    iconbg: "bg-lightprimary",
    iconcolor: "text-primary",
  },
  {
    href: "/apps/ecommerce/shop",
    title: "eCommerce App",
    subtext: "New stock available",
    icon: "solar:widget-6-bold-duotone",
    iconbg: "bg-lightsecondary",
    iconcolor: "text-secondary",
  },
  {
    href: "/apps/notes",
    title: "Notes App",
    subtext: "To-do and Daily tasks",
    icon: "solar:notes-bold-duotone",
    iconbg: "bg-lightwarning",
    iconcolor: "text-warning",
  },
  {
    href: "/apps/calendar",
    title: "Calendar App",
    subtext: "Get dates",
    icon: "solar:calendar-bold-duotone",
    iconbg: "bg-lighterror",
    iconcolor: "text-error",
  },
  {
    href: "/apps/contacts",
    title: "Contact Application",
    subtext: "2 Unsaved Contacts",
    icon: "solar:phone-calling-rounded-bold-duotone",
    iconbg: "bg-lighterror",
    iconcolor: "text-error",
  },
  {
    href: "/apps/tickets",
    title: "Tickets App",
    subtext: "Submit tickets",
    icon: "solar:ticket-sale-bold-duotone",
    iconbg: "bg-lightprimary",
    iconcolor: "text-primary",
  },
  {
    href: "/apps/email",
    title: "Email App",
    subtext: "Get new emails",
    icon: "solar:letter-bold-duotone",
    iconbg: "bg-lightsuccess",
    iconcolor: "text-success",
  },
  {
    href: "/apps/blog/post",
    title: "Blog App",
    subtext: "added new blog",
    icon: "solar:chat-square-like-bold-duotone",
    iconbg: "bg-lightsecondary",
    iconcolor: "text-secondary",
  },
];
interface LinkType {
  href: string;
  title: string;
}

const pageLinks: LinkType[] = [
  {
    href: '/theme-pages/pricing',
    title: 'Pricing Page',
  },
  {
    href: '/auth/login',
    title: 'Authentication Design',
  },
  {
    href: '/auth/register',
    title: 'Register Now',
  },
  {
    href: '/404',
    title: '404 Error Page',
  },
  {
    href: '/apps/kanban',
    title: 'Kanban App',
  },
  {
    href: '/apps/user-profile/profile',
    title: 'User Application',
  },
  {
    href: '/apps/blog/post',
    title: 'Blog Design',
  },
  {
    href: '/apps/ecommerce/checkout',
    title: 'Shopping Cart',
  },
];

//   Search Data
interface SearchType {
  href: string;
  title: string;
}

const SearchLinks: SearchType[] = [
  {
    title: 'Modern',
    href: '/',
  },
  {
    title: 'eCommerce',
    href: '/dashboards/eCommerce',
  },
  {
    title: 'General',
    href: '/dashboards/general',
  },
  {
    title: 'Music',
    href: '/dashboards/music',
  },
  {
    title: 'General',
    href: '/dashboards/general',
  },
];

//   Message Data
interface MessageType {
  title: string;
  avatar: any;
  subtitle: string;
}

import avatar1 from 'src/assets/images/profile/user-2.jpg';
import avatar2 from 'src/assets/images/profile/user-3.jpg';
import avatar3 from 'src/assets/images/profile/user-4.jpg';
import avatar4 from 'src/assets/images/profile/user-5.jpg';
import avatar5 from 'src/assets/images/profile/user-6.jpg';

const MessagesLink: MessageType[] = [
  {
    avatar: avatar1,
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
  },
  {
    avatar: avatar2,
    title: 'New message',
    subtitle: 'Salma sent you new message',
  },
  {
    avatar: avatar3,
    title: 'Bianca sent payment',
    subtitle: 'Check your earnings',
  },
  {
    avatar: avatar4,
    title: 'Jolly completed tasks',
    subtitle: 'Assign her new tasks',
  },
  {
    avatar: avatar5,
    title: 'John received payment',
    subtitle: '$230 deducted from account',
  },
];

//   Notification Data
interface NotificationType {
  title: string;
  icon: any;
  subtitle: string;
  bgcolor: string;
  color: string;
  time: string;
}

const Notification: NotificationType[] = [
  {
    icon: "solar:widget-3-line-duotone",
    bgcolor: "bg-lighterror dark:bg-lighterror",
    color: 'text-error',
    title: "Launch Admin",
    subtitle: "Just see the my new admin!",
    time: "9:30 AM",
  },
  {
    icon: "solar:calendar-line-duotone",
    bgcolor: "bg-lightprimary dark:bg-lightprimary",
    color: 'text-primary',
    title: "Event Today",
    subtitle: "Just a reminder that you have event",
    time: "9:15 AM",
  },
  {
    icon: "solar:settings-line-duotone",
    bgcolor: "bg-lightsecondary dark:bg-lightsecondary",
    color: 'text-secondary',
    title: "Settings",
    subtitle: "You can customize this template as you want",
    time: "4:36 PM",
  },
  {
    icon: "solar:widget-4-line-duotone",
    bgcolor: "bg-lightwarning dark:bg-lightwarning ",
    color: 'text-warning',
    title: "Launch Admin",
    subtitle: "Just see the my new admin!",
    time: "9:30 AM",
  },
  {
    icon: "solar:calendar-line-duotone",
    bgcolor: "bg-lightprimary dark:bg-lightprimary",
    color: 'text-primary',
    title: "Event Today",
    subtitle: "Just a reminder that you have event",
    time: "9:15 AM",
  },
  {
    icon: "solar:settings-line-duotone",
    bgcolor: "bg-lightsecondary dark:bg-lightsecondary",
    color: 'text-secondary',
    title: "Settings",
    subtitle: "You can customize this template as you want",
    time: "4:36 PM",
  },
];

//  Profile Data
interface ProfileType {
  title: string;
  url: string;
}
const profileDD: ProfileType[] = [
  {
    title: "My Profile",
    url: "/user/profile",
  },
  {
    title: "Training Information",
    url: "/user/training/info",
  },
  {
    title: "Sign Out",
    url: "signout",
  },
];

const adminProfileDD: ProfileType[] = [
  {
    title: "Admin Dashboard",
    url: "/admin/home",
  },
  {
    title: "Manage Training",
    url: "/admin/manage-training",
  },
  {
    title: "Sign Out",
    url: "signout",
  },
];

export { appsLink, pageLinks, SearchLinks, MessagesLink, Notification, profileDD, adminProfileDD };
