import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { User } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Users, UserCheck, UserX, Edit, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Types de rôles disponibles dans le système
const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin", icon: "👑" },
  { value: "sous-admin", label: "Sous-Admin", icon: "👨‍💼" },
  { value: "comptable", label: "Comptable", icon: "💰" },
  { value: "enseignant", label: "Enseignant", icon: "👨‍🏫" },
  { value: "parent", label: "Parent", icon: "👪" },
  { value: "etudiant", label: "Étudiant", icon: "🎓" },
];

const UserManagement = () => {
  const { user, isAdmin, isSubAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Edit modal state (moved before early returns so hooks order is stable)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Récupérer tous les utilisateurs
  const { data: allUsersResponse, isLoading: loadingAllUsers } = useQuery({
    queryKey: ["all-users", filterRole],
    queryFn: () => {
      const params: { role?: string } = {};
      if (filterRole !== "all") {
        params.role = filterRole;
      }
      // Both admins and sous-admins can call the same API; we will filter visibility client-side for sous-admin
      if (isAdmin || isSubAdmin) {
        return userService.getAllUsers(params);
      }
      return Promise.resolve({ data: [] });
    },
    enabled: isAdmin || isSubAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await userService.updateProfile(id, { isActive });
      console.log("Réponse API statut:", response);
      return response;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-users"] }),
  });

  const allUsers = allUsersResponse?.data || [];

  // Helper to check react-query mutation loading state (fallback for different versions)
  const isMutationLoading = (m: unknown) => {
    if (!m) return false;
    const mm = m as { isLoading?: boolean; status?: string };
    if (typeof mm.isLoading === "boolean") return mm.isLoading;
    return mm.status === "loading";
  };

  const handleEditUser = (user: User) => {
    // Fonction pour ouvrir la modal de modification d'utilisateur
    toast({
      title: "Modification utilisateur",
      description: `Ouverture de la modification pour ${user.prenom} ${user.nom}`,
    });
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  // Details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const UserDetailsModal: React.FC = () => {
    if (!selectedUser) return null;
    type FirestoreTimestamp = { _seconds: number; _nanoseconds?: number };
    const created = (() => {
      try {
        if (!selectedUser.createdAt) return null;
        if (typeof selectedUser.createdAt === "string")
          return new Date(selectedUser.createdAt);
        if (typeof selectedUser.createdAt === "object") {
          const maybe = selectedUser.createdAt as unknown as
            | FirestoreTimestamp
            | Date;
          if (
            maybe &&
            typeof (maybe as FirestoreTimestamp)._seconds === "number"
          ) {
            return new Date((maybe as FirestoreTimestamp)._seconds * 1000);
          }
          if (maybe instanceof Date) return maybe as Date;
        }
        type DateLike = { getTime: () => number };
        const maybeDate = selectedUser.createdAt as unknown as
          | DateLike
          | unknown;
        if (maybeDate && typeof (maybeDate as DateLike).getTime === "function")
          return maybeDate as unknown as Date;
        return null;
      } catch (e) {
        return null;
      }
    })();

    return (
      <Dialog
        open={isDetailsModalOpen}
        onOpenChange={() => setIsDetailsModalOpen(false)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Détails utilisateur</DialogTitle>
            <DialogDescription>
              Consultez les informations détaillées de cet utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <div>
              <strong>Nom :</strong> {selectedUser.prenom} {selectedUser.nom}
            </div>
            <div>
              <strong>Email :</strong> {selectedUser.email}
            </div>
            <div>
              <strong>Rôle :</strong> {getRoleLabel(selectedUser.role)}
            </div>
            {selectedUser.telephone && (
              <div>
                <strong>Téléphone :</strong> {selectedUser.telephone}
              </div>
            )}
            {created && (
              <div>
                <strong>Inscrit le :</strong>{" "}
                {created.toLocaleDateString("fr-FR")}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "sous-admin":
        return "secondary";
      case "enseignant":
        return "default";
      case "parent":
        return "outline";
      case "etudiant":
        return "default";
      case null:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return "Sans rôle";
    const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
    if (roleConfig) return roleConfig.label;
    if (role === "admin") return "Administrateur";
    if (role === "sous-admin") return "Sous-Admin";
    return role;
  };

  const getRoleIcon = (role: string | null) => {
    if (!role) return "⏳";
    const roleConfig = AVAILABLE_ROLES.find((r) => r.value === role);
    if (roleConfig) return roleConfig.icon;
    if (role === "admin") return "👑";
    if (role === "sous-admin") return "👨‍💼";
    return "👤";
  };

  // Filtrage des utilisateurs par recherche
  const filteredAllUsers = (allUsers || []).filter(
    (u: User) =>
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if current user can manage the target user
  const canUserBeManaged = (targetUser: User) => {
    if (isAdmin) {
      return targetUser.role !== "admin"; // Admin can't manage other admins
    } else if (isSubAdmin) {
      // Sous-admin can only manage non-admin/sous-admin users
      return targetUser.role !== "admin" && targetUser.role !== "sous-admin";
    }
    return false; // Other roles cannot manage users
  };

  if (!user || (!isAdmin && !isSubAdmin)) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Vous n'êtes pas connecté ou vous n'avez pas l'autorisation de gérer
            les utilisateurs.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Simple EditUserModal component in-file to avoid new files
  interface EditUserFormValues {
    prenom: string;
    nom: string;
    email: string;
    role?: string | null;
  }

  const EditUserModal: React.FC = () => {
    const form = useForm<EditUserFormValues>();

    // Réinitialiser le formulaire quand selectedUser change
    useEffect(() => {
      if (selectedUser) {
        form.reset({
          prenom: selectedUser.prenom || "",
          nom: selectedUser.nom || "",
          email: selectedUser.email || "",
          role: selectedUser.role || "",
        });
      }
    }, [selectedUser, form]);

    const handleClose = () => {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      form.reset();
    };

    const onSubmit = async (vals: EditUserFormValues) => {
      if (!selectedUser) return;
      try {
        // If role changed and value provided, call assignRole (backend creates entity)
        if (vals.role && vals.role !== selectedUser.role) {
          await userService.assignRole(selectedUser.id, vals.role as string);
          toast({
            title: "Rôle affecté",
            description: `Rôle ${vals.role} affecté`,
          });
        }

        // Update basic profile fields
        await userService.updateProfile(selectedUser.id, {
          prenom: vals.prenom,
          nom: vals.nom,
          email: vals.email,
          role: vals.role as unknown as User["role"],
        });

        toast({
          title: "Utilisateur mis à jour",
          description: `${vals.prenom} ${vals.nom}`,
        });
        queryClient.invalidateQueries({ queryKey: ["all-users"] });
        handleClose();
      } catch (err: unknown) {
        const e = err as Error;
        toast({
          title: "Erreur",
          description: e?.message || "Échec",
          variant: "destructive",
        });
      }
    };

    if (!selectedUser) return null;

    return (
      <Dialog open={isEditModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur et affectez un rôle si
              nécessaire.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 py-4"
            >
              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {/* Role select - only show allowed roles depending on current user's permissions */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ROLES
                            // Do not show the 'admin' option in the UI (backend forbids assigning admin)
                            .filter((r) => r.value !== "admin")
                            .map((r) => {
                              // If current user is sub-admin, do not allow assigning sous-admin
                              if (isSubAdmin && r.value === "sous-admin")
                                return null;
                              return (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  };

  const UserCard = ({
    user,
    showAssignRole = false,
  }: {
    user: User;
    showAssignRole?: boolean;
  }) => {
    // Gestion de la date de création
    const getCreatedDate = (
      createdAt: { _seconds: number } | string | Date | null | undefined,
    ) => {
      if (!createdAt) return null;

      // Si c'est un objet Firestore avec _seconds
      if (
        typeof createdAt === "object" &&
        createdAt &&
        "_seconds" in createdAt
      ) {
        return new Date(createdAt._seconds * 1000);
      }

      // Si c'est déjà une date ou une chaîne
      if (typeof createdAt === "string" || createdAt instanceof Date) {
        return new Date(createdAt);
      }

      return null;
    };

    const createdDate = getCreatedDate(user.createdAt);

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          {/* Icône du rôle */}
          <div className="text-2xl">{getRoleIcon(user.role)}</div>

          {/* Informations utilisateur */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.prenom} {user.nom}
            </p>
            <p className="text-sm text-muted-foreground truncate hidden lg:block">
              {user.email}
            </p>
            {user.telephone && (
              <p className="text-sm text-muted-foreground hidden lg:block">
                📞 {user.telephone}
              </p>
            )}
            {createdDate && (
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                Inscrit le: {createdDate.toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          {/* Affichage du rôle actuel */}
          <div className="hidden md:block w-32 text-center">
            <Badge
              variant={getRoleBadgeVariant(user.role)}
              className="text-xs px-2 py-0.5"
            >
              {getRoleLabel(user.role)}
            </Badge>
          </div>

          {/* Statut avec toggle */}
          <div className="hidden sm:flex w-24 text-center flex-col items-center gap-1">
            <Switch
              checked={!!user.isActive}
              onCheckedChange={(checked) =>
                updateStatusMutation.mutate({ id: user.id, isActive: checked })
              }
              disabled={
                !canUserBeManaged(user) ||
                isMutationLoading(updateStatusMutation)
              }
              className="scale-75 sm:scale-100"
            />
            <span className="text-[10px] hidden md:block">
              {user.isActive ? "Actif" : "Non actif"}
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 w-24 sm:w-32 md:w-40 justify-end">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleEditUser(user)}
              disabled={!canUserBeManaged(user)}
              className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3"
              title="Modifier"
            >
              <span className="hidden sm:inline">Modifier</span>
              <Edit className="h-4 w-4 sm:hidden" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => handleUserDetails(user)}
              className="h-8 w-8 sm:h-9 sm:w-auto px-0 sm:px-3"
              title="Détails"
            >
              <span className="hidden sm:inline">Détails</span>
              <Eye className="h-4 w-4 sm:hidden" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Gestion des Utilisateurs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gérez les rôles et permissions des utilisateurs
        </p>
      </CardHeader>
      <CardContent>
        {/* Barre de recherche */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Rechercher un utilisateur</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Label htmlFor="filter">Filtrer par rôle</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sous-admin">Sous-Admin</SelectItem>
                <SelectItem value="enseignant">Enseignant</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="etudiant">Étudiant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* En-têtes des colonnes */}
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/50 rounded-t-lg mb-4">
          <div className="w-8 opacity-0">👤</div>
          <div className="flex-1 font-medium text-sm">Nom</div>
          <div className="hidden lg:block flex-1 font-medium text-sm">
            Email
          </div>
          <div className="hidden md:block w-32 text-center font-medium text-sm">
            Rôle
          </div>
          <div className="hidden sm:block w-24 text-center font-medium text-sm">
            Statut
          </div>
          <div className="w-24 sm:w-32 md:w-40 text-center font-medium text-sm">
            Actions
          </div>
        </div>

        {loadingAllUsers ? (
          <p>Chargement des utilisateurs...</p>
        ) : filteredAllUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredAllUsers.map((u: User) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}
        {/* Edit and Details modals rendered here so they exist in the DOM */}
        <EditUserModal />
        {isDetailsModalOpen && <UserDetailsModal />}
      </CardContent>
    </Card>
  );
};

export default UserManagement;
