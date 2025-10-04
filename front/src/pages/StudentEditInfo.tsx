import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { X, User, Plus } from "lucide-react";
import {
  getEtudiantById,
  updateEtudiant,
  getBoursesForStudentForm,
  getClassesForStudentForm,
  type Etudiant,
} from "@/api/etudiantsApi";
import { getParents, createParent as createParentAPI, type ParentItem } from "@/api/parentsApi";

const schema = z.object({
  nationalite: z.string().min(2, { message: "La nationalité est requise." }),
  classe_id: z.string().min(1, { message: "La classe est requise." }),
  bourse_id: z.string().optional(), // vide => aucune bourse
  parentIds: z.array(z.string()).max(2, { message: "Maximum 2 parents autorisés." }), // tableau de parents
});

const parentSchema = z.object({
  nom: z.string().min(2, { message: "Le nom est requis." }),
  prenom: z.string().min(2, { message: "Le prénom est requis." }),
  email: z.string().email({ message: "Email invalide." }),
  telephone: z.string().min(10, { message: "Le téléphone est requis." }),
  adresse: z.string().min(5, { message: "L'adresse est requise." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});


const StudentEditInfo: React.FC = () => {
  const NONE_VALUE = "__none__"; // valeur sentinelle pour Radix Select (pas de value="")
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // États pour la gestion des parents
  const [selectedParents, setSelectedParents] = useState<ParentItem[]>([]);
  const [showParentForm, setShowParentForm] = useState(false);

  const { data: studentResp, isLoading: loadingStudent } = useQuery({
    queryKey: ["etudiant", id],
    queryFn: () =>
      id ? getEtudiantById(id) : Promise.reject(new Error("no-id")),
    enabled: !!id,
  });

  type ClasseItem = { id: string; nom?: string; name?: string };
  type BourseItem = { id: string; nom?: string; name?: string };
  type StudentData = Partial<Etudiant> & {
    classe?: { id?: string; nom?: string };
    bourse?: { id?: string; nom?: string };
    parent_id?: string;
    parentId?: string;
  };

  const student = studentResp?.data as StudentData | undefined;

  const { data: classesData } = useQuery({
    queryKey: ["classes", "for-student-form"],
    queryFn: getClassesForStudentForm,
  });

  const { data: boursesData } = useQuery({
    queryKey: ["bourses", "for-student-form"],
    queryFn: getBoursesForStudentForm,
  });

  const { data: parentsData } = useQuery({
    queryKey: ["parents", "all"],
    queryFn: getParents,
  });

  const defaultValues = useMemo(
    () => ({
      nationalite: student?.nationalite ?? "",
      classe_id: student?.classe_id || student?.classe?.id || "",
      bourse_id: student?.bourse_id || student?.bourse?.id || "",
      parentIds: [], // Initialiser avec un tableau vide
    }),
    [student]
  );


  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues, // keep synced with student data when loaded
  });

  // Formulaire pour créer un nouveau parent
  const parentForm = useForm<z.infer<typeof parentSchema>>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      adresse: "",
      password: "",
    },
  });

  // Charger les parents existants de l'étudiant
  React.useEffect(() => {
    if (student?.parent_id && parentsData) {
      const existingParent = parentsData.find(p => p.id === student.parent_id);
      if (existingParent) {
        setSelectedParents([existingParent]);
        form.setValue("parentIds", [existingParent.id]);
      }
    }
  }, [student, parentsData, form]);

  // Fonctions pour gérer les parents
  const addParent = (parent: ParentItem) => {
    if (selectedParents.length >= 2) {
      toast({
        title: "Limite atteinte",
        description: "Maximum 2 parents autorisés.",
        variant: "destructive",
      });
      return;
    }
    setSelectedParents([...selectedParents, parent]);
    form.setValue("parentIds", [...form.getValues("parentIds"), parent.id]);
  };

  const removeParent = (parentId: string) => {
    const updatedParents = selectedParents.filter(p => p.id !== parentId);
    setSelectedParents(updatedParents);
    form.setValue("parentIds", updatedParents.map(p => p.id));
  };

  const createParent = async (parentData: z.infer<typeof parentSchema>) => {
    try {
      console.log("Données du parent à créer:", parentData);
      
      // Ajouter l'ID de l'étudiant aux données du parent
      const parentDataWithStudent = {
        ...parentData,
        etudiant_id: id // ID de l'étudiant récupéré depuis l'URL
      };
      
      console.log("Données du parent avec étudiant:", parentDataWithStudent);
      const newParent = await createParentAPI(parentDataWithStudent);
      console.log("Parent créé avec succès:", newParent);
      
      addParent(newParent);
      parentForm.reset();
      setShowParentForm(false);
      
      // Rafraîchir la liste des parents
      queryClient.invalidateQueries({ queryKey: ["parents", "all"] });
      
      toast({
        title: "Parent ajouté",
        description: `${parentData.prenom} ${parentData.nom} a été ajouté et lié à l'étudiant. Le compte utilisateur est maintenant actif.`,
      });
    } catch (error) {
      console.error("Erreur création parent:", error);
      console.error("Détails de l'erreur:", error.response?.data || error.message);
      toast({
        title: "Erreur",
        description: `Erreur lors de la création du parent: ${error.response?.data?.message || error.message}`,
        variant: "destructive",
      });
    }
  };


  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      if (!id) throw new Error("ID étudiant manquant");
      const payload: Partial<Etudiant> = {};

      const nat = values.nationalite.trim();
      if (nat !== (student?.nationalite ?? "")) payload.nationalite = nat;

      const cls = values.classe_id;
      if (cls && cls !== (student?.classe_id || student?.classe?.id || ""))
        payload.classe_id = cls;

      const bourse = values.bourse_id || "";
      const currentBourse = student?.bourse_id || student?.bourse?.id || "";
      if (bourse !== currentBourse)
        payload.bourse_id = (bourse || null) as unknown as string;

      // Gérer les parents (pour l'instant, on prend le premier parent)
      const parentIds = values.parentIds;
      if (parentIds.length > 0) {
        payload.parentId = parentIds[0] as unknown as string;
      } else {
        payload.parentId = null as unknown as string;
      }

      if (Object.keys(payload).length === 0) {
        toast({
          title: "Aucun changement",
          description: "Aucune modification détectée.",
        });
        return Promise.resolve();
      }

      return updateEtudiant(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiant", id] });
      toast({ title: "Modifications enregistrées" });
      navigate(`/students/${id}`);
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg = e?.response?.data?.message || e?.message || "Erreur inconnue";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modifier les informations</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Annuler
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nationalité, Classe, Bourse, Parent</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingStudent ? (
            <div>Chargement...</div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                className="grid gap-4 md:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name="nationalite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationalité</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Marocaine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classe_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!classesData}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une classe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(classesData as ClasseItem[] | undefined)?.map(
                            (c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.nom || c.name || c.id}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bourse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bourse</FormLabel>
                      <Select
                        onValueChange={(v) =>
                          field.onChange(v === NONE_VALUE ? "" : v)
                        }
                        value={
                          field.value && field.value.length > 0
                            ? field.value
                            : NONE_VALUE
                        }
                        disabled={!boursesData}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Aucune bourse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Aucune</SelectItem>
                          {(boursesData as BourseItem[] | undefined)?.map(
                            (b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.nom || b.name || b.id}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormLabel>Parents / Responsables</FormLabel>
                  <div className="space-y-4">
                    {/* Liste des parents sélectionnés */}
                    {selectedParents.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedParents.map((parent) => (
                          <Badge key={parent.id} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                            <User className="h-3 w-3" />
                            {parent.prenom} {parent.nom}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeParent(parent.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Sélection de parents existants */}
                    {selectedParents.length < 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Select onValueChange={(value) => {
                            const parent = parentsData?.find(p => p.id === value);
                            if (parent) addParent(parent);
                          }}>
                            <SelectTrigger className="w-[300px]">
                              <SelectValue placeholder="Sélectionner un parent existant" />
                          </SelectTrigger>
                        <SelectContent>
                              {parentsData && parentsData.length > 0 ? (
                                parentsData
                                  .filter(p => !selectedParents.some(sp => sp.id === p.id))
                                  .map((p: ParentItem) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                                      {p.prenom} {p.nom} - {p.email}
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="no-parents" disabled>
                                  Aucun parent disponible
                            </SelectItem>
                              )}
                        </SelectContent>
                      </Select>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowParentForm(true)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Créer Parent
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Formulaire de création de parent */}
                    {showParentForm && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Créer un nouveau parent</h3>
                            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md mt-2">
                              🎯 Ce parent sera automatiquement lié à l'étudiant: <strong>{student?.prenom} {student?.nom}</strong>
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowParentForm(false);
                              parentForm.reset();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Prénom</label>
                            <Input 
                              placeholder="Prénom du parent" 
                              {...parentForm.register("prenom")}
                            />
                            {parentForm.formState.errors.prenom && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.prenom.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Nom</label>
                            <Input 
                              placeholder="Nom du parent" 
                              {...parentForm.register("nom")}
                            />
                            {parentForm.formState.errors.nom && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.nom.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input 
                              type="email" 
                              placeholder="email@example.com" 
                              {...parentForm.register("email")}
                            />
                            {parentForm.formState.errors.email && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.email.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Téléphone</label>
                            <Input 
                              placeholder="+212 6XX XXX XXX" 
                              {...parentForm.register("telephone")}
                            />
                            {parentForm.formState.errors.telephone && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.telephone.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">Adresse</label>
                            <Input 
                              placeholder="Adresse complète du parent" 
                              {...parentForm.register("adresse")}
                            />
                            {parentForm.formState.errors.adresse && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.adresse.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium">Mot de passe</label>
                            <Input 
                              type="password"
                              placeholder="Mot de passe (min 6 caractères)" 
                              {...parentForm.register("password")}
                            />
                            {parentForm.formState.errors.password && (
                              <p className="text-sm text-red-500">
                                {parentForm.formState.errors.password.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2 flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowParentForm(false);
                                parentForm.reset();
                              }}
                            >
                              Annuler
                            </Button>
                            <Button 
                              type="button"
                              onClick={parentForm.handleSubmit(createParent)}
                            >
                              Créer le Parent
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                <div className="md:col-span-2 flex gap-2 justify-end mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEditInfo;
