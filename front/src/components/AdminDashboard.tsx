import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Shield, UserCheck, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CreateSubAdminForm from "@/components/CreateSubAdminForm";
import CreateParentForm from "@/components/CreateParentForm";
import UserManagement from "@/components/UserManagement";
import { userService } from "@/services/userService";

interface DashboardStats {
  totalUsers: number;
  admins: number;
  subAdmins: number;
  enseignants: number;
  parents: number;
  etudiants: number;
  actifs: number;
}

const AdminDashboard = () => {
  // Vérification de sécurité pour éviter l'erreur useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error("AuthContext not available:", error);
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Erreur de chargement du contexte d'authentification.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, isAdmin, isSubAdmin, canManageUsers } = authContext;
  const [activeTab, setActiveTab] = useState("users");

  const { data: usersStatsData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-dashboard-stats"],
    queryFn: () => userService.getUserStats(),
    enabled: canManageUsers,
  });

  const stats: DashboardStats = usersStatsData?.data ?? {
    totalUsers: 0,
    admins: 0,
    subAdmins: 0,
    enseignants: 0,
    parents: 0,
    etudiants: 0,
    actifs: 0,
  };

  if (!canManageUsers) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Vous n'avez pas l'autorisation d'accéder au panneau
              d'administration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="destructive">Admin Principal</Badge>;
    if (isSubAdmin) return <Badge variant="secondary">Sous-Admin</Badge>;
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Panneau d'Administration
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <p className="text-sm md:text-base text-muted-foreground">
              Bienvenue, {user?.prenom} {user?.nom}
            </p>
            {getRoleBadge()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Utilisateurs Total
                </p>
                <p className="text-2xl font-bold">
                  {usersLoading ? "..." : stats.totalUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administrateurs</p>
                <p className="text-2xl font-bold">
                  {usersLoading ? "..." : stats.admins + stats.subAdmins}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Utilisateurs Actifs
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {usersLoading ? "..." : stats.actifs}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Étudiants</p>
                <p className="text-2xl font-bold text-purple-600">
                  {usersLoading ? "..." : stats.etudiants}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full lg:grid lg:grid-cols-4 h-auto p-1 bg-muted">
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 px-4 py-2"
            >
              <Users className="h-4 w-4" />
              <span className="whitespace-nowrap">Gestion Utilisateurs</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="create-admin"
                className="flex items-center gap-2 px-4 py-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="whitespace-nowrap">Créer Sous-Admin</span>
              </TabsTrigger>
            )}
            {canManageUsers && (
              <TabsTrigger
                value="create-parent"
                className="flex items-center gap-2 px-4 py-2"
              >
                <User className="h-4 w-4" />
                <span className="whitespace-nowrap">Créer Parent</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="create-admin" className="space-y-4">
            <CreateSubAdminForm />
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="create-parent" className="space-y-4">
            <CreateParentForm />
          </TabsContent>
        )}

      </Tabs>

      {/* Additional Stats by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {usersLoading ? "..." : stats.enseignants}
              </p>
              <p className="text-sm text-muted-foreground">Enseignants</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {usersLoading ? "..." : stats.parents}
              </p>
              <p className="text-sm text-muted-foreground">Parents</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {usersLoading ? "..." : stats.etudiants}
              </p>
              <p className="text-sm text-muted-foreground">Étudiants</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {usersLoading ? "..." : stats.admins + stats.subAdmins}
              </p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
