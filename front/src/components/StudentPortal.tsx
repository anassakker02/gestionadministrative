import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  CreditCard,
  Receipt,
  Bell,
  User,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  IdCard,
  School,
  Award,
  Users,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Printer,
  LayoutDashboard,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface StudentDashboard {
  etudiant: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    classe: {
      id: string;
      nom: string;
      niveau: string;
    } | null;
    bourse: {
      id: string;
      nom: string;
      description: string;
      pourcentage_remise: number | null;
      montant_remise: number | null;
      isExempt: boolean;
    } | null;
  };
  frais: {
    total: number;
    reductionBourse: number;
    totalAvecReduction: number;
    totalPaye: number;
    montantRestant: number;
    statut: string;
  };
  paiements: Array<{
    id: string;
    montantPaye: number;
    date: string;
    methode: string;
    reference: string;
    statut: string;
    description: string;
  }>;
  factures: Array<{
    id: string;
    numero: string;
    date_emission: string;
    montant_total: number;
    montantPaye: number;
    montantRestant: number;
    statut: string;
  }>;
  anneeScolaire: string;
}

const StudentPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Récupérer les données du tableau de bord - Utiliser les routes alternatives
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => {
      try {
        // Essayer d'abord les routes du portail étudiant
        const response = await apiRequest(
          "/student-portal/portal/dashboard",
          "GET",
        );
        return response.data as StudentDashboard;
      } catch (error) {
        // Si les routes du portail ne fonctionnent pas, utiliser les routes alternatives

        // Récupérer les informations de l'utilisateur
        const userResponse = await apiRequest("/auth/me", "GET");
        const userData = userResponse.data;

        // Récupérer les informations de l'étudiant
        let studentData = null;
        if (userData.role === "etudiant") {
          const studentResponse = await apiRequest(
            `/etudiants?user_id=${userData.id}`,
            "GET",
          );
          studentData = studentResponse.data.data?.[0];
        } else if (userData.role === "parent") {
          // Pour un parent, utiliser les informations de l'utilisateur parent

          try {
            // Vérifier si le parent a un etudiant_id dans ses données utilisateur

            if (userData.etudiant_id) {
              // Récupérer les informations de l'étudiant lié en utilisant l'etudiant_id
              const studentResponse = await apiRequest(
                `/etudiants/${userData.etudiant_id}`,
                "GET",
              );
              studentData = studentResponse.data.data;
            } else {
              // Aucun étudiant lié, créer des données factices basées sur le parent
              studentData = {
                id: `parent-${userData.id}`,
                nom: userData.nom || "Parent",
                prenom: userData.prenom || "Utilisateur",
                email: userData.email,
                telephone: userData.telephone || "Non renseigné",
                adresse: userData.adresse || "Non renseignée",
                classe: null,
                bourse: null,
                frais_payment: 0,
                anneeScolaire: "2024-2025",
                parentId: [userData.id],
                isParentProfile: true, // Marquer comme profil parent
              };
            }
          } catch (error) {
            // En cas d'erreur, créer des données factices
            studentData = {
              id: `parent-${userData.id}`,
              nom: userData.nom || "Parent",
              prenom: userData.prenom || "Utilisateur",
              email: userData.email,
              telephone: userData.telephone || "Non renseigné",
              adresse: userData.adresse || "Non renseignée",
              classe: null,
              bourse: null,
              frais_payment: 0,
              anneeScolaire: "2024-2025",
              parentId: [userData.id],
              isParentProfile: true,
            };
          }
        }

        if (!studentData) {
          throw new Error("Aucun étudiant trouvé pour cet utilisateur");
        }

        // Construire les données du tableau de bord
        const dashboard: StudentDashboard = {
          etudiant: {
            id: studentData.id,
            nom: studentData.nom,
            prenom: studentData.prenom,
            email: studentData.email,
            telephone: studentData.telephone,
            classe: studentData.classe || null,
            bourse: studentData.bourse || null,
          },
          frais: {
            total: studentData.frais_payment || 0,
            reductionBourse: 0,
            totalAvecReduction: studentData.frais_payment || 0,
            totalPaye: 0,
            montantRestant: studentData.frais_payment || 0,
            statut: "En attente",
          },
          paiements: [],
          factures: [],
          anneeScolaire: studentData.anneeScolaire || "2024-2025",
        };

        return dashboard;
      }
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    enabled: !!user && (user.role === "etudiant" || user.role === "parent"),
  });

  // Récupérer l'historique des paiements - Utiliser les routes alternatives
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["student-payments"],
    queryFn: async () => {
      try {
        // Essayer d'abord les routes du portail étudiant
        const response = await apiRequest(
          "/student-portal/portal/payments",
          "GET",
        );
        return response.data;
      } catch (error) {
        // Si les routes du portail ne fonctionnent pas, utiliser les routes alternatives
        return { paiements: [] };
      }
    },
    enabled: !!user && (user.role === "etudiant" || user.role === "parent"),
  });

  // Récupérer les factures - Utiliser les routes alternatives
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["student-invoices"],
    queryFn: async () => {
      try {
        // Essayer d'abord les routes du portail étudiant
        const response = await apiRequest(
          "/student-portal/portal/invoices",
          "GET",
        );
        return response.data;
      } catch (error) {
        // Si les routes du portail ne fonctionnent pas, utiliser les routes alternatives
        return [];
      }
    },
    enabled: !!user && (user.role === "etudiant" || user.role === "parent"),
  });

  const dashboard = dashboardData;
  // Utiliser les paiements du dashboard s'ils existent, sinon utiliser la requête séparée
  const payments = dashboard?.paiements || paymentsData?.paiements || [];
  const invoices = invoicesData || [];

  // Fonction pour formater les dates
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  // Fonction pour formater les montants
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Fonction pour afficher la facture
  const handleDownloadInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setIsInvoiceModalOpen(true);
  };

  // Fonction pour imprimer la facture
  const handlePrintInvoice = () => {
    window.print();
  };

  // Fonction pour obtenir le statut de paiement
  const getPaymentStatus = (statut: string) => {
    switch (statut) {
      case "confirmé":
        return {
          label: "Confirmé",
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case "en_attente":
        return {
          label: "En attente",
          color: "bg-yellow-100 text-yellow-800",
          icon: Clock,
        };
      case "rejeté":
        return {
          label: "Rejeté",
          color: "bg-red-100 text-red-800",
          icon: AlertCircle,
        };
      default:
        return {
          label: statut,
          color: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre portail...</p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erreur lors du chargement des données</p>
          <p className="text-sm text-gray-500 mt-2">
            Veuillez réessayer plus tard
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === "parent" ? "Portail Parent" : "Mon Espace Étudiant"}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === "parent"
              ? "Consultez les informations de scolarité de votre enfant"
              : "Consultez vos informations de scolarité"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {user?.role === "parent"
              ? `${dashboard.etudiant.prenom} ${dashboard.etudiant.nom} (Enfant)`
              : `${dashboard.etudiant.prenom} ${dashboard.etudiant.nom}`}
          </span>
        </div>
      </div>

      {/* Section Parent - Informations sur l'enfant */}
      {user?.role === "parent" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Informations sur votre enfant
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <IdCard className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium text-gray-900">
                    {dashboard.etudiant.prenom} {dashboard.etudiant.nom}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {dashboard.etudiant.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">
                    {dashboard.etudiant.telephone}
                  </p>
                </div>
              </div>
              {dashboard.etudiant.classe && (
                <div className="flex items-center space-x-3">
                  <School className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Classe</p>
                    <p className="font-medium text-gray-900">
                      {dashboard.etudiant.classe.nom}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payé</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(dashboard.frais.totalPaye)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Solde Restant
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatAmount(dashboard.frais.montantRestant)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Retard</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboard.frais.montantRestant > 0 ? "1" : "0"}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>

          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Paiements</span>
          </TabsTrigger>

          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Informations Personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{dashboard.etudiant.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {dashboard.etudiant.telephone || "Non renseigné"}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {dashboard.etudiant.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <School className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {dashboard.etudiant.classe?.nom || "Non assignée"}
                  </span>
                </div>
                {dashboard.etudiant.bourse && (
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {dashboard.etudiant.bourse.nom}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Résumé financier */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span>Résumé Financier</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Frais totaux:</span>
                  <span className="font-medium">
                    {formatAmount(dashboard.frais.total)}
                  </span>
                </div>
                {dashboard.frais.reductionBourse > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Réduction bourse:</span>
                    <span className="font-medium">
                      -{formatAmount(dashboard.frais.reductionBourse)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Total avec réduction:
                  </span>
                  <span className="font-medium">
                    {formatAmount(dashboard.frais.totalAvecReduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total payé:</span>
                  <span className="font-medium text-green-600">
                    {formatAmount(dashboard.frais.totalPaye)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Montant restant:</span>
                  <span className="font-bold text-orange-600">
                    {formatAmount(dashboard.frais.montantRestant)}
                  </span>
                </div>
                <div className="mt-4">
                  <Badge
                    variant={
                      dashboard.frais.montantRestant > 0
                        ? "destructive"
                        : "default"
                    }
                    className="w-full justify-center"
                  >
                    {dashboard.frais.statut}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Paiements */}
        <TabsContent value="payments" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Historique des Paiements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {paymentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Chargement des paiements...
                  </p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun paiement trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const statusInfo = getPaymentStatus(payment.statut);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium text-gray-900">
                                {payment.description || "Paiement"}
                              </h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Montant:</span>
                                <p className="text-green-600 font-semibold">
                                  {formatAmount(payment.montantPaye)}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium">Date:</span>
                                <p>{formatDate(payment.date)}</p>
                              </div>
                              <div>
                                <span className="font-medium">Méthode:</span>
                                <p>{payment.methode || "Non spécifiée"}</p>
                              </div>
                              <div>
                                <span className="font-medium">Référence:</span>
                                <p className="font-mono text-xs">
                                  {payment.reference || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-2"
                              onClick={() => handleDownloadInvoice(payment)}
                            >
                              <FileText className="h-4 w-4" />
                              <span>Facture</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboard.frais.montantRestant > 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium text-orange-900">
                          Prochaine échéance
                        </h4>
                        <p className="text-sm text-orange-700">
                          Vérifiez vos factures en attente. Montant restant:{" "}
                          {formatAmount(dashboard.frais.montantRestant)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">À jour</h4>
                        <p className="text-sm text-green-700">
                          Tous vos paiements sont à jour. Aucune action requise.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de facture */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Facture</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              {/* En-tête de la facture */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                    <h1 className="text-xl font-bold text-gray-900">
                      École Supérieure
                    </h1>
                  </div>
                  <p className="text-gray-600">
                    123 Rue de l'Exemple, 75001 Paris
                  </p>
                  <p className="text-gray-600">contact@ecole.fr</p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    FACTURE
                  </h2>
                  <p className="text-gray-600">
                    Date: {formatDate(selectedPayment.date)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Facture #{selectedPayment.id?.substring(0, 8) || "N/A"}
                  </p>
                </div>
              </div>

              {/* Informations du destinataire */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Facturé à :
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-gray-600">
                    N° Étudiant: {user?.id || "N/A"}
                  </p>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              {/* Tableau des éléments */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-gray-700">
                        Paiement - {selectedPayment.methode || "Non spécifié"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatAmount(selectedPayment.montantPaye || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Résumé */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Sous-total</span>
                  <span className="font-semibold">
                    {formatAmount(selectedPayment.montantPaye || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">TVA (0%)</span>
                  <span className="font-semibold">0.00 MAD</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t bg-green-50 px-4 -mx-4 rounded">
                  <span className="font-bold text-green-800">TOTAL PAYÉ</span>
                  <span className="font-bold text-green-800 text-lg">
                    {formatAmount(selectedPayment.montantPaye || 0)}
                  </span>
                </div>
              </div>

              {/* Message de remerciement */}
              <div className="text-center mt-8">
                <p className="text-gray-600">Merci pour votre paiement.</p>
              </div>

              {/* Bouton d'impression */}
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handlePrintInvoice}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentPortal;
