import { Icon } from '@iconify/react'
import { IconChevronDown } from '@tabler/icons-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from 'src/components/ui/menubar'
import { useUserRole } from 'src/hooks/useUserRole'
import { AdminHorizontalMenu, getPesertaHorizontalMenu } from '../MenuData'

const Navigation = () => {
  const location = useLocation()
  const pathname = location.pathname
  const { t } = useTranslation()
  const { role } = useUserRole()

  const slug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts[0] && parts[0] !== 'admin' && parts[0] !== 'auth' && parts[0] !== 'workspaces') {
      return parts[0]
    }
    return '_'
  }, [pathname])

  const Menuitems = useMemo(() => {
    return role === 'admin' ? AdminHorizontalMenu : getPesertaHorizontalMenu(slug)
  }, [role, slug])

  const isActive = (href: string) => pathname === href
  const hasChildren = (item: any) => Array.isArray(item.children) && item.children.length > 0

  return (
    <div className="py-4 xl:px-0 container mx-auto">
      <Menubar className="horizontal-nav p-0 h-auto min-h-0 border-0 shadow-none flex flex-wrap md:flex-nowrap bg-transparent dark:bg-transparent gap-3 z-50 px-0 rtl:flex-row-reverse rtl:text-end">
        {Menuitems.map((item) => {
          const menuItem = item as any
          const itemActive =
            isActive(menuItem.href ?? '') ||
            (hasChildren(menuItem) &&
              menuItem.children.some(
                (child: any) =>
                  isActive(child.href ?? '') ||
                  (child.children &&
                    child.children.some((grand: any) => isActive(grand.href ?? ''))),
              ))
          const isExternal = /^https?:\/\//.test(menuItem.href ?? '')

          return (
            <MenubarMenu key={menuItem.id}>
              {hasChildren(menuItem) ? (
                <>
                  {/* ==== PARENT WITH CHILDREN ==== */}
                  <MenubarTrigger
                    className={`capitalize font-medium flex gap-2 items-center py-2 px-3 rounded-md cursor-pointer transition-colors
                      ${
                        itemActive
                          ? 'text-white bg-primary'
                          : 'text-ld hover:bg-lightprimary hover:text-primary dark:hover:bg-lightprimary'
                      }`}
                  >
                    {menuItem.icon && <Icon icon={menuItem.icon} className="w-5 h-5 shrink-0 " />}
                    <span>{t(menuItem.title)} </span>
                    <IconChevronDown size={18} className="ms-auto" />
                  </MenubarTrigger>

                  {/* ==== CHILDREN ==== */}
                  <MenubarContent className="bg-card  dark:bg-dark shadow-lg min-w-[200px] p-2 rounded-md z-[999]">
                    {menuItem.children.map((child: any) => {
                      const childActive =
                        isActive(child.href) ||
                        (child.children && child.children.some((sub: any) => isActive(sub.href)))
                      const childExternal = /^https?:\/\//.test(child.href)

                      // ==== CHILD HAS SUBCHILDREN ====
                      if (hasChildren(child)) {
                        return (
                          <MenubarSub key={child.id}>
                            <MenubarSubTrigger
                              className={` group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors  group-hover:text-primary
                             
                                ${childActive ? 'text-primary font-semibold' : 'text-ld'}`}
                            >
                              {child.icon && (
                                <Icon
                                  icon={child.icon}
                                  className="w-5 h-5 shrink-0 transition-colors group-hover:text-primary"
                                />
                              )}
                              <span className="transition-colors group-hover:!text-primary">
                                {t(child.title)}
                              </span>
                            </MenubarSubTrigger>

                            {/* ==== GRANDCHILDREN ==== */}
                            <MenubarSubContent className="bg-card dark:bg-dark  min-w-[200px] p-2 rounded-md">
                              {child.children.map((sub: any) => {
                                const subActive = isActive(sub.href)
                                const subExternal = /^https?:\/\//.test(sub.href)

                                return (
                                  <MenubarItem
                                    key={sub.id}
                                    className={`group flex items-center gap-3  px-3 py-2  rounded-md cursor-pointer transition-colors
                                      focus:bg-transparent  dark:focus:bg-transparent
                                      ${subActive ? 'text-primary font-semibold' : 'text-ld '}`}
                                  >
                                    <Icon
                                      icon="icon-park-outline:dot"
                                      className=" text-ld transition-colors  group-hover:text-primary"
                                    />
                                    <Link
                                      to={sub.href}
                                      target={subExternal ? '_blank' : '_self'}
                                      className="flex items-center gap-2 w-full "
                                    >
                                      <span className="transition-colors  group-hover:text-primary">
                                        {t(sub.title)}
                                      </span>
                                    </Link>
                                  </MenubarItem>
                                )
                              })}
                            </MenubarSubContent>
                          </MenubarSub>
                        )
                      }

                      // ==== NORMAL CHILD ====
                      return (
                        <MenubarItem
                          key={child.id}
                          className={`group  flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors
                            focus:bg-transparent  dark:focus:bg-transparent
                            
                            ${childActive ? 'text-primary font-semibold' : 'text-ld'}`}
                        >
                          {child.icon && (
                            <Icon
                              icon={child.icon}
                              className="w-5 h-5 transition-colors  group-hover:text-primary"
                            />
                          )}
                          <Link
                            to={child.href}
                            target={childExternal ? '_blank' : '_self'}
                            className="flex items-center gap-2 w-full"
                          >
                            <span className="transition-colors group-hover:text-primary">
                              {t(child.title)}
                            </span>
                          </Link>
                        </MenubarItem>
                      )
                    })}
                  </MenubarContent>
                </>
              ) : (
                // ==== SIMPLE MENU ITEM ====
                <MenubarTrigger asChild>
                  <Link
                    to={menuItem.href || '#'}
                    target={isExternal ? '_blank' : '_self'}
                    className={`capitalize text-ld font-medium flex gap-2 items-center py-2 px-3 rounded-md cursor-pointer transition-colors
                      ${
                        itemActive
                          ? 'text-white bg-primary'
                          : 'text-ld hover:bg-lightprimary hover:text-primary dark:hover:bg-lightprimary'
                      }`}
                  >
                    {menuItem.icon && <Icon icon={menuItem.icon} className="w-5 h-5 shrink-0" />}
                    <span>{t(menuItem.title)}</span>
                  </Link>
                </MenubarTrigger>
              )}
            </MenubarMenu>
          )
        })}
      </Menubar>
    </div>
  )
}

export default Navigation
