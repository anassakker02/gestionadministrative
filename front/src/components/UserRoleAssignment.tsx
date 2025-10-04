import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { userService, User } from "@/services/userService";
import { tarifService } from "@/services/tarifService";
import { useAuth } from "@/contexts/AuthContext";

interface PendingUser extends User {
  created_at: string;
}

const UserRoleAssignment = () => {
  const { canManageUsers } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  // Calculer le total des frais de scolarité
  const calculateTotalFees = () => {
    if (!scolariteTarifs?.data) return 0;
    
    const tarifs = scolariteTarifs.data;
    const fraisInscription = tarifs.find((t: any) => t.nom === "Frais Inscription")?.montant || 0;
    const fraisScolarite = tarifs.find((t: any) => t.nom === "Frais scolaire")?.montant || 0;
    
    return fraisInscription + fraisScolarite;
  };

  const totalFees = calculateTotalFees();

  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ["pending-users"],
    queryFn: () => userService.getPendingUsers(),
    enabled: canManageUsers,
  });

  // Récupérer les tarifs de scolarité pour afficher le calcul automatique
  const { data: scolariteTarifs } = useQuery({
    queryKey: ["scolarite-tarifs"],
    queryFn: () => tarifService.getScolariteTarifs(),
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      userService.assignRole(userId, role),
    onSuccess: (response, { role }) => {
      toast({
        title: "Rôle assigné",
        description: `Le rôle "${role}" a été assigné avec succès`,
      });
      setSelectedRole("");
      setAssigningUserId(null);
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'assignation du rôle",
        variant: "destructive",
      });
      setAssigningUserId(null);
    },
  });

  const handleAssignRole = (userId: string) => {
    if (!selectedRole) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un rôle",
        variant: "destructive",
      });
      return;
    }
    setAssigningUserId(userId);
    assignRoleMutation.mutate({ userId, role: selectedRole });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "sub-admin":
        return "secondary";
      case "enseignant":
        return "default";
      case "parent":
        return "outline";
      case "etudiant":
        return "default";
      default:
        return "secondary";
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Vous n'avez pas l'autorisation de gérer les utilisateurs.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Chargement des utilisateurs en attente...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignation des Rôles</CardTitle>
        <p className="text-sm text-muted-foreground">
          Assignez des rôles aux utilisateurs qui n'en ont pas encore
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">
                Sélectionner un rôle
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enseignant">Enseignant</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="etudiant">Étudiant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section d'information sur les frais pour les étudiants */}
          {selectedRole === "etudiant" && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💰 Calcul automatique des frais pour les étudiants</h4>
              <div className="space-y-2 text-sm">
                {scolariteTarifs?.data ? (
                  <>
                    <div className="flex justify-between">
                      <span>Frais d'inscription:</span>
                      <span className="font-medium">
                        {scolariteTarifs.data.find((t: any) => t.nom === "Frais Inscription")?.montant || 0} MAD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de scolarité:</span>
                      <span className="font-medium">
                        {scolariteTarifs.data.find((t: any) => t.nom === "Frais scolaire")?.montant || 0} MAD
                      </span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between font-semibold text-blue-900">
                      <span>Total frais_payment:</span>
                      <span>{totalFees} MAD</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      💡 Ce montant sera automatiquement calculé lors de l'assignation du rôle étudiant
                    </p>
                  </>
                ) : (
                  <p className="text-blue-700">Chargement des tarifs...</p>
                )}
              </div>
            </div>
          )}

          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun utilisateur en attente d'assignation de rôle
            </p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user: PendingUser) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.telephone && (
                          <p className="text-sm text-muted-foreground">
                            {user.telephone}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Sans rôle</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Inscrit le:{" "}
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleAssignRole(user.id)}
                    disabled={!selectedRole || assigningUserId === user.id}
                    size="sm"
                  >
                    {assigningUserId === user.id
                      ? "Attribution..."
                      : "Assigner"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleAssignment;
