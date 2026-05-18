import { Icon } from '@iconify/react'
import { useLocation, useNavigate } from 'react-router'
import { UserAvatar } from 'src/components/avatar'
import { Badge } from 'src/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu'
import { useAuthActions, useUser } from 'src/lib/better-auth'
import * as profileData from './Data'

const Profile = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()
  const location = useLocation()

  const userName = user?.fullName || user?.username || 'Peserta'
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'info@trainerhub.com'
  const isPro = false // logic for pro status if needed

  // Check if current path is an Admin path
  const isAdmin = location.pathname.startsWith('/admin')
  const menuItems = isAdmin ? profileData.adminProfileDD : profileData.profileDD

  // Extract slug from current path
  const slug = (() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts[0] && parts[0] !== 'admin' && parts[0] !== 'auth' && parts[0] !== 'workspaces') {
      return parts[0]
    }
    return ''
  })()

  const handleMenuClick = async (url: string) => {
    if (url === 'signout') {
      await signOut()
      navigate('/auth/login')
    } else if (url.startsWith('/') && !url.startsWith('/admin') && !url.startsWith('/auth') && slug) {
      navigate(`/${slug}${url}`)
    } else {
      navigate(url)
    }
  }

  return (
    <div className="relative">
      <DropdownMenu>
        {/* === Trigger === */}
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="h-10 w-10 hover:text-primary rounded-full flex justify-center items-center group-hover/menu:bg-lightprimary group-hover/menu:text-primary overflow-hidden">
              <UserAvatar
                userId={user?.id || 'guest'}
                size={35}
                alt={userName}
                className="rounded-full object-cover w-full h-full"
              />
            </span>
            <Icon
              icon="solar:alt-arrow-down-bold"
              className="hover:text-primary dark:text-primary group-hover/menu:text-primary"
              height={12}
            />
          </div>
        </DropdownMenuTrigger>

        {/* === Dropdown Content === */}
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-screen sm:w-[360px] pb-4 rounded-sm bg-white dark:bg-dark shadow-md dark:shadow-dark-md"
        >
          {/* === Header Section === */}
          <div className="px-6">
            <div className="flex items-center gap-6 pb-5 border-b border-border dark:border-darkborder mt-5 mb-3">
              <div className="overflow-hidden">
                <h5 className="text-base font-semibold truncate">
                  {userName} {isPro && <span className="text-success">Pro</span>}
                </h5>
                <p className="text-sm text-ld font-medium opacity-60 truncate">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* === Menu Items === */}
          {menuItems.map((items) => (
            <div key={items.title} className="px-6 mb-2">
              <DropdownMenuItem
                className="px-3 py-2 flex justify-between items-center bg-hover group/link w-full rounded-md cursor-pointer focus:bg-hover focus:text-primary"
                onClick={() => handleMenuClick(items.url)}
              >
                <div className="flex gap-3 w-full">
                  <h5 className="text-sm font-normal group-hover/link:text-primary">
                    {items.title}
                  </h5>
                </div>
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
