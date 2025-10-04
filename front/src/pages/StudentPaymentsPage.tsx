import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import StudentPaymentsAndInvoices from "@/components/StudentPaymentsAndInvoices";
import { getAllPaiements, createPaiement } from "@/api/paiementsApi";
import { getEtudiantById } from "@/api/etudiantsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TestTube, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/use-toast";

// Schéma de validation pour le paiement
const paymentSchema = z.object({
  montant: z.number().min(1, "Le montant doit être supérieur à 0"),
  methode: z.string().min(1, "La méthode de paiement est requise"),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const StudentPaymentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  console.log("Student ID from URL (StudentPaymentsPage):", id);
  console.log("User authenticated:", isAuthenticated, "User:", user);

  // États pour la modale de paiement
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  // Formulaire de paiement
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: 0,
      methode: "",
      description: "",
    },
  });

  // Charger les informations de l'étudiant
  const studentQuery = useQuery({
    queryKey: ["student", id],
    queryFn: () => (id ? getEtudiantById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

  // Mettre à jour studentInfo quand les données sont chargées
  React.useEffect(() => {
    if (studentQuery.data) {
      const student = (studentQuery.data as any)?.data || studentQuery.data;
      setStudentInfo(student);
    }
  }, [studentQuery.data]);

  const allPaymentsQuery = useQuery({
    queryKey: ["allPaiements", id],
    queryFn: () => (id ? getAllPaiements(id) : Promise.resolve({ status: true, data: [] })),
    enabled: !!id,
  });

  const allPayments = useMemo(() => {
    return allPaymentsQuery.data?.data || [];
  }, [allPaymentsQuery.data]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }),
    []
  );

  const totalPaid = useMemo(() => {
    return allPayments.reduce((sum, p) => sum + (Number(p.montantPaye) || 0), 0);
  }, [allPayments]);

  const successfulPayments = useMemo(() => {
    return allPayments.filter(p => p.status === "Confirmé" || p.status === "enregistré").length;
  }, [allPayments]);

  const averageDelay = "12 Jours"; // Placeholder for now

  const [filterPeriod, setFilterPeriod] = useState("Toute l'année");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterMethod, setFilterMethod] = useState("Tous");

  // Fonctions pour gérer le paiement
  const handlePayClick = () => {
    if (studentInfo) {
      const totalPaid = allPayments.reduce((sum, p) => sum + (Number(p.montantPaye) || 0), 0);
      const totalDue = Number(studentInfo.frais_payment) || 0;
      const remaining = Math.max(0, totalDue - totalPaid);
      
      paymentForm.reset({
        montant: remaining > 0 ? remaining : totalDue,
        methode: "",
        description: `Paiement des frais d'inscription et de scolarité`,
      });
      setIsPaymentDialogOpen(true);
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations de l'étudiant",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!id || !studentInfo) return;

    try {
      const paymentData = {
        etudiant_id: id,
        montantPaye: data.montant,
        methode: data.methode,
        mode: data.methode,
        description: data.description || `Paiement des frais d'inscription et de scolarité`,
        status: "Confirmé",
        enregistre_par: user?.nom || "Admin",
        recordedBy_user_id: user?.id || "",
      };

      await createPaiement(paymentData);
      
      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
      });
      
      setIsPaymentDialogOpen(false);
      paymentForm.reset();
      
      // Rafraîchir les données
      allPaymentsQuery.refetch();
      
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <Link to="/payments">
                   <Button variant="outline" size="icon">
                     <ArrowLeft className="h-4 w-4" />
                   </Button>
                 </Link>
                 <h1 className="text-2xl font-bold">Historique des Paiements</h1>
               </div>
               <div className="flex items-center gap-2">
                 <Button 
                   className="bg-green-600 hover:bg-green-700 text-white"
                   size="sm"
                   onClick={handlePayClick}
                   disabled={!studentInfo}
                 >
                   <CreditCard className="h-4 w-4 mr-2" />
                   {studentInfo ? "Payer" : "Chargement..."}
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   onClick={() => {
                     console.log("🧪 Test de l'API des paiements...");
                     console.log("User:", user);
                     console.log("Token:", localStorage.getItem("token"));
                     console.log("API Base URL:", import.meta.env.VITE_API_BASE_URL || "/gestionadminastration/us-central1/api/v1");
                   }}
                 >
                   <TestTube className="h-4 w-4 mr-2" />
                   Test API
                 </Button>
               </div>
             </div>

      {!id ? (
        <Card>
          <CardContent>
            <div className="p-2 text-red-600">
              Aucun identifiant d'étudiant fourni.
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
              {currencyFormatter.format(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">Cette année scolaire</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paiements Réussis
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87m-3-1.13a4 4 0 0 1 0-8" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {successfulPayments} <span className="text-sm text-muted-foreground">Sur {allPayments.length} tentatives</span>
          </div>
        </CardContent>
      </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours Moyen</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDelay}</div>
            <p className="text-xs text-muted-foreground">Délai de paiement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Historique des Paiements</CardTitle>
            <Button>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="mr-2 h-4 w-4"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="12" x2="12" y2="18" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              Exporter PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="period-filter" className="block text-sm font-medium text-muted-foreground mb-1">
                Période
              </label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Toute l'année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Toute l'année">Toute l'année</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-muted-foreground mb-1">
                Statut
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous</SelectItem>
                  <SelectItem value="En traitement">En traitement</SelectItem>
                  <SelectItem value="Confirmé">Confirmé</SelectItem>
                  <SelectItem value="Échoué">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="method-filter" className="block text-sm font-medium text-muted-foreground mb-1">
                Méthode
              </label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous</SelectItem>
                  <SelectItem value="Carte Bancaire">Carte Bancaire</SelectItem>
                  <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {id ? <StudentPaymentsAndInvoices 
            studentId={id} 
            yearFilter={filterPeriod === "Toute l'année" ? "all" : filterPeriod} 
            statusFilter={filterStatus} 
            methodFilter={filterMethod}
          /> : null}
        </CardContent>
      </Card>

      {/* Modale de paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nouveau Paiement</DialogTitle>
            <DialogDescription>
              Enregistrer un nouveau paiement pour {studentInfo?.prenom} {studentInfo?.nom}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (MAD)</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                {...paymentForm.register("montant", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {paymentForm.formState.errors.montant && (
                <p className="text-sm text-red-500">{paymentForm.formState.errors.montant.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="methode">Méthode de paiement</Label>
              <Select onValueChange={(value) => paymentForm.setValue("methode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                </SelectContent>
              </Select>
              {paymentForm.formState.errors.methode && (
                <p className="text-sm text-red-500">{paymentForm.formState.errors.methode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                {...paymentForm.register("description")}
                placeholder="Description du paiement..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Enregistrer le paiement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPaymentsPage;
