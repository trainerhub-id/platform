import React, { useContext } from "react";
import { ChildItem } from "../Sidebaritems";

import { Icon } from "@iconify/react";
import { useTranslation } from 'react-i18next';
import {
  SidebarMenuItem,
  useSidebar,
} from "src/components/ui/sidebar";
import { Badge } from "src/components/ui/badge";
import { Link, useLocation } from "react-router";
import { CustomizerContext } from "src/context/CustomizerContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "src/components/ui/tooltip";

interface NavItemsProps {
  item: ChildItem;
  isInsideCollapse?: boolean;
}
const NavItems: React.FC<NavItemsProps> = ({ item, isInsideCollapse }) => {
  const { setOpen } = useSidebar();
  const { isCollapse } = useContext(CustomizerContext);
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation();
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);
  const [canOpenTooltip, setCanOpenTooltip] = React.useState(false);

  const isExternal = /^https?:\/\//.test(item.url);
  const isMiniSidebar = isCollapse === "mini-sidebar";
  const tooltipLabel = t(`${item.name}`);
  
  // Check if current path matches item URL or is a nested route
  const isActive = pathname === item.url || pathname.startsWith(item.url + '/');

  React.useEffect(() => {
    setIsTooltipOpen(false);
    setCanOpenTooltip(false);

    if (!isMiniSidebar) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCanOpenTooltip(true);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isMiniSidebar, pathname]);

  const closeSidebar = () => {
    setOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isExternal) {
      e.preventDefault();
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
    setIsTooltipOpen(false);
    closeSidebar();
  };

  return (
    <Tooltip open={isMiniSidebar ? isTooltipOpen : false}>
      <TooltipTrigger asChild>
        <Link
          to={item.url}
          onClick={handleClick}
          onPointerEnter={() => {
            if (isMiniSidebar && canOpenTooltip) setIsTooltipOpen(true);
          }}
          onPointerLeave={() => setIsTooltipOpen(false)}
          onPointerDown={() => setIsTooltipOpen(false)}
        >
          <SidebarMenuItem
            className={`
            transition-colors duration-150 ease-out px-4 py-3 rounded-md mb-1
            ${item.disabled
                ? 'opacity-50 cursor-default hover:bg-transparent hover:text-link'
                : isActive
                  ? isInsideCollapse
                    ? '!text-primary bg-transparent font-medium'
                    : `${item.icon ? '!text-white' : '!text-primary'
                    } bg-primary hover:bg-primary dark:hover:bg-primary hover:text-white font-medium`
                  : isInsideCollapse
                    ? 'text-link dark:text-darklink hover:text-primary dark:hover:text-primary bg-transparent group/icon'
                    : 'text-link dark:text-darklink hover:text-primary dark:hover:text-primary bg-transparent hover:bg-lightprimary dark:hover:bg-lightprimary group/icon'
              }
          `}>
            <span className={`flex gap-3 align-center items-center truncate w-full rtl:text-right ${isCollapse === 'mini-sidebar' ? 'justify-center' : ''}`}>
              {item.icon ? (
                <Icon
                  icon={item.icon}
                  className={`${item.color} w-[18px] h-[18px] min-w-[18px]`}
                  height={18}
                  width={18}
                />
              ) : null}
              <div
                className='max-w-36 overflow-hidden hide-menu flex-1 truncate !leading-normal
                    '>
                {tooltipLabel}
                {item.subtitle ? (
                  <p className='text-xs mt-1'>{t(`${item.subtitle}`)}</p>
                ) : null}
              </div>{' '}
              {item.badge && item.badgeType === 'filled' && (
                <Badge color='primary' className='hide-menu'>
                  {' '}
                  {item.badgeContent}
                </Badge>
              )}
            </span>
          </SidebarMenuItem>
        </Link>
      </TooltipTrigger>
      {isMiniSidebar && (
        <TooltipContent side="right" sideOffset={10}>
          {tooltipLabel}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default NavItems;
