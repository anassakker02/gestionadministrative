import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createParent } from "@/api/parentsApi";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Users, AlertCircle, RefreshCw } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorAlert } from "@/components/ErrorAlert";
import { getEtudiants } from "@/api/etudiantsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const parentSchema = z.object({
  nom: z.string().min(2, { message: "Le nom est requis." }),
  prenom: z.string().min(2, { message: "Le prénom est requis." }),
  email: z.string().email({ message: "Email invalide." }),
  telephone: z.string()
    .min(10, { message: "Le téléphone doit contenir au moins 10 caractères." })
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, { message: "Format de téléphone invalide. Utilisez uniquement des chiffres, espaces, tirets et parenthèses." }),
  adresse: z.string().min(5, { message: "L'adresse est requise." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
  etudiant_id: z.string().min(1, { message: "L'étudiant est requis." }),
});

type ParentFormData = z.infer<typeof parentSchema>;

const CreateParentForm = () => {
  const { canManageUsers } = useAuth();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const form = useForm<ParentFormData>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      password: "",
      etudiant_id: "",
    },
  });

  const createParentMutation = useMutation({
    mutationFn: (data: ParentFormData) => createParent(data),
    onSuccess: (response) => {
      toast({
        title: "Parent créé",
        description: `${response.prenom} ${response.nom} a été créé avec succès. Le compte utilisateur est maintenant actif.`,
      });
      form.reset();
      setRetryCount(0);
      setLastError(null);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Erreur lors de la création du parent";
      setLastError(errorMessage);
      
      // Détecter les erreurs d'encryption
      const isEncryptionError = errorMessage.includes("encryption") || 
                               errorMessage.includes("Invalid key length") ||
                               errorMessage.includes("validation des données");
      
      if (isEncryptionError && retryCount < 2) {
        toast({
          title: "Erreur technique détectée",
          description: "Problème d'encryption détecté. Tentative de récupération automatique...",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: ParentFormData) => {
    setRetryCount(0);
    setLastError(null);
    createParentMutation.mutate(data);
  };

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Attendre un peu avant de réessayer
    setTimeout(() => {
      const formData = form.getValues();
      createParentMutation.mutate(formData);
      setIsRetrying(false);
    }, 1000 * retryCount); // Délai progressif
  };

  const handleClearError = () => {
    setLastError(null);
    setRetryCount(0);
  };

  // Charger les étudiants au montage du composant
  useEffect(() => {
    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        console.log("🔍 Chargement des étudiants...");
        const response = await getEtudiants();
        console.log("📊 Réponse brute:", response);
        
        // Gérer la structure de la réponse (peut être un array direct ou { data: array })
        const studentsData = Array.isArray(response) ? response : (response.data || []);
        console.log("📋 Données des étudiants:", studentsData);
        console.log("📊 Nombre d'étudiants:", studentsData.length);
        
        setStudents(studentsData);
        
        if (studentsData.length > 0) {
          console.log("✅ Étudiants chargés avec succès");
          console.log("👥 Premier étudiant:", studentsData[0]);
        } else {
          console.warn("⚠️ Aucun étudiant trouvé");
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des étudiants:", error);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Seuls les administrateurs peuvent créer des parents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Créer un Parent
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Affichage des erreurs avec options de récupération */}
        {lastError && (
          <ErrorAlert
            error={lastError}
            onRetry={retryCount < 2 ? handleRetry : undefined}
            onDismiss={handleClearError}
            isRetrying={isRetrying}
            retryCount={retryCount}
            maxRetries={2}
          />
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Prénom du parent"
                {...form.register("prenom")}
              />
              {form.formState.errors.prenom && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.prenom.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Nom du parent"
                {...form.register("nom")}
              />
              {form.formState.errors.nom && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nom.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                placeholder="+212 6XX XXX XXX"
                {...form.register("telephone")}
              />
              {form.formState.errors.telephone && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.telephone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Format accepté: +212 6XX XXX XXX ou 06XX XXX XXX
              </p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="Adresse complète du parent"
                {...form.register("adresse")}
              />
              {form.formState.errors.adresse && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.adresse.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="etudiant_id">Étudiant à lier *</Label>
              <Select onValueChange={(value) => form.setValue("etudiant_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingStudents ? "Chargement..." : "Sélectionner un étudiant *"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudents ? (
                    <SelectItem value="loading" disabled>Chargement des étudiants...</SelectItem>
                  ) : (
                    students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.prenom} {student.nom}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Lier ce parent à un étudiant existant (obligatoire)
              </p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe (min 6 caractères)"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {lastError && retryCount >= 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearError}
                className="flex items-center gap-2"
              >
                Effacer l'erreur
              </Button>
            )}
            <Button
              type="submit"
              disabled={createParentMutation.isPending || isRetrying}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              {createParentMutation.isPending || isRetrying
                ? "Création..."
                : "Créer Parent"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateParentForm;
