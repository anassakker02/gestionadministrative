import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavLink, useLocation } from "react-router-dom"
import {
  Users,
  GraduationCap,
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  UserCheck,
  Bell,
  Settings,
  BookOpen,
  Award,
  LayoutDashboard,
} from "lucide-react"

const menuItems = [
  {
    title: "Principal",
    items: [
      { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "Gestion des Étudiants",
    items: [
      { title: "Étudiants", url: "/students", icon: GraduationCap },
      { title: "Classes", url: "/classes", icon: BookOpen },
      { title: "Enseignants", url: "/teachers", icon: UserCheck },
      { title: "Matières", url: "/subjects", icon: Award },
      { title: "Emploi du temps", url: "/schedule", icon: Calendar },
    ]
  },
  {
    title: "Gestion Financière",
    items: [
      { title: "Tarifs", url: "/tarifs", icon: DollarSign },
      { title: "Factures", url: "/factures", icon: Receipt },
      { title: "Paiements", url: "/payments", icon: CreditCard },
      { title: "Échéanciers", url: "/schedules", icon: Calendar },
      { title: "Frais Ponctuels", url: "/fees", icon: DollarSign },
    ]
  },
  {
    title: "Aide & Suivi",
    items: [
      { title: "Bourses", url: "/scholarships", icon: Award },
      { title: "Relances", url: "/reminders", icon: Bell },
    ]
  },
  {
    title: "Administration",
    items: [
      { title: "Utilisateurs", url: "/users", icon: UserCheck },
      { title: "Paramètres", url: "/settings", icon: Settings },
    ]
  }
]

export function SchoolSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const collapsed = state === "collapsed"

  const isActive = (path: string) => location.pathname === path

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className={`font-bold text-sidebar-foreground transition-all ${
            collapsed ? "text-xs text-center" : "text-lg"
          }`}>
            {collapsed ? "YC" : "YNOV Campus"}
          </h2>
        </div>

        {menuItems.map((section) => (
          <SidebarGroup key={section.title}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "hover:bg-sidebar-accent text-sidebar-foreground"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}