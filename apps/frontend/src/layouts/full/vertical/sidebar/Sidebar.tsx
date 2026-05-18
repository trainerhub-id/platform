'use client'

import { Icon } from '@iconify/react/dist/iconify.js'
import { useContext, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router'
import SimpleBar from 'simplebar-react'
import { useSidebar } from 'src/components/ui/sidebar'
import { CustomizerContext } from 'src/context/CustomizerContext'
import { useUserRole } from 'src/hooks/useUserRole'
import { WorkspaceSwitcher } from 'src/components/workspace/WorkspaceSwitcher'
import FullLogo from '../../shared/logo/FullLogo'
import LogoIcon from '../../shared/logo/LogoIcon'
import NavCollapse from './NavCollapse'
import NavItems from './NavItems'
import {
  AdminMenuItems,
  getPesertaMenuItems,
  getTrainerMenuItems,
} from './Sidebaritems'

const SidebarLayout = () => {
  const { setSelectedIconId, isCollapse, setIsCollapse } = useContext(CustomizerContext) || {}
  const { role } = useUserRole()
  const { setOpenMobile } = useSidebar()

  const location = useLocation()
  const pathname = location.pathname
  const isMiniSidebar = isCollapse === 'mini-sidebar'

  // Extract slug from URL (first path segment for peserta routes)
  const slug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts[0] && parts[0] !== 'admin' && parts[0] !== 'auth' && parts[0] !== 'workspaces') {
      return parts[0]
    }
    return '_'
  }, [pathname])

  // Select menu based on user role
  const SidebarContent = useMemo(() => {
    if (role === 'trainer') {
      return getTrainerMenuItems(slug)
    }
    return role === 'admin' ? AdminMenuItems : getPesertaMenuItems(slug)
  }, [role, slug])

  function findActiveUrl(narray: any, targetUrl: any) {
    for (const item of narray) {
      if (item.items) {
        for (const section of item.items) {
          if (section.children) {
            for (const child of section.children) {
              if (child.url === targetUrl) {
                return item.id
              }
            }
          }
        }
      }
    }
    return null
  }

  useEffect(() => {
    const result = findActiveUrl(SidebarContent, pathname)
    if (result) {
      setSelectedIconId(result)
    }
  }, [pathname, setSelectedIconId, SidebarContent])

  return (
    <div className="fixed z-[120] flex items-start">
      <div className="menu-sidebar pt-6 bg-gray-100 dark:bg-darkgray relative h-screen transition-all duration-300">
        {/* Toggle Button - Floating on the right edge */}
        <button
          onClick={() => {
            if (isMiniSidebar) {
              setIsCollapse('full-sidebar')
            } else {
              setIsCollapse('mini-sidebar')
            }
          }}
          className="sidebar-toggle-btn hidden xl:flex absolute -right-4 top-12 z-[130] h-8 w-8 bg-white dark:bg-dark shadow-md border border-gray-200 dark:border-gray-700 rounded-full justify-center items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-darkgray text-primary"
        >
          <Icon
            icon={
              isCollapse === 'full-sidebar'
                ? 'solar:alt-arrow-left-line-duotone'
                : 'solar:alt-arrow-right-line-duotone'
            }
            height={20}
          />
        </button>

        <div className="mb-7 px-4 brand-logo flex items-center justify-between">
          <div>
            <FullLogo />
            <LogoIcon />
          </div>

          {/* Close Button - Mobile only */}
          <button
            onClick={() => setOpenMobile(false)}
            className="xl:hidden h-8 w-8 bg-white dark:bg-dark rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-darkgray text-gray-600 dark:text-gray-300 focus:outline-none"
          >
            <Icon icon="solar:close-circle-line-duotone" height={24} />
          </button>
        </div>

        <SimpleBar className="h-[calc(100vh-100px)]">
          <div className="list-none ps-4 rtl:pe-4 rtl:ps-0 pe-4">
            {role !== 'admin' && (
              <div className="mb-6">
                <WorkspaceSwitcher placement="sidebar" collapsed={isMiniSidebar} />
              </div>
            )}

            {SidebarContent?.map((section) =>
              section.items?.map((item) => (
                <div className="mb-8" key={item.heading || section.id}>
                  {item.heading && (
                    <h5 className="text-link dark:text-white font-semibold text-sm mb-2">
                      <span className="hide-menu">{item.heading}</span>
                    </h5>
                  )}

                  {item.children?.map((child) =>
                    child.children ? (
                      <NavCollapse key={child.id} item={child} />
                    ) : (
                      <NavItems key={child.id} item={child} />
                    ),
                  )}
                </div>
              )),
            )}
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default SidebarLayout
