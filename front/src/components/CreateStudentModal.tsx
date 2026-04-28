import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  createEtudiant,
  Etudiant,
  getClassesForStudentForm,
  getBoursesForStudentForm,
} from "../api/etudiantsApi";
import { studentService } from "../services/studentService";
import { userService } from "@/services/userService";
import { tarifService } from "@/services/tarifService";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  // On sélectionne un user existant si disponible (user_id), sinon on accepte la saisie libre
  user_id: z.string().optional(),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message:
      "La date de naissance est requise et doit être au format AAAA-MM-JJ.",
  }),
  classe_id: z.string({ required_error: "La classe est requise." }),
  nationalite: z.string().min(2, { message: "La nationalité est requise." }),
  bourse_id: z.string().optional(),
});

// Ajout helpers pour années, mois, jours
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: undefined,
      // date_naissance: undefined,
      classe_id: "",
      nationalite: "",
      bourse_id: "",
    },
  });

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["classesForForm"],
    queryFn: getClassesForStudentForm,
  });

  const { data: bourses, isLoading: isLoadingBourses } = useQuery({
    queryKey: ["boursesForForm"],
    queryFn: getBoursesForStudentForm,
  });

  const { data: availableUsersResp } = useQuery({
    queryKey: ["availableUsersForStudent"],
    queryFn: () => userService.getAvailableForStudent(),
  });
  const availableUsers = availableUsersResp?.data || [];

  // Récupérer les tarifs de scolarité pour afficher le calcul automatique
  const { data: scolariteTarifs } = useQuery({
    queryKey: ["scolarite-tarifs"],
    queryFn: () => tarifService.getScolariteTarifs(),
  });

  const createStudentMutation = useMutation({
    mutationFn: (newStudent: Etudiant) => createEtudiant(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiants"] });
      toast({
        title: "Étudiant créé !",
        description: "Le nouvel étudiant a été ajouté avec succès.",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la création de l\'étudiant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const [selectedYear, setSelectedYear] = React.useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(null);

  // Calculer le total des frais de scolarité
  const calculateTotalFees = () => {
    if (!scolariteTarifs?.data) return 0;
    
    const tarifs = scolariteTarifs.data;
    const fraisInscription = tarifs.find((t: any) => t.nom === "Frais Inscription")?.montant || 0;
    const fraisScolarite = tarifs.find((t: any) => t.nom === "Frais scolaire")?.montant || 0;
    
    return fraisInscription + fraisScolarite;
  };

  const totalFees = calculateTotalFees();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    let date_naissance = null;
    if (selectedYear && selectedMonth && selectedDay) {
      date_naissance = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-${String(selectedDay).padStart(2, "0")}`;
    }

    const payload: any = {
      date_naissance,
      classe_id: values.classe_id,
      nationalite: values.nationalite,
      bourse_id: values.bourse_id === "none" ? null : values.bourse_id,
    };

    if ((values as any).user_id) {
      payload.user_id = (values as any).user_id;
    }

    createStudentMutation.mutate(payload);
  };

  React.useEffect(() => {
    if (selectedYear && selectedMonth && selectedDay) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}-${String(selectedDay).padStart(2, "0")}`;
      form.setValue("date_naissance", dateStr);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel étudiant</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour ajouter un nouvel étudiant.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compte utilisateur (sélection)</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.length > 0 ? (
                          availableUsers.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.prenom} {u.nom} ({u.email})
                            </SelectItem>
                          ))
                        ) : (
                          // Radix Select requires non-empty value for items.
                          // Use a sentinel value and keep the item disabled so it cannot be selected.
                          <SelectItem value="no_user_available" disabled>
                            Aucun utilisateur disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_naissance"
              render={() => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de Naissance</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={(val) => setSelectedYear(Number(val))}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(val) => setSelectedMonth(Number(val))}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, idx) => (
                          <SelectItem key={month} value={(idx + 1).toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(val) => setSelectedDay(Number(val))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Jour" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Input placeholder="Ex: Française" {...field} />
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
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingClasses}>
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : (
                        classes?.map((classe: any) => (
                          <SelectItem key={classe.id} value={classe.id}>
                            {classe.nom} ({classe.niveau})
                          </SelectItem>
                        ))
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
                  <FormLabel>Bourse (optionnel)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger disabled={isLoadingBourses}>
                        <SelectValue placeholder="Sélectionner une bourse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingBourses ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : (
                        bourses?.map((bourse: any) => (
                          <SelectItem key={bourse.id} value={bourse.id}>
                            {bourse.nom}
                          </SelectItem>
                        ))
                      )}
                      <SelectItem value="none">Aucune bourse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section d'information sur les frais */}
            <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💰 Calcul automatique des frais</h4>
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
                      💡 Ce montant sera automatiquement calculé lors de la création de l'étudiant
                    </p>
                  </>
                ) : (
                  <p className="text-blue-700">Chargement des tarifs...</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 col-span-2"
              disabled={createStudentMutation.isPending}
            >
              {createStudentMutation.isPending
                ? "Ajout en cours..."
                : "Ajouter l'étudiant"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentModal;
