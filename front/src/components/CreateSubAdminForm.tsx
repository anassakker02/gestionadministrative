import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userService, SubAdminData } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

const CreateSubAdminForm = () => {
  const { canCreateSubAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SubAdminData>({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    telephone: "",
    adresse: "",
  });

  const createSubAdminMutation = useMutation({
    mutationFn: (data: SubAdminData) => userService.createSubAdmin(data),
    onSuccess: (response) => {
      toast({
        title: "Sous-admin créé",
        description: `${response.data.prenom} ${response.data.nom} a été créé comme sous-admin`,
      });
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        telephone: "",
        adresse: "",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de la création du sous-admin",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof SubAdminData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nom ||
      !formData.prenom ||
      !formData.email ||
      !formData.password
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    createSubAdminMutation.mutate(formData);
  };

  if (!canCreateSubAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Seul l'admin principal peut créer des sous-admins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un Sous-Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createSubAdminMutation.isPending}
          >
            {createSubAdminMutation.isPending
              ? "Création..."
              : "Créer Sous-Admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSubAdminForm;
