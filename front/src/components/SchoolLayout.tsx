import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SchoolSidebar } from "./SchoolSidebar";
import { NotificationDropdown } from "./NotificationDropdown";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

interface SchoolLayoutProps {
  children: ReactNode;
}

export function SchoolLayout({ children }: SchoolLayoutProps) {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-secondary">
        <SchoolSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-16 bg-card border-b border-border flex items-center px-6 shadow-sm"
          >
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-foreground">
                YNOV Campus - Gestion Scolaire
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications pour les admins et comptables */}
              {user && (user.role === "admin" || user.role === "comptable") && (
                <div className="mr-1">
                  <NotificationDropdown />
                </div>
              )}

              {/* Affichage du nom, prénom et rôle */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-end">
                    <span className="font-semibold text-foreground text-sm md:text-base leading-tight">
                      {user.nom} {user.prenom}
                    </span>
                    <span className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : ""}
                    </span>
                  </div>
                  <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                    {user.prenom
                      ? user.prenom.charAt(0).toUpperCase()
                      : user.nom
                        ? user.nom.charAt(0).toUpperCase()
                        : "U"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Bienvenue</div>
              )}
            </div>
          </motion.header>

          <main className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
