import { Icon } from '@iconify/react'
import { Sidebar } from 'flowbite-react'
import SimpleBar from 'simplebar-react'
import FullLogo from '../../shared/logo/FullLogo'
import NavCollapse from './NavCollapse'
import NavItems from './NavItems'
import SidebarContent from './Sidebaritems'

const MobileSidebar = () => {
  return (
    <>
      <div className="flex">
        <Sidebar
          className="fixed menu-sidebar bg-white dark:bg-darkgray z-[10]"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="mb-7 px-4 brand-logo">
            <FullLogo />
          </div>

          <SimpleBar className="h-[calc(100vh-32px)] ">
            <div className="list-none ps-4 rtl:pe-4 rtl:ps-0 pe-4">
              {SidebarContent?.map((section) =>
                section.items?.map((item) => (
                  <div className="mb-4" key={item.heading}>
                    <h5 className="text-link dark:text-white font-semibold text-sm mb-2">
                      <span className="hide-menu">{item.heading}</span>
                    </h5>

                    <Icon
                      icon="solar:menu-dots-bold"
                      className="text-ld block mx-auto  leading-6 dark:text-opacity-60 hide-icon"
                      height={18}
                    />

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
        </Sidebar>
      </div>
    </>
  )
}

export default MobileSidebar
