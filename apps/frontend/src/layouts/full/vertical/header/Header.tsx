"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { useUser } from "src/lib/better-auth";
import { useQuery } from '@tanstack/react-query';

{/* removed Search import */ }
import { Icon } from "@iconify/react";
{/* removed AppLinks import */ }
import Profile from "./Profile";

import { Language } from "./Language";
import FullLogo from "../../shared/logo/FullLogo";
import MobileHeaderItems from "./MobileHeaderItems";
import HorizontalMenu from "../../horizontal/header/HorizontalMenu";

import { Sheet, SheetContent } from "src/components/ui/sheet";

import { useSidebar } from "src/components/ui/sidebar";
import { CustomizerContext } from "src/context/CustomizerContext";
import { useLocation } from "react-router";
import NotificationButton from "./NotificationButton";
import SidebarLayout from "../sidebar/Sidebar";
import api from "src/api/axios";

interface HeaderPropsType {
  layoutType: string;
}

const Header = ({ layoutType }: HeaderPropsType) => {
  const [isSticky, setIsSticky] = useState(false);

  const { setOpenMobile, openMobile } = useSidebar();

  const { isLayout, setActiveMode, activeMode } =
    useContext(CustomizerContext);

  const [mobileMenu, setMobileMenu] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);


  const { user } = useUser();
  const location = useLocation();
  const pathname = location.pathname;

  /* Check if current path is an Admin path - MOVED UP */
  const isAdmin = pathname.startsWith("/admin");

  const profileQuery = useQuery({
    queryKey: ['peserta', 'me', 'header'],
    queryFn: async () => {
      const { data } = await api.get('/peserta/me');
      return data;
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const adminBatchesQuery = useQuery({
    queryKey: ['batch', 'list', 'header'],
    queryFn: async () => {
      const { data } = await api.get('/batch/list');
      return Array.isArray(data) ? data : [];
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const nearestBatch = useMemo(() => {
    if (!isAdmin || !adminBatchesQuery.data || adminBatchesQuery.data.length === 0) {
      return null;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return adminBatchesQuery.data
      .map((batch: any) => {
        const startDate = new Date(batch.tanggal);
        const endDate = batch.tanggalSelesai ? new Date(batch.tanggalSelesai) : startDate;
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

        let status = 'draft';
        let priority = 3;

        if (today < start) {
          status = 'upcoming';
          priority = 1;
        } else if (today >= start && today <= end) {
          status = 'running';
          priority = 0;
        } else if (today > end) {
          status = 'completed';
          priority = 4;
        }

        return { ...batch, calculatedStatus: status, priority, startDate: start };
      })
      .sort((a: any, b: any) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.startDate.getTime() - b.startDate.getTime();
      })[0];
  }, [adminBatchesQuery.data, isAdmin]);

  const userName = profileQuery.data?.nama || user?.firstName || "Peserta";

  useEffect(() => {
    if (openMobile) {
      setOpenMobile(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleMobileMenu = () => {
    if (mobileMenu === "active") {
      setMobileMenu("");
    } else {
      setMobileMenu("active");
    }
  };
  if (!mounted) return null;

  const toggleMode = () => {
    setActiveMode(activeMode === "light" ? "dark" : "light");
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  // Get status label
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'running': return 'Sedang Berlangsung';
      case 'upcoming': return 'Akan Datang';
      case 'completed': return 'Selesai';
      default: return 'Draft';
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 text-ld z-[90] ${
          isAdmin
            ? "bg-[#1f2937] text-white shadow-md"
            : isSticky
            ? "bg-white dark:bg-dark shadow-md"
            : "bg-white dark:bg-dark"
          }`}
      >
        <nav
          className={`rounded-none pt-1 xl:pt-4 sm:px-7.5 px-4 ${layoutType == "horizontal" ? "container mx-auto" : ""
            }  ${isLayout == "full" ? "!max-w-full" : ""}`}
        >
          <div className={`mx-auto flex flex-wrap items-center justify-between border-b pb-1 xl:pb-4 ${
            isAdmin ? "border-white/20" : "border-ld"
          }`}>
            <span
              onClick={() => setOpenMobile(!openMobile)}
              className={`h-10 w-10 flex ${isAdmin ? "text-white hover:text-white" : "text-black/60 dark:text-white hover:text-primary"
                } xl:hidden hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer`}
            >
              <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
            </span>

            {/* Toggle Icon   */}
            <div className="xl:!block !hidden">
              <div className="flex gap-3 items-center relative">
                {/* Admin Header Content */}
                {isAdmin ? (
                  <div>
                    {pathname === "/admin/home" && nearestBatch && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-[#AA8D55] text-white px-4 py-2 rounded-md shadow-sm">
                          <Icon icon="solar:box-minimalistic-line-duotone" height={18} />
                          <span className="font-semibold text-sm">{nearestBatch.namaBatch || 'Training'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <Icon icon="solar:buildings-2-line-duotone" height={18} />
                          <span>
                            {nearestBatch.hotel || 'Lokasi TBA'}
                            {nearestBatch.alamat && `, ${nearestBatch.alamat.split(',')[0]}`}
                            {' | '}
                            {formatDate(nearestBatch.tanggal)}
                            {nearestBatch.tanggalSelesai && ` - ${formatDate(nearestBatch.tanggalSelesai)}`}
                            {' | '}
                            <span className="text-white font-bold">{getStatusLabel(nearestBatch.calculatedStatus)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                    {pathname === "/admin/home" && !nearestBatch && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Dashboard Admin
                        </h2>
                        <p className="text-white/70 text-xs">
                          Kelola semua aspek platform training
                        </p>
                      </>
                    )}
                    {pathname === "/admin/manage-training" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Kelola Training
                        </h2>
                        <p className="text-white/70 text-xs">
                          Manajemen batch dan jadwal pelatihan
                        </p>
                      </>
                    )}
                    {pathname === "/admin/daftar-peserta" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Daftar Peserta
                        </h2>
                        <p className="text-white/70 text-xs">
                          Kelola data dan status peserta training
                        </p>
                      </>
                    )}
                    {pathname === "/admin/daftar-trainer" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Daftar Trainer
                        </h2>
                        <p className="text-white/70 text-xs">
                          Kelola data dan informasi trainer
                        </p>
                      </>
                    )}
                    {pathname === "/admin/manage-kelas" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Kelola Kelas
                        </h2>
                        <p className="text-white/70 text-xs">
                          Manajemen kelas dan materi pembelajaran
                        </p>
                      </>
                    )}
                    {(pathname === "/admin/manage-kelas/create" || pathname.startsWith("/admin/manage-kelas/edit/")) && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          {pathname === "/admin/manage-kelas/create" ? "Buat Kelas Baru" : "Edit Kelas"}
                        </h2>
                        <p className="text-white/70 text-xs">
                          {pathname === "/admin/manage-kelas/create" ? "Tambahkan kelas dan materi baru" : "Ubah informasi dan materi kelas"}
                        </p>
                      </>
                    )}
                    {pathname === "/admin/settings" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Pengaturan
                        </h2>
                        <p className="text-white/70 text-xs">
                          Konfigurasi sistem dan preferensi
                        </p>
                      </>
                    )}
                    {pathname === "/admin/mux-videos" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Manajemen Video
                        </h2>
                        <p className="text-white/70 text-xs">
                          Kelola video pembelajaran Mux
                        </p>
                      </>
                    )}
                    {pathname === "/admin/tier-management" && (
                      <>
                        <h2 className="text-xl font-semibold text-white mb-0.5">
                          Tier Management
                        </h2>
                        <p className="text-white/70 text-xs">
                          Kelola master tier templates untuk batch training
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  // Default Header Content
                  <>
                    {layoutType == "horizontal" ? (
                      <div className="me-3">
                        <FullLogo />
                      </div>
                    ) : null}

                    {pathname === "/user/home" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Halo, <span className="text-[#AA8D55]">{userName}</span>
                        </h2>
                        <p className="text-bodytext text-xs">
                          Ini rangkuman perjalanan sertifikasi kamu
                        </p>
                      </div>
                    )}
                    {pathname === "/user/training/info" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Info Training
                        </h2>
                        <p className="text-bodytext text-xs">
                          Informasi detail mengenai training yang kamu ikuti
                        </p>
                      </div>
                    )}
                    {pathname === "/user/kelas" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Kelas Saya
                        </h2>
                        <p className="text-bodytext text-xs">
                          Daftar semua kelas yang tersedia untuk Anda
                        </p>
                      </div>
                    )}
                    {pathname.startsWith("/user/kelas/") && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Kelas
                        </h2>
                        <p className="text-bodytext text-xs">
                          Materi pembelajaran dan tugas
                        </p>
                      </div>
                    )}
                    {pathname === "/user/ai-generator" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          AI Dokumen Generator
                        </h2>
                        <p className="text-bodytext text-xs">
                          Buat dokumen pendukung materi dengan bantuan AI
                        </p>
                      </div>
                    )}
                    {pathname === "/user/sertifikat" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Sertifikat
                        </h2>
                        <p className="text-bodytext text-xs">
                          Sertifikat kelulusan kamu
                        </p>
                      </div>
                    )}
                    {pathname === "/user/dokumen" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Dokumen
                        </h2>
                        <p className="text-bodytext text-xs">
                          Kelengkapan administrasi dan pemberkasan
                        </p>
                      </div>
                    )}
                    {pathname === "/user/ai-hub" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          AI Mentor
                        </h2>
                        <p className="text-bodytext text-xs">
                          Pilih AI Assistant sesuai kebutuhan Anda
                        </p>
                      </div>
                    )}
                    {pathname.startsWith("/user/ai-hub/") && (() => {
                      // Extract category from path: /user/ai-hub/:category
                      const pathParts = pathname.split('/');
                      const category = pathParts[3]; // index 3 = category
                      
                      const categoryConfig: Record<string, { title: string; description: string; color: string }> = {
                        trainer: {
                          title: "AI for Trainer",
                          description: "AI Assistant untuk membantu pembuatan materi training",
                          color: "#4F75FF"
                        },
                        master: {
                          title: "AI for Master",
                          description: "AI Assistant untuk analisis dan coaching trainer",
                          color: "#AA8D55"
                        },
                        branding: {
                          title: "AI for Branding",
                          description: "AI Assistant untuk content creation dan branding",
                          color: "#10B981"
                        }
                      };
                      
                      const config = category ? categoryConfig[category] : null;
                      
                      if (config) {
                        return (
                          <div className="flex items-center gap-4">
                            <a 
                              href="/user/ai-hub"
                              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Icon icon="solar:arrow-left-outline" height={20} />
                            </a>
                            <div>
                              <h2 className="text-xl font-semibold text-ld mb-0.5">
                                {config.title}
                              </h2>
                              <p className="text-bodytext text-xs">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div>
                          <h2 className="text-xl font-semibold text-ld mb-0.5">
                            AI Assistant
                          </h2>
                          <p className="text-bodytext text-xs">
                            Chat dengan AI untuk generate dokumen training
                          </p>
                        </div>
                      );
                    })()}
                    {pathname === "/user/profile" && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Profil Peserta
                        </h2>
                        <p className="text-bodytext text-xs">
                          Lengkapi data pribadi dan data BNSP Anda
                        </p>
                      </div>
                    )}
                    {(pathname === "/trainer/documents" || pathname === "/user/documents") && (
                      <div>
                        <h2 className="text-xl font-semibold text-ld mb-0.5">
                          Dokumen Pelatihan
                        </h2>
                        <p className="text-bodytext text-xs">
                          Generate dan kelola dokumen pelatihan berbasis kompetensi BNSP. Pilih dokumen yang ingin di-generate.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* mobile-logo - center */}
            <div className="flex xl:hidden items-center justify-center">
              <FullLogo hideOnMobile={false} />
            </div>
            <div className="xl:!block !hidden md:!hidden">
              <div className="flex gap-3 items-center">
                {/* Theme Toggle - Hidden for Admin if forced dark, but user might want to toggle. 
                    However, screenshot implies fixed look. I'll keep it for now but maybe conditionally hide if we want strict adhereance.
                    The screenshot doesn't show the sun/moon icon. I'll hide it for Admin to match "distinction".
                */}
                {/* Theme Toggle - Hidden as per user request */}
                {/* {!isAdmin && (
                  activeMode === "light" ? (
                    <div
                      className="h-10 w-10 hover:text-primary hover:bg-lightprimary dark:hover:bg-darkminisidebar  dark:hover:text-primary focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-darklink  dark:text-white"
                      onClick={toggleMode}
                    >
                      <span className="flex items-center">
                        <Icon icon="solar:moon-line-duotone" width="20" />
                      </span>
                    </div>
                  ) : (
                    // Dark Mode Button
                    <div
                      className="h-10 w-10 hover:text-primary hover:bg-lightprimary dark:hover:bg-darkminisidebar  dark:hover:text-primary focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-darklink  dark:text-white"
                      onClick={toggleMode}
                    >
                      <span className="flex items-center">
                        <Icon icon="solar:sun-bold-duotone" width="20" />
                      </span>
                    </div>
                  )
                )} */}

                {/* Language Dropdown*/}
                {/* <Language /> */}

                {/* Meassage Dropdown */}

                {/* Notification Dropdown */}
                <NotificationButton />

                {/* Profile Dropdown */}
                <Profile />
              </div>
            </div>
            {/* Mobile Toggle Icon */}
            <span
              className={`h-10 w-10 flex xl:hidden ${isAdmin ? "text-white" : "hover:text-primary"} hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer`}
              onClick={handleMobileMenu}
            >
              <Icon icon="tabler:dots" height={21} />
            </span>
          </div>
        </nav>

        <div
          className={`w-full  xl:hidden block mobile-header-menu ${mobileMenu}`}
        >
          <MobileHeaderItems />
        </div>

        {/* Horizontal Menu  */}
        {layoutType == "horizontal" ? (
          <div className="xl:border-y xl:border-ld xl:block hidden">
            <div
              className={`${isLayout == "full" ? "w-full px-6" : "container"}`}
            >
              <HorizontalMenu />
            </div>
          </div>
        ) : null}
      </header>

      {/* Mobile Sidebar */}

      <div className="block">
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side="left"
            className="w-[260px] sm:w-[260px] p-0 max-w-[100vw]"
          // className="max-w-[100vw]"
          >
            <SidebarLayout />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Header;
