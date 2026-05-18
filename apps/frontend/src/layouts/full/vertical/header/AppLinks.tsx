import { Icon } from '@iconify/react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useState } from 'react'
import { Link } from 'react-router'
import SimpleBar from 'simplebar-react'
import { Sheet, SheetClose, SheetContent, SheetTitle } from 'src/components/ui/sheet'
import MegamenuImg from '/src/assets/images/backgrounds/mega-dd-bg.jpg'
import * as AppsData from './Data'

const AppLinks = () => {
  const [isOpen, setIsOpen] = useState(false)
  const handleClose = () => setIsOpen(false)

  return (
    <div className="relative group">
      {/* Desktop Icon */}
      <span className="h-10 w-10 text-darklink dark:text-white text-sm hover:text-primary hover:bg-lightprimary dark:hover:text-primary dark:hover:bg-darkminisidebar rounded-full flex justify-center items-center cursor-pointer group-hover:bg-lightprimary group-hover:text-primary xl:flex hidden">
        <Icon icon="solar:widget-3-line-duotone" height={20} />
      </span>

      {/* Mobile Icon (Sheet trigger) */}
      <span
        className="xl:hidden block h-10 w-10 text-darklink dark:text-white hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover:bg-lightprimary group-hover:text-primary"
        onClick={() => setIsOpen(true)}
      >
        <Icon icon="solar:widget-3-line-duotone" height={20} />
      </span>

      {/* --- DESKTOP HOVER DROPDOWN --- */}
      <div className="hidden xl:block sm:w-[860px] w-screen dropdown invisible group-hover:visible absolute z-10 bg-white dark:bg-darkgray shadow-lg rounded-md">
        <SimpleBar className="max-h-[500px]">
          <div className="grid grid-cols-12 w-full">
            <div className="xl:col-span-8 col-span-12 flex items-stretch p-6">
              <div className="grid grid-cols-12 gap-3 w-full">
                {AppsData.appsLink.map((links, index) => (
                  <div className="col-span-12 xl:col-span-6" key={index}>
                    <Link
                      to={links.href}
                      className="flex gap-3 hover:text-primary group relative items-center"
                    >
                      <span
                        className={`h-12 w-12 flex justify-center items-center rounded-tw ${links.iconbg}`}
                      >
                        <Icon icon={links.icon} height={24} className={`${links.iconcolor}`} />
                      </span>
                      <div>
                        <h6 className="font-semibold text-15 text-ld hover:text-primary">
                          {links.title}
                        </h6>
                        <p className="text-13 text-bodytext">{links.subtext}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="xl:col-span-4 col-span-12 flex items-strech h-[300px]">
              <img
                src={MegamenuImg}
                alt="image"
                className="h-full w-full object-cover rounded-r-md"
                width={300}
                height={300}
              />
            </div>
          </div>
        </SimpleBar>
      </div>

      {/* --- MOBILE SHEET (Right Sidebar) --- */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="p-0 w-64 sm:w-80 h-screen max-h-screen bg-background shadow-lg"
        >
          <VisuallyHidden>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden>
          <SimpleBar className="h-[calc(100vh-50px)]">
            <div className="grid grid-cols-12 w-full">
              <div className="col-span-12 flex items-stretch p-6">
                <div className="grid grid-cols-12 gap-3 w-full">
                  {AppsData.appsLink.map((links, index) => (
                    <div className="col-span-12" key={index}>
                      <Link
                        to={links.href}
                        className="flex gap-3 hover:text-primary group relative items-center"
                      >
                        <span
                          className={`h-12 w-12 flex justify-center items-center rounded-tw ${links.iconbg}`}
                        >
                          <Icon icon={links.icon} height={24} className={`${links.iconcolor}`} />
                        </span>
                        <div>
                          <h6 className="font-semibold text-15 text-ld hover:text-primary">
                            {links.title}
                          </h6>
                          <p className="text-13 text-bodytext">{links.subtext}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SimpleBar>

          {/* Close button */}
          <SheetClose asChild>
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-muted-foreground hover:text-primary"
            >
              <Icon icon="mdi:close" height={22} />
            </button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default AppLinks
