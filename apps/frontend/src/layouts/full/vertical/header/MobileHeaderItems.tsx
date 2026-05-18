import { Icon } from '@iconify/react'
import { useContext } from 'react'
import { CustomizerContext } from 'src/context/CustomizerContext'
import NotificationButton from './NotificationButton'
import Profile from './Profile'

const MobileHeaderItems = () => {
  const { setActiveMode, activeMode } = useContext(CustomizerContext)
  const toggleMode = () => {
    setActiveMode((prevMode: string) => (prevMode === 'light' ? 'dark' : 'light'))
  }
  return (
    <nav className="flex h-14 items-center justify-center rounded-none bg-white px-4 dark:bg-darkgray">
      {/* Toggle Icon   */}

      <div className="block w-full xl:hidden">
        <div className="flex h-14 items-center justify-center gap-4">
          {/* Theme Toggle */}
          {activeMode === 'light' ? (
            <button
              type="button"
              className="group flex size-11 shrink-0 items-center justify-center rounded-full text-link hover:bg-lightprimary hover:text-primary focus:ring-0 dark:text-darklink dark:hover:text-primary"
              onClick={toggleMode}
              aria-label="Switch to dark mode"
            >
              <span className="flex items-center justify-center text-darklink dark:text-white">
                <Icon icon="solar:moon-line-duotone" width={20} height={20} />
              </span>
            </button>
          ) : (
            // Dark Mode Button
            <button
              type="button"
              className="group flex size-11 shrink-0 items-center justify-center rounded-full text-link hover:bg-lightprimary hover:text-primary focus:ring-0 dark:text-darklink dark:hover:text-primary"
              onClick={toggleMode}
              aria-label="Switch to light mode"
            >
              <span className="flex items-center justify-center text-darklink dark:text-white">
                <Icon
                  icon="solar:sun-bold-duotone"
                  width={20}
                  height={20}
                  className="group-hover:text-primary"
                />
              </span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="flex size-11 shrink-0 items-center justify-center">
            <NotificationButton />
          </div>

          {/* App Link Dropwown   */}
          {/* <AppLinks /> */}

          {/* Language Dropdown*/}
          {/* <Language /> */}

          {/* Profile Dropdown */}
          <div className="flex h-11 shrink-0 items-center justify-center">
            <Profile />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default MobileHeaderItems
