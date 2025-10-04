import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { User } from "@/types/user";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getClasses, Classe } from "@/api/classesApi";
import { getEtudiantById } from "@/api/etudiantsApi";
import { Eye, EyeOff } from "lucide-react";

const profileSchema = z.object({
  prenom: z.string().min(1, "Le prénom est requis"),
  nom: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  classe_id: z.string().optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "L'ancien mot de passe est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Récupérer les classes disponibles pour le profil
  const { data: classesData } = useQuery({
    queryKey: ["available-classes"],
    queryFn: userService.getAvailableClasses,
  });

  const classes: Classe[] = classesData?.data || [];

  // Récupérer les informations de l'étudiant si c'est un étudiant
  const { data: studentData } = useQuery({
    queryKey: ["student", user?.id],
    queryFn: async () => {
      if (!user?.id || user.role !== 'etudiant') {
        throw new Error("Utilisateur non autorisé");
      }
      
      // Rechercher l'étudiant par user_id au lieu d'utiliser l'ID utilisateur directement
      const response = await fetch(`/gestionadminastration/us-central1/api/v1/etudiants?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status && data.data && data.data.length > 0) {
        return { data: data.data[0] }; // Retourner le premier étudiant trouvé
      } else {
        throw new Error("Aucun étudiant trouvé pour cet utilisateur");
      }
    },
    enabled: !!user?.id && (user.role === 'etudiant'),
  });

  const student = studentData?.data || studentData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      prenom: user?.prenom || "",
      nom: user?.nom || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
      adresse: user?.adresse || "",
      classe_id: student?.classe_id || "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user.id, data);
      
      // Mettre à jour le contexte d'authentification
      updateUser(updatedUser);
      
      // Invalider les queries pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["student", user.id] });
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (!user) return;

    setIsPasswordLoading(true);
    try {
      await userService.changePassword(user.id, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      
      resetPassword();
      
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du changement de mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleReset = () => {
    reset({
      prenom: user?.prenom || "",
      nom: user?.nom || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
      adresse: user?.adresse || "",
      classe_id: student?.classe_id || "",
    });
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Veuillez vous connecter pour accéder à votre profil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos informations personnelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
          <CardDescription>
            Modifiez vos informations personnelles ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  {...register("prenom")}
                  className={errors.prenom ? "border-red-500" : ""}
                />
                {errors.prenom && (
                  <p className="text-sm text-red-500">{errors.prenom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  {...register("nom")}
                  className={errors.nom ? "border-red-500" : ""}
                />
                {errors.nom && (
                  <p className="text-sm text-red-500">{errors.nom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  {...register("telephone")}
                  placeholder="Optionnel"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  {...register("adresse")}
                  placeholder="Optionnel"
                />
              </div>

              {user.role === 'etudiant' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="classe_id">Classe</Label>
                  <Select
                    value={watch("classe_id")}
                    onValueChange={(value) => setValue("classe_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem key={classe.id} value={classe.id || ""}>
                          {classe.nom} - {classe.niveau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Ancien mot de passe</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showPasswords.old ? "text" : "password"}
                  {...registerPassword("oldPassword")}
                  className={passwordErrors.oldPassword ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('old')}
                >
                  {showPasswords.old ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.oldPassword && (
                <p className="text-sm text-red-500">{passwordErrors.oldPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  {...registerPassword("newPassword")}
                  className={passwordErrors.newPassword ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  {...registerPassword("confirmPassword")}
                  className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? "Modification..." : "Modifier le mot de passe"}
              </Button>
              <Button type="button" variant="outline" onClick={() => resetPassword()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations de Compte</CardTitle>
          <CardDescription>
            Informations non modifiables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input
                value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Input
                value={user.isActive ? "Actif" : "Inactif"}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}