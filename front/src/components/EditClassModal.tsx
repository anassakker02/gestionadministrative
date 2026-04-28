import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Classe, updateClasse } from "../api/classesApi";
import type { AxiosError } from "axios";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classe: Classe | null;
}

const allowedNiveaux = [
  "1ère année",
  "2ème année",
  "3ème année",
  "Master 1",
  "Master 2",
  "Doctorat",
] as const;

const formSchema = z.object({
  nom: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  // Niveau: on laisse tout string ici pour ne pas bloquer les valeurs historiques hors liste.
  // On validera côté client uniquement si l'utilisateur change la valeur.
  niveau: z.string().min(1, { message: "Le niveau est requis." }),
  capacite: z.coerce
    .number()
    .min(1, { message: "La capacité doit être au moins 1." })
    .max(50, { message: "La capacité ne doit pas dépasser 50." }),
  description: z.string().optional(),
  annee_scolaire: z
    .string()
    .min(4, { message: "L'année scolaire doit contenir 4 chiffres." }),
});

const EditClassModal: React.FC<EditClassModalProps> = ({
  isOpen,
  onClose,
  classe,
}) => {
  const queryClient = useQueryClient();
  // Liste des niveaux standard + injection dynamique de la valeur existante si absente
  const baseLevels: string[] = (allowedNiveaux as readonly string[]).slice();
  const currentLevel = classe?.niveau ? String(classe.niveau) : "";
  const levels =
    currentLevel && !baseLevels.includes(currentLevel as string)
      ? [currentLevel, ...baseLevels]
      : baseLevels;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: classe?.nom ?? "",
      niveau: classe?.niveau ? String(classe.niveau) : "",
      capacite: classe?.capacite ?? 1,
      description:
        classe?.description != null ? String(classe.description) : "",
      annee_scolaire:
        classe?.annee_scolaire != null ? String(classe.annee_scolaire) : "",
    },
  });

  useEffect(() => {
    if (classe) {
      form.reset({
        nom: classe.nom ?? "",
        niveau: classe.niveau ? String(classe.niveau) : "",
        capacite: classe.capacite ?? 1,
        description:
          classe.description != null ? String(classe.description) : "",
        annee_scolaire:
          classe.annee_scolaire != null ? String(classe.annee_scolaire) : "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classe, isOpen]);

  const updateClassMutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      if (!classe?.id) throw new Error("Identifiant de la classe manquant");
      // Si l'utilisateur a changé le niveau, vérifier qu'il est autorisé par le backend
      const niveauChanged = (values.niveau ?? "") !== (classe.niveau ?? "");
      if (
        niveauChanged &&
        !allowedNiveaux.includes(
          values.niveau as (typeof allowedNiveaux)[number]
        )
      ) {
        toast({
          title: "Niveau invalide",
          description:
            "Veuillez sélectionner un niveau parmi les valeurs autorisées.",
          variant: "destructive",
        });
        // Annuler la mutation
        return Promise.reject(new Error("NIVEAU_INVALIDE_CLIENT"));
      }

      // Construire un payload minimal avec uniquement les champs modifiés
      const payload: Partial<Classe> = {};
      const nomTrim = (values.nom ?? "").trim();
      if (nomTrim !== (classe.nom ?? "")) payload.nom = nomTrim;

      if (niveauChanged) payload.niveau = values.niveau;

      const cap = Number(values.capacite ?? 0);
      if (cap !== Number(classe.capacite ?? 0)) payload.capacite = cap;

      const descTrim = (values.description ?? "").trim();
      if (descTrim !== (classe.description ?? ""))
        payload.description = descTrim;

      const annee = values.annee_scolaire ?? "";
      if (annee !== (classe.annee_scolaire ?? ""))
        payload.annee_scolaire = annee;

      if (Object.keys(payload).length === 0) {
        toast({
          title: "Aucun changement",
          description: "Aucune modification détectée.",
        });
        return Promise.resolve({ __noChange: true } as unknown as Classe);
      }

      return updateClasse(classe.id, payload as Classe);
    },
    onSuccess: (data) => {
      if ((data as unknown as { __noChange?: boolean })?.__noChange) {
        // Pas d'invalidation ni de fermeture de modal, on a déjà toasté
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Classe mise à jour",
        description:
          "Les informations de la classe ont été modifiées avec succès.",
      });
      onClose();
    },
    onError: (error: unknown) => {
      if ((error as Error)?.message === "NIVEAU_INVALIDE_CLIENT") {
        // Message déjà affiché
        return;
      }
      const err = error as AxiosError<{ message?: string; error?: string }>;
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error;
      const message = serverMsg || err?.message || "Erreur inconnue";
      toast({
        title: "Erreur",
        description: `Échec de la modification: ${message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateClassMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        key={classe?.id || "edit-class"}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Modifier la classe</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de la classe sélectionnée.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la classe</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Informatique A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="niveau"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacité</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 40" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Promotion Master Informatique"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="annee_scolaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Année Scolaire</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="mt-4 w-full"
              disabled={updateClassMutation.isPending}
            >
              {updateClassMutation.isPending
                ? "Mise à jour..."
                : "Enregistrer les modifications"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassModal;
