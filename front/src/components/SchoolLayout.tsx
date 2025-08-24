import { ReactNode } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SchoolSidebar } from "./SchoolSidebar"
import { motion } from "framer-motion"

interface SchoolLayoutProps {
  children: ReactNode
}

export function SchoolLayout({ children }: SchoolLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-secondary">
        <SchoolSidebar />
        
        <div className="flex-1 flex flex-col">
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-16 bg-card border-b border-border flex items-center px-6 shadow-sm"
          >
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                YNOV Campus - Gestion Scolaire
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Bienvenue, Admin
              </div>
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
  )
}