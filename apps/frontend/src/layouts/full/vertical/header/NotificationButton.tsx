import { Icon } from '@iconify/react'

const NotificationButton = () => {
  return (
    <button
      type="button"
      className="flex size-10 items-center justify-center rounded-full text-darklink hover:bg-lightprimary hover:text-primary dark:text-white dark:hover:bg-darkminisidebar"
      aria-label="Notifications"
      disabled
    >
      <Icon icon="solar:bell-bing-line-duotone" width={20} height={20} />
    </button>
  )
}

export default NotificationButton
