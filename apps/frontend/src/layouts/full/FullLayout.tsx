import { FC, useContext } from 'react';
import { Outlet } from 'react-router';
import { Customizer } from './shared/customizer/Customizer';
import { CustomizerContext } from '../../context/CustomizerContext';
import Sidebar from './vertical/sidebar/Sidebar';
import Header from './vertical/header/Header';
import { SidebarProvider } from 'src/components/ui/sidebar';
import ScrollToTop from 'src/components/shared/ScrollToTop';

const FullLayout: FC = () => {
  const { activeLayout, isLayout, getOpenState } = useContext(CustomizerContext);

  return (
    <SidebarProvider>
      <div className="page-wrapper flex w-full min-h-screen bg-white dark:bg-darkgray">
        {/* Header/sidebar */}

        {activeLayout == "vertical" ?
          <div className="xl:block hidden">
            <Sidebar />
          </div>
          : null}
        <div className={`page-wrapper-sub flex flex-col w-full dark:bg-darkgray transition-[margin-left] ease-in-out duration-300 ${activeLayout === "vertical" ? (getOpenState?.() ? "xl:ml-[260px]" : "xl:ml-[80px]") : ""
          }`}>
          {/* Top Header  */}
          {activeLayout == "horizontal" ? (
            <Header layoutType="horizontal" />
          ) : (
            <Header layoutType="vertical" />
          )}

          <div
            className={`bg-white dark:bg-dark h-full ${activeLayout != "horizontal" ? "rounded-bb" : "rounded-none"
              } `}
          >
            {/* Body Content  */}
            <div
              className={` ${isLayout == "full"
                ? "w-full py-8 px-5 md:px-8 lg:px-12"
                : "w-full py-8 px-5 md:px-6 lg:px-8"
                } ${activeLayout == "horizontal" ? "xl:mt-3" : ""} max-w-full
            `}
            >
              <ScrollToTop>
                <Outlet />
              </ScrollToTop>
            </div>
            <Customizer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FullLayout;
