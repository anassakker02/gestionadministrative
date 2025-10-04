import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Calendar, DollarSign, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { paymentPlanService, PaymentPlan } from "@/services/paymentPlanService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Schéma de validation pour le formulaire
const createPaymentPlanSchema = z.object({
  etudiant: z.string().min(1, "Veuillez sélectionner un étudiant"),
  frais: z.string().min(1, "Veuillez sélectionner un frais"),
  nombreVersements: z.string().min(1, "Le nombre de versements est requis"),
  datePremierVersement: z.string().min(1, "La date du premier versement est requise"),
});

type CreatePaymentPlanForm = z.infer<typeof createPaymentPlanSchema>;

const PaymentPlansPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PaymentPlan | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les plans de paiement
  const { data: paymentPlans = [], isLoading, error } = useQuery({
    queryKey: ['payment-plans'],
    queryFn: async () => {
      try {
        const plans = await paymentPlanService.getAllPaymentPlans();
        return Array.isArray(plans) ? plans : [];
      } catch (error) {
        console.error('Erreur lors de la récupération des plans:', error);
        return [];
      }
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreatePaymentPlanForm>({
    resolver: zodResolver(createPaymentPlanSchema),
    defaultValues: {
      nombreVersements: "3",
      datePremierVersement: "2025-09-24"
    }
  });

  const onSubmit = async (data: CreatePaymentPlanForm) => {
    try {
      setIsCreating(true);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour créer un plan de paiement.",
          variant: "destructive",
        });
        return;
      }

      console.log("Données du plan de paiement:", data);
      console.log("Utilisateur connecté:", user);

      // Préparer les données pour l'API
      const planData = {
        name: `Plan de paiement - ${data.etudiant}`,
        anneeScolaire: "2024-2025",
        installments: Array.from({ length: parseInt(data.nombreVersements) }, (_, index) => ({
          percentage: Math.round(100 / parseInt(data.nombreVersements)),
          dueDateOffsetMonths: index,
          description: `Versement ${index + 1}`
        })),
        etudiant_id: data.etudiant,
        frais_id: data.frais,
        date_premier_versement: data.datePremierVersement,
        created_by: user.id,
        created_by_name: `${user.prenom} ${user.nom}`,
        status: 'actif'
      };

      // Appel API réel
      const response = await paymentPlanService.createPaymentPlan(planData);
      
      // Actualiser la liste des plans
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      
      toast({
        title: "Plan créé avec succès",
        description: `Le plan de paiement a été créé pour ${data.etudiant}.`,
      });

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error("Erreur lors de la création du plan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du plan de paiement.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleModifyPlan = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setIsModifyModalOpen(true);
    
    // Pré-remplir le formulaire avec les données du plan
    const etudiantId = plan.name.split(' - ')[1] || '';
    setValue('etudiant', etudiantId);
    setValue('frais', 'frais1'); // Valeur par défaut
    setValue('nombreVersements', plan.installments.length.toString());
    
    // Calculer la date du premier versement
    let datePremierVersement = '2025-09-24';
    if (plan.createdAt) {
      try {
        if (typeof plan.createdAt === 'object' && plan.createdAt && '_seconds' in plan.createdAt) {
          datePremierVersement = new Date((plan.createdAt as any)._seconds * 1000).toISOString().split('T')[0];
        } else if (typeof plan.createdAt === 'string') {
          datePremierVersement = new Date(plan.createdAt).toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
      }
    }
    setValue('datePremierVersement', datePremierVersement);
  };

  const handleModifyCancel = () => {
    setIsModifyModalOpen(false);
    setSelectedPlan(null);
    reset();
  };

  const handleDeletePlan = (plan: PaymentPlan) => {
    setPlanToDelete(plan);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour supprimer un plan de paiement.",
          variant: "destructive",
        });
        return;
      }

      console.log("Suppression du plan de paiement:", planToDelete);

      // Appel API de suppression
      await paymentPlanService.deletePaymentPlan(planToDelete.id);
      
      // Actualiser la liste des plans
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      
      toast({
        title: "Plan supprimé avec succès",
        description: `Le plan de paiement a été supprimé.`,
      });

      setPlanToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du plan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du plan de paiement.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setPlanToDelete(null);
  };

  const onSubmitModify = async (data: CreatePaymentPlanForm) => {
    try {
      setIsCreating(true);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour modifier un plan de paiement.",
          variant: "destructive",
        });
        return;
      }

      if (!selectedPlan) {
        toast({
          title: "Erreur",
          description: "Aucun plan sélectionné pour la modification.",
          variant: "destructive",
        });
        return;
      }

      console.log("Modification du plan de paiement:", data);
      console.log("Plan sélectionné:", selectedPlan);

      // Préparer les données pour l'API de mise à jour
      const updatedPlanData = {
        name: `Plan de paiement - ${data.etudiant}`,
        anneeScolaire: "2024-2025",
        installments: Array.from({ length: parseInt(data.nombreVersements) }, (_, index) => ({
          percentage: Math.round(100 / parseInt(data.nombreVersements)),
          dueDateOffsetMonths: index,
          description: `Versement ${index + 1}`
        })),
        etudiant_id: data.etudiant,
        frais_id: data.frais,
        date_premier_versement: data.datePremierVersement,
        updated_by: user.id,
        updated_by_name: `${user.prenom} ${user.nom}`,
        status: 'actif'
      };

      // Appel API de mise à jour
      const response = await paymentPlanService.updatePaymentPlan(selectedPlan.id, updatedPlanData);
      
      // Actualiser la liste des plans
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] });
      
      toast({
        title: "Plan modifié avec succès",
        description: `Le plan de paiement a été modifié pour ${data.etudiant}.`,
      });

      setIsModifyModalOpen(false);
      setSelectedPlan(null);
      reset();
    } catch (error) {
      console.error("Erreur lors de la modification du plan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification du plan de paiement.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Fonction pour formater les données d'affichage
  const formatPaymentPlanData = (plan: PaymentPlan) => {
    // Extraire l'ID de l'étudiant du nom du plan
    const etudiantId = plan.name.split(' - ')[1] || 'N/A';
    const etudiantName = etudiantId === 'etudiant1' ? 'Fatima Zahra' : 
                        etudiantId === 'etudiant2' ? 'Omar Benali' : 
                        etudiantId === 'etudiant3' ? 'Mohamed Mellouk' : etudiantId;
    
    // Calculer le montant total (simulation)
    const montantTotal = 15000; // MAD
    
    // Calculer les échéances payées (simulation)
    const echeancesPayees = Math.floor(Math.random() * plan.installments.length);
    
    // Calculer la date du premier versement (simulation basée sur la date de création)
    let datePremierVersement = '2025-09-24'; // Valeur par défaut
    
    if (plan.createdAt) {
      try {
        if (typeof plan.createdAt === 'object' && plan.createdAt && '_seconds' in plan.createdAt) {
          datePremierVersement = new Date((plan.createdAt as any)._seconds * 1000).toISOString().split('T')[0];
        } else if (typeof plan.createdAt === 'string') {
          datePremierVersement = new Date(plan.createdAt).toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error);
        datePremierVersement = '2025-09-24';
      }
    }
    
    return {
      id: plan.id,
      etudiant: etudiantName,
      frais: 'Frais de scolarité',
      montantTotal,
      datePremierVersement,
      echeancesPayees,
      totalEcheances: plan.installments.length,
      statut: echeancesPayees === plan.installments.length ? 'Terminé' : 'En cours'
    };
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Plans de Paiement</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Plan
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="bg-white shadow-lg rounded-xl">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-xl font-bold text-blue-900">Liste des plans de paiement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Frais
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Montant Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Date du 1er versement
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Échéances Payées
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2 text-gray-600">Chargement des plans...</span>
                      </div>
                    </td>
                  </tr>
                ) : paymentPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Aucun plan de paiement trouvé
                    </td>
                  </tr>
                ) : (
                  paymentPlans.map((plan) => {
                    const planData = formatPaymentPlanData(plan);
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {planData.etudiant}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {planData.frais}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {planData.montantTotal.toLocaleString()} MAD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(planData.datePremierVersement)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {planData.echeancesPayees}/{planData.totalEcheances}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            planData.statut === 'Terminé' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {planData.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModifyPlan(plan)}
                              className="h-8 w-8 p-0 text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlan(plan)}
                              className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de création de plan de paiement */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Créer un Plan de Paiement
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Étudiant */}
            <div className="space-y-2">
              <Label htmlFor="etudiant" className="text-sm font-medium text-gray-700">
                Étudiant <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("etudiant", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un étudiant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etudiant1">Fatima Zahra</SelectItem>
                  <SelectItem value="etudiant2">Omar Benali</SelectItem>
                  <SelectItem value="etudiant3">Mohamed Mellouk</SelectItem>
                </SelectContent>
              </Select>
              {errors.etudiant && (
                <p className="text-sm text-red-500">{errors.etudiant.message}</p>
              )}
            </div>

            {/* Frais à échelonner */}
            <div className="space-y-2">
              <Label htmlFor="frais" className="text-sm font-medium text-gray-700">
                Frais à échelonner <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("frais", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un frais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frais1">Frais de scolarité</SelectItem>
                  <SelectItem value="frais2">Frais d'inscription</SelectItem>
                  <SelectItem value="frais3">Frais d'examen</SelectItem>
                  <SelectItem value="frais4">Frais de transport</SelectItem>
                </SelectContent>
              </Select>
              {errors.frais && (
                <p className="text-sm text-red-500">{errors.frais.message}</p>
              )}
            </div>

            {/* Nombre de versements */}
            <div className="space-y-2">
              <Label htmlFor="nombreVersements" className="text-sm font-medium text-gray-700">
                Nombre de versements <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombreVersements"
                type="number"
                {...register("nombreVersements")}
                className="w-full"
                min="1"
                max="12"
              />
              {errors.nombreVersements && (
                <p className="text-sm text-red-500">{errors.nombreVersements.message}</p>
              )}
            </div>

            {/* Date du premier versement */}
            <div className="space-y-2">
              <Label htmlFor="datePremierVersement" className="text-sm font-medium text-gray-700">
                Date du 1er versement <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="datePremierVersement"
                  type="date"
                  {...register("datePremierVersement")}
                  className="w-full pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.datePremierVersement && (
                <p className="text-sm text-red-500">{errors.datePremierVersement.message}</p>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-2"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 disabled:opacity-50"
              >
                {isCreating ? "Création..." : "Créer le Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de modification de plan de paiement */}
      <Dialog open={isModifyModalOpen} onOpenChange={setIsModifyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Modifier le Plan de Paiement
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModifyModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitModify)} className="space-y-6">
            {/* Étudiant */}
            <div className="space-y-2">
              <Label htmlFor="etudiant" className="text-sm font-medium text-gray-700">
                Étudiant <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("etudiant", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un étudiant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="etudiant1">Fatima Zahra</SelectItem>
                  <SelectItem value="etudiant2">Omar Benali</SelectItem>
                  <SelectItem value="etudiant3">Mohamed Mellouk</SelectItem>
                </SelectContent>
              </Select>
              {errors.etudiant && (
                <p className="text-sm text-red-500">{errors.etudiant.message}</p>
              )}
            </div>

            {/* Frais à échelonner */}
            <div className="space-y-2">
              <Label htmlFor="frais" className="text-sm font-medium text-gray-700">
                Frais à échelonner <span className="text-red-500">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("frais", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un frais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frais1">Frais de scolarité</SelectItem>
                  <SelectItem value="frais2">Frais d'inscription</SelectItem>
                  <SelectItem value="frais3">Frais d'examen</SelectItem>
                  <SelectItem value="frais4">Frais de transport</SelectItem>
                </SelectContent>
              </Select>
              {errors.frais && (
                <p className="text-sm text-red-500">{errors.frais.message}</p>
              )}
            </div>

            {/* Nombre de versements */}
            <div className="space-y-2">
              <Label htmlFor="nombreVersements" className="text-sm font-medium text-gray-700">
                Nombre de versements <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombreVersements"
                type="number"
                {...register("nombreVersements")}
                className="w-full"
                min="1"
                max="12"
              />
              {errors.nombreVersements && (
                <p className="text-sm text-red-500">{errors.nombreVersements.message}</p>
              )}
            </div>

            {/* Date du premier versement */}
            <div className="space-y-2">
              <Label htmlFor="datePremierVersement" className="text-sm font-medium text-gray-700">
                Date du 1er versement <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="datePremierVersement"
                  type="date"
                  {...register("datePremierVersement")}
                  className="w-full pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.datePremierVersement && (
                <p className="text-sm text-red-500">{errors.datePremierVersement.message}</p>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleModifyCancel}
                className="px-6 py-2"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
              >
                {isCreating ? "Modification..." : "Modifier le Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Supprimer le Plan de Paiement
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlanToDelete(null)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce plan de paiement ? Cette action est irréversible.
            </p>
            
            {planToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Détails du plan :</h4>
                <p className="text-sm text-gray-600">
                  <strong>Étudiant :</strong> {planToDelete.name.split(' - ')[1] || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Échéances :</strong> {planToDelete.installments.length} versements
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={cancelDelete}
                className="px-6 py-2"
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 disabled:opacity-50"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPlansPage;
