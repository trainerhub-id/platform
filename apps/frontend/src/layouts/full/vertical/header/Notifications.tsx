

import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "src/components/ui/dropdown-menu";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import SimpleBar from "simplebar-react";
import { useNotifications } from "src/features/notifications/useNotifications";
import moment from "moment";

const Notifications = () => {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return "solar:widget-4-line-duotone";
      case 'info': return "solar:bell-bing-line-duotone";
      case 'success': return "solar:check-circle-line-duotone";
      case 'error': return "solar:danger-circle-line-duotone";
      default: return "solar:bell-bing-line-duotone";
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'warning': return "text-warning";
      case 'info': return "text-info";
      case 'success': return "text-success";
      case 'error': return "text-error";
      default: return "text-primary";
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'warning': return "bg-lightwarning dark:bg-lightwarning";
      case 'info': return "bg-lightinfo dark:bg-lightinfo";
      case 'success': return "bg-lightsuccess dark:bg-lightsuccess";
      case 'error': return "bg-lighterror dark:bg-lighterror";
      default: return "bg-lightprimary dark:bg-lightprimary";
    }
  };

  return (
    <div className="relative group/menu">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="outline-none">
          <div className="relative">
            <span className={`h-10 w-10 rounded-full flex justify-center items-center cursor-pointer ${
              isAdmin 
                ? "hover:bg-white/10 text-white" 
                : "hover:bg-lightprimary text-darklink dark:text-white group-hover/menu:bg-lightprimary group-hover/menu:text-primary"
            }`}>
              <Icon icon="solar:bell-bing-line-duotone" height={20} />
            </span>

            {unreadCount > 0 && (
              <span className="rounded-full absolute end-1 top-1 bg-error text-[10px] h-4 w-4 flex justify-center items-center text-white">
                {unreadCount}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-screen sm:w-[360px] py-6 rounded-sm"
        >
          <div className="flex items-center px-6 justify-between">
            <h3 className="mb-0 text-lg font-semibold text-ld">Notifications</h3>
            <Badge>{unreadCount} new</Badge>
          </div>

          <SimpleBar className="max-h-80 mt-3">
            {notifications.length === 0 ? (
              <div className="px-6 py-4 text-center text-bodytext">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="px-6 py-3 flex justify-between items-center bg-hover group/link w-full cursor-pointer"
                >
                  <Link to={notification.actionUrl || "#"} className="flex items-center w-full">
                    <div
                      className={`h-11 w-11 flex-shrink-0 rounded-full flex justify-center items-center ${getBgColor(notification.type)}`}
                    >
                      <Icon
                        icon={getIcon(notification.type)}
                        height={20}
                        className={getColor(notification.type)}
                      />
                    </div>

                    <div className="ps-4 flex justify-between w-full">
                      <div className="w-3/4 text-start">
                        <h5 className="mb-1 text-15 font-semibold group-hover/link:text-primary">
                          {notification.message}
                        </h5>
                        <div className="text-sm text-bodytext line-clamp-1">
                          {/* Subtitle omitted as backend doesn't provide it yet, can map type or just hide */}
                          {notification.type.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-xs block self-start pt-1.5">
                        {moment(notification.createdAt).fromNow()}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </SimpleBar>

          <div className="pt-5 px-6">
            <Button className="w-full" onClick={markAllAsRead}>Mark All as Read</Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Notifications;
