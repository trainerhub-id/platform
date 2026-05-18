import { Icon } from '@iconify/react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { HiOutlineChevronDown } from 'react-icons/hi'
import { useLocation } from 'react-router'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible'
import { twMerge } from 'tailwind-merge'
import NavItems from '../NavItems'
import { ChildItem } from '../Sidebaritems'

interface NavCollapseProps {
  item: ChildItem
}

const NavCollapse: React.FC<NavCollapseProps> = ({ item }: any) => {
  const location = useLocation()
  const pathname = location.pathname

  const activeDD = item.children.find((t: { url: string }) => t.url === pathname)
  const { t } = useTranslation()

  React.useEffect(() => {
    const activeDD = item.children.find((t: { url: string }) => t.url === pathname)
    if (activeDD) setOpen(true)
  }, [pathname, item.children])

  const [open, setOpen] = React.useState(!!activeDD)

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col">
        <CollapsibleTrigger asChild aria-controls={`nav-collapse-${item.name}`}>
          <button
            type="button"
            className={twMerge(
              '!text-[15px] flex w-full items-center justify-between gap-3 rounded-full px-4 py-2.5 mb-0.5 text-start truncate cursor-pointer  !leading-normal text-link dark:text-white font-normal collapse-menu transition-colors duration-150 ease-out',
              'hover:bg-lightprimary dark:hover:bg-darkprimary',
              'hover:text-primary dark:hover:text-primary',
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <Icon
                  icon={item.icon}
                  height={18}
                  className="transition-colors duration-200 hover:text-primary dark:hover:text-primary"
                />
              )}
              <span className="hover:text-primary dark:hover:text-primary ">{t(item.name)}</span>
            </div>

            <HiOutlineChevronDown
              aria-hidden
              className={twMerge(
                'transition-transform duration-200',
                open ? 'rotate-180' : 'rotate-0',
                'hover:text-primary dark:hover:text-primary',
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="flex flex-col pb-2 pl-1">
          {open
            ? item.children?.map((child: any) =>
                child.children ? (
                  <NavCollapse key={child.id} item={child} />
                ) : (
                  <NavItems key={child.id} item={child} isInsideCollapse />
                ),
              )
            : null}
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}

export default NavCollapse
