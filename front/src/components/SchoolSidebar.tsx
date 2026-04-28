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
} from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router-dom";
import {
  Users,
  GraduationCap,
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  UserCheck,
  Bell,
  BookOpen,
  Award,
  LayoutDashboard,
  LogOut,
  PieChart,
  User,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const menuItems = [
  {
    title: "sidebar.principal",
    items: [
      { title: "sidebar.dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "sidebar.gestion_etudiants",
    items: [
      { title: "sidebar.students", url: "/students", icon: GraduationCap },
      { title: "sidebar.classes", url: "/classes", icon: BookOpen },
    ],
  },
  {
    title: "sidebar.gestion_financiere",
    items: [
      { title: "sidebar.tariffs", url: "/tarifs", icon: DollarSign },
      {
        title: "sidebar.payment_dashboard",
        url: "/payment-management",
        icon: PieChart,
      },
      { title: "sidebar.payments", url: "/payments", icon: CreditCard },
      { title: "sidebar.payment_plans", url: "/payment-plans", icon: FileText },
    ],
  },
  {
    title: "sidebar.aide_suivi",
    items: [
      { title: "sidebar.bourses", url: "/bourses", icon: Award },
      { title: "sidebar.reminders", url: "/relances", icon: Bell },
    ],
  },
  {
    title: "sidebar.administration",
    items: [
      { title: "sidebar.users", url: "/users", icon: UserCheck },
      { title: "sidebar.monitoring", url: "/monitoring", icon: ShieldAlert },
    ],
  },
  {
    title: "sidebar.portal",
    items: [
      { title: "sidebar.portal", url: "/portal", icon: User },
      { title: "sidebar.profile", url: "/profile", icon: UserCheck },
    ],
  },
];

export function SchoolSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  // Fonction pour déterminer si un élément de menu est actif
  const isMenuItemActive = (itemUrl: string, currentPath: string) => {
    // Correspondance exacte
    if (itemUrl === currentPath) {
      return true;
    }

    // Correspondance pour les routes avec paramètres (ex: /students/123)
    if (currentPath.startsWith(itemUrl + "/")) {
      return true;
    }

    // Cas spéciaux pour certaines routes
    if (
      itemUrl === "/portal" &&
      (currentPath === "/portal" || currentPath.startsWith("/portal/"))
    ) {
      return true;
    }

    if (itemUrl === "/profile" && currentPath === "/profile") {
      return true;
    }

    if (itemUrl === "/dashboard" && currentPath === "/dashboard") {
      return true;
    }

    // Cas spéciaux pour les étudiants
    if (
      itemUrl === "/students" &&
      (currentPath.startsWith("/students") ||
        currentPath.startsWith("/student"))
    ) {
      return true;
    }

    // Cas spéciaux pour les paiements - plus précis
    if (itemUrl === "/payments" && currentPath.startsWith("/payments")) {
      return true;
    }

    // Cas spéciaux pour le tableau de bord des paiements
    if (
      itemUrl === "/payment-management" &&
      currentPath.startsWith("/payment-management")
    ) {
      return true;
    }

    // Cas spéciaux pour les plans de paiement
    if (
      itemUrl === "/payment-plans" &&
      currentPath.startsWith("/payment-plans")
    ) {
      return true;
    }

    return false;
  };

  // Vérification de sécurité pour éviter l'erreur useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error("AuthContext not available:", error);
    return null; // Retourner null si le contexte n'est pas disponible
  }

  const {
    user,
    isAdmin,
    isSubAdmin,
    isComptable,
    isEtudiant,
    isParent,
    isEnseignant,
    hasRole,
    logout,
  } = authContext;

  let filteredMenuItems = [];
  if (!user) {
    filteredMenuItems = [];
  } else if (isAdmin) {
    // Admin a accès à tout sauf le portail étudiant (demandé par l'utilisateur)
    filteredMenuItems = menuItems.filter(
      (section) => section.title !== "sidebar.portal",
    );
  } else if (isSubAdmin) {
    // Sous-admin a accès à tout sauf le portail étudiant (demandé par l'utilisateur)
    filteredMenuItems = menuItems.filter(
      (section) => section.title !== "sidebar.portal",
    );
  } else if (isComptable) {
    const comptableAllowedTitles = new Set([
      "sidebar.principal",
      "sidebar.gestion_financiere",
      // "sidebar.portal", // Masqué pour les comptables
    ]);
    const comptableAllowedItems = new Set([
      "sidebar.dashboard",
      "sidebar.tariffs",
      "sidebar.payment_dashboard",
      "sidebar.payments",
      // "sidebar.portal",
      "sidebar.profile",
    ]);

    filteredMenuItems = menuItems
      .filter((section) => comptableAllowedTitles.has(section.title))
      .map((section) => {
        return {
          ...section,
          items: section.items.filter((item) =>
            comptableAllowedItems.has(item.title),
          ),
        };
      })
      .filter((section) => section.items.length > 0);
  } else if (isEtudiant) {
    const etudiantAllowedItems = new Set(["sidebar.portal", "sidebar.profile"]);

    filteredMenuItems = menuItems
      .map((section) => {
        const filteredSectionItems = section.items.filter((item) =>
          etudiantAllowedItems.has(item.title),
        );
        return {
          ...section,
          items: filteredSectionItems,
        };
      })
      .filter((section) => section.items.length > 0);
  } else if (isParent) {
    const parentAllowedItems = new Set(["sidebar.portal", "sidebar.profile"]);

    filteredMenuItems = menuItems
      .map((section) => {
        const filteredSectionItems = section.items.filter((item) =>
          parentAllowedItems.has(item.title),
        );
        return {
          ...section,
          items: filteredSectionItems,
        };
      })
      .filter((section) => section.items.length > 0);
  } else if (isEnseignant) {
    const enseignantAllowedItems = new Set([
      "sidebar.dashboard",
      "sidebar.classes",
    ]);

    filteredMenuItems = menuItems
      .map((section) => {
        const filteredSectionItems = section.items.filter((item) =>
          enseignantAllowedItems.has(item.title),
        );
        return {
          ...section,
          items: filteredSectionItems,
        };
      })
      .filter((section) => section.items.length > 0);
  } else {
    // Fallback pour les autres rôles - permettre l'accès au portail
    const fallbackAllowedItems = new Set([
      "sidebar.dashboard",
      "sidebar.portal",
    ]);

    filteredMenuItems = menuItems
      .map((section) => {
        const filteredSectionItems = section.items.filter((item) =>
          fallbackAllowedItems.has(item.title),
        );
        return {
          ...section,
          items: filteredSectionItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            {!collapsed && (
              <div className="flex flex-col">
                <h2 className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">
                  École Supérieure
                </h2>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Gestion des Frais
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter out "Factures" for comptable */}
        {filteredMenuItems.map((section) => (
          <SidebarGroup key={section.title}>
            {/* {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/70">
                {t(section.title)}
              </SidebarGroupLabel>
            )} */}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = isMenuItemActive(
                    item.url,
                    location.pathname,
                  );
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "hover:bg-sidebar-accent text-sidebar-foreground"
                          }`}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="font-medium">{t(item.title)}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* User Profile at the bottom of the sidebar */}
        {user && (
          <div className="mt-auto border-t border-sidebar-border">
            <div
              className={`p-4 flex items-center gap-3 ${collapsed ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-primary-foreground font-semibold">
                  {user.prenom ? user.prenom.charAt(0).toUpperCase() : ""}
                </div>
                {!collapsed && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-sidebar-foreground truncate">
                      {user.prenom} {user.nom}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : ""}
                    </span>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/login";
                  }}
                  title="Déconnexion"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>

            {collapsed && (
              <div className="px-4 pb-4 flex justify-center">
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/login";
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
