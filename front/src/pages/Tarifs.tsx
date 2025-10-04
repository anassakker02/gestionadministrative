import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTarifs,
  createTarif,
  updateTarif,
  deleteTarif,
  Tarif,
} from "../api/tarifsApi";
import StudentFeesCalculator from "@/components/StudentFeesCalculator";
import NotificationTest from "@/components/NotificationTest";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Calculator, Bell } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const tarifFormSchema = z.object({
  type: z.enum(["Scolarité", "Autres frais", "Cantine"], {
    required_error: "Veuillez sélectionner un type.",
  }),
  nom: z.string().min(1, { message: "Veuillez entrer un nom pour le tarif." }),
  montant: z.preprocess(
    (val) => Number(val),
    z.number().positive({ message: "Le montant doit être un nombre positif." })
  ),
  annee_scolaire: z
    .string()
    .min(1, { message: "Veuillez entrer l'année scolaire." }),
  nationalite: z.string().optional(),
  reductions: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

type TarifFormValues = z.infer<typeof tarifFormSchema>;

const Tarifs = () => {
  // Utility to handle Firestore Timestamp-like objects, Date, number, string
  const hasToDate = (x: unknown): x is { toDate: () => Date } =>
    typeof x === "object" &&
    x !== null &&
    typeof (x as Record<string, unknown>)["toDate"] === "function";
  const formatDate = (d: unknown): string | null => {
    if (!d) return null;
    try {
      // Firestore Timestamp object
      if (typeof d === "object" && d !== null) {
        if (hasToDate(d)) {
          return d.toDate().toLocaleDateString("fr-FR");
        }
        if ((d as { _seconds?: number })._seconds) {
          const sec = (d as { _seconds: number })._seconds;
          return new Date(sec * 1000).toLocaleDateString("fr-FR");
        }
        if ((d as { seconds?: number }).seconds) {
          const sec = (d as { seconds: number }).seconds;
          return new Date(sec * 1000).toLocaleDateString("fr-FR");
        }
        if (d instanceof Date) return d.toLocaleDateString("fr-FR");
      }
      if (typeof d === "number") return new Date(d).toLocaleDateString("fr-FR");
      if (typeof d === "string") {
        const parsed = Date.parse(d);
        if (!isNaN(parsed)) return new Date(parsed).toLocaleDateString("fr-FR");
        return d;
      }
      return null;
    } catch (e) {
      return null;
    }
  };
  const formatDateForInput = (d: unknown): Date | undefined => {
    if (!d) return undefined;
    try {
      const date = new Date(
        typeof d === "object" &&
        d !== null &&
        "toDate" in d &&
        typeof d.toDate === "function"
          ? d.toDate()
          : (d as string | number | Date)
      );
      return isNaN(date.getTime()) ? undefined : date;
    } catch (e) {
      return undefined;
    }
  };
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery<
    { data: Tarif[] },
    Error
  >({
    queryKey: ["tarifs"],
    queryFn: getTarifs,
  });
  const tarifsArray: Tarif[] = Array.isArray(data?.data)
    ? (data.data as Tarif[])
    : [];

  // Debug: Log des tarifs récupérés
  React.useEffect(() => {
    console.log("📊 Tarifs récupérés:", {
      isLoading,
      isError,
      error: error?.message,
      dataRaw: data,
      tarifsCount: tarifsArray.length,
      tarifs: tarifsArray
    });
  }, [data, isLoading, isError, error, tarifsArray]);



  const createMutation = useMutation({
    mutationFn: createTarif,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarifs"] });
      queryClient.refetchQueries({ queryKey: ["tarifs"] });
      setFormOpen(false);
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, tarif }: { id: string; tarif: Partial<Tarif> }) =>
      updateTarif(id, tarif as Tarif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarifs"] });
      queryClient.refetchQueries({ queryKey: ["tarifs"] });
      setFormOpen(false);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTarif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tarifs"] }),
  });

  const handleDelete = (id: string | undefined) => {
    if (id) {
      deleteMutation.mutate(id);
    }
  };

  const { user, isAdmin, isComptable, isSubAdmin } = useAuth();
  const canManageTarifs = isAdmin || isComptable || isSubAdmin;

  // Ajout du formulaire de création/édition
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarif, setEditTarif] = React.useState<Tarif | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>('');

  const form = useForm<TarifFormValues>({
    resolver: zodResolver(tarifFormSchema),
    defaultValues: {
      type: "Scolarité",
      nom: "",
      montant: 0,
      annee_scolaire: "",
      nationalite: "",
      reductions: [],
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (editTarif) {
      const formData: TarifFormValues = {
        type: (editTarif.type as "Scolarité" | "Autres frais" | "Cantine") || "Scolarité",
        nom: editTarif.nom || "",
        montant: editTarif.montant || 0,
        annee_scolaire: editTarif.annee_scolaire || "",
        nationalite: editTarif.nationalite || "",
        reductions: editTarif.reductions || [],
        isActive: !!editTarif.isActive,
      };
      form.reset(formData);
      setSelectedType(editTarif.type || "Scolarité");
    } else {
      // Reset avec des valeurs par défaut pour un nouveau tarif
      form.reset({
        type: "Scolarité",
        nom: "",
        montant: 0,
        annee_scolaire: "",
        nationalite: "",
        reductions: [],
        isActive: true,
      });
      setSelectedType("Scolarité");
    }
  }, [editTarif, form]);

  // Reset du formulaire quand le modal s'ouvre pour un nouveau tarif
  React.useEffect(() => {
    if (formOpen && !editTarif) {
      form.reset({
        type: "Scolarité",
        nom: "",
        montant: 0,
        annee_scolaire: "",
        nationalite: "",
        reductions: [],
        isActive: true,
      });
      setSelectedType("Scolarité");
    }
  }, [formOpen, editTarif, form]);

  const onSubmit = (values: TarifFormValues) => {
    const tarifToSubmit = {
      ...values,
      // Ensure reductions is an array, even if empty
      reductions: values.reductions || [],
    };

    if (editTarif?.id) {
      updateMutation.mutate({ id: editTarif.id, tarif: tarifToSubmit });
    } else {
      createMutation.mutate(tarifToSubmit as Tarif);
    }
  };

  const handleEdit = (tarif: Tarif) => {
    setEditTarif(tarif);
    setFormOpen(true);
  };

  const handleAddClick = () => {
    setEditTarif(null);
    setSelectedType("Scolarité");
    setFormOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Gestion des Tarifs
      </h1>

      <Tabs defaultValue="tarifs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tarifs">Liste des Tarifs</TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculateur de Frais
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Test Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tarifs" className="space-y-6">

      {!user ? (
        <div className="text-red-600 font-bold p-4 bg-red-50/50 rounded-md border border-red-200">
          Vous n'êtes pas connecté. Veuillez vous authentifier.
        </div>
      ) : !canManageTarifs && !isSubAdmin ? (
        <div className="text-red-600 font-bold p-4 bg-red-50/50 rounded-md border border-red-200">
          Accès refusé. Vous n'avez pas la permission nécessaire pour accéder à
          cette page.
        </div>
      ) : (
        <>
          <div className="mb-6">
            {canManageTarifs && (
              <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={handleAddClick}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter Tarif
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editTarif ? "Modifier le tarif" : "Ajouter un tarif"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4 p-4"
                    >
                      {/* Type de tarif - Premier champ */}
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de tarif *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedType(value);
                                form.setValue('nom', ''); // Reset le nom quand on change le type
                              }}
                              value={field.value}
                              disabled={!canManageTarifs}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le type de tarif" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Scolarité">Scolarité</SelectItem>
                                <SelectItem value="Autres frais">Autres frais</SelectItem>
                                <SelectItem value="Cantine">Cantine</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Nom du tarif - Liste déroulante si Scolarité, input libre si Autres */}
                      <FormField
                        control={form.control}
                        name="nom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du tarif *</FormLabel>
                            <FormControl>
                              {selectedType === 'Scolarité' ? (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={!canManageTarifs}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le nom du frais" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Frais Inscription">Frais Inscription</SelectItem>
                                    <SelectItem value="Frais Scolarité">Frais Scolarité</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  placeholder={
                                    selectedType === 'Autres frais' 
                                      ? "Ex: Cantine, Transport, Matériel..." 
                                      : selectedType === 'Cantine'
                                        ? "Ex: Repas du midi, Petit déjeuner..."
                                        : "Sélectionnez d'abord le type de tarif"
                                  }
                                  {...field}
                                  disabled={!canManageTarifs || !selectedType}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="montant"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Montant"
                                {...field}
                                onChange={(event) =>
                                  field.onChange(event.target.valueAsNumber)
                                }
                                disabled={!canManageTarifs}
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
                            <FormLabel>Année scolaire</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 2024-2025"
                                {...field}
                                disabled={!canManageTarifs}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nationalite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationalité</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Marocaine"
                                {...field}
                                disabled={!canManageTarifs}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!canManageTarifs}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Actif</FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Reductions */}
                      <div>
                        <FormLabel>Réductions</FormLabel>
                        {(form.watch("reductions") || []).map((r, i) => (
                          <div key={i} className="flex gap-2 mb-2 items-center">
                            <Input
                              value={r}
                              onChange={(e) => {
                                const newReductions = [
                                  ...(form.getValues("reductions") || []),
                                ];
                                newReductions[i] = e.target.value;
                                form.setValue("reductions", newReductions);
                              }}
                              className="flex-1"
                              disabled={!canManageTarifs}
                            />
                            {canManageTarifs && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  const newReductions = (
                                    form.getValues("reductions") || []
                                  ).filter((_, idx) => idx !== i);
                                  form.setValue("reductions", newReductions);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {canManageTarifs && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              form.setValue("reductions", [
                                ...(form.getValues("reductions") || []),
                                "",
                              ])
                            }
                            className="mt-2"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une
                            réduction
                          </Button>
                        )}
                      </div>

                      {canManageTarifs && (
                        <Button
                          type="submit"
                          className="w-full bg-primary hover:bg-primary-hover"
                        >
                          {editTarif ? "Modifier le tarif" : "Créer le tarif"}
                        </Button>
                      )}
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {isError ? (
            <div className="text-red-600 font-bold p-4 bg-red-50/50 rounded-md border border-red-200">
              {(error as unknown as { response?: { status?: number } })
                ?.response?.status === 401
                ? "Vous n'êtes pas connecté. Veuillez vous authentifier."
                : `Erreur lors de la récupération des tarifs : ${error?.message}`}
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Liste des Frais Scolaires</h2>
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Titre</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Année Scolaire</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Niveau</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                      {canManageTarifs && (
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tarifsArray.map((tarif: Tarif) => (
                      <tr key={tarif.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {tarif.nom || `Tarif - ${tarif.type}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">
                            {tarif.montant} DH
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tarif.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {tarif.annee_scolaire}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {tarif.nationalite || "Toutes"}
                        </td>
                        <td className="py-3 px-4">
                          {tarif.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactif
                            </span>
                          )}
                        </td>
                        {canManageTarifs && (
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(tarif)}
                                className="h-8 w-8 p-0"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(tarif.id!)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
        </TabsContent>
        
        <TabsContent value="calculator">
          <StudentFeesCalculator />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tarifs;
