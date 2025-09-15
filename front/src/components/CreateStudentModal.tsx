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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { createEtudiant, Etudiant, getClassesForStudentForm, getBoursesForStudentForm } from "../api/etudiantsApi";

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  prenom: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  date_naissance: z.date({ required_error: "La date de naissance est requise." }),
  classe_id: z.string({ required_error: "La classe est requise." }),
  nationalite: z.string().min(2, { message: "La nationalité est requise." }),
  bourse_id: z.string().optional(),
});

const CreateStudentModal: React.FC<CreateStudentModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      prenom: "",
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const formattedValues = {
      ...values,
      date_naissance: format(values.date_naissance, "yyyy-MM-dd"),
      bourse_id: values.bourse_id === "none" ? null : values.bourse_id, // Convert "none" to null
    };
    createStudentMutation.mutate(formattedValues as Etudiant);
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_naissance"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de Naissance</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingClasses}>
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger disabled={isLoadingBourses}>
                        <SelectValue placeholder="Sélectionner une bourse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingBourses ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
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

            <Button type="submit" className="mt-4 col-span-2"
            disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? "Ajout en cours..." : "Ajouter l\'étudiant"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudentModal;
