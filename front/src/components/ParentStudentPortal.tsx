import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  X,
  Printer,
  LayoutDashboard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAllPaiements } from '@/api/paiementsApi';
import { getFacturesByStudent } from '@/api/facturesApi';
import { getEtudiantById } from '@/api/etudiantsApi';

interface ParentStudentPortalProps {
  studentId?: string;
}

const ParentStudentPortal: React.FC<ParentStudentPortalProps> = ({ studentId }) => {
  const { user, isParent, isEtudiant, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Déterminer l'ID de l'étudiant à afficher
  const currentStudentId = studentId || user?.id;

  // Récupérer les informations complètes de l'étudiant
  const { data: studentData, isLoading: studentLoading } = useQuery({
    queryKey: ['student-details', currentStudentId],
    queryFn: () => getEtudiantById(currentStudentId),
    enabled: !!currentStudentId,
  });

  // Récupérer les paiements de l'étudiant
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['student-payments', currentStudentId],
    queryFn: () => getAllPaiements(currentStudentId),
    enabled: !!currentStudentId,
  });

  // Récupérer les factures de l'étudiant
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['student-invoices', currentStudentId],
    queryFn: () => getFacturesByStudent(currentStudentId || ''),
    enabled: !!currentStudentId,
  });

  const payments = paymentsData?.data || [];
  const invoices = invoicesData?.data || [];
  const student = studentData?.data;

  // Fonction pour formater les dates
  const formatDateSafe = (dateValue: any): string => {
    if (!dateValue) return "N/A";
    
    let date: Date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue && typeof dateValue === 'object' && dateValue._seconds) {
      date = new Date(dateValue._seconds * 1000);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return "N/A";
    }
    
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("fr-FR");
  };

  // Calculer les statistiques
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.montantPaye || 0), 0);
  const totalDue = invoices.reduce((sum, invoice) => sum + (invoice.montant_total || 0), 0);
  const remainingBalance = totalDue - totalPaid;
  const overdueInvoices = invoices.filter(invoice => 
    invoice.statut === 'impayée' && 
    new Date(invoice.date_echeance || '') < new Date()
  );

  // Fonction pour afficher la facture
  const handleDownloadInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setIsInvoiceModalOpen(true);
  };

  // Fonction pour imprimer la facture
  const handlePrintInvoice = () => {
    window.print();
  };

  if (!isParent && !isEtudiant && !isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">
              Accès refusé. Cette page est réservée aux parents, étudiants et administrateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Portail Administrateur' : isParent ? 'Portail Parent' : 'Mon Espace Étudiant'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin ? 'Consultez vos informations personnelles et de gestion' : isParent ? 'Suivez la scolarité de votre enfant' : 'Consultez vos informations de scolarité'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-sm">
              <User className="h-4 w-4 mr-2" />
              {user?.prenom} {user?.nom}
            </Badge>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Payé</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalPaid.toLocaleString()} MAD
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
                  <p className="text-sm font-medium text-gray-600">Solde Restant</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {remainingBalance.toLocaleString()} MAD
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Factures</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {invoices.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600" />
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
                    {overdueInvoices.length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Mon Profil</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Paiements</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Factures</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Derniers paiements */}
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    Derniers Paiements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <p>Chargement...</p>
                  ) : payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{payment.montantPaye?.toLocaleString()} MAD</p>
                            <p className="text-sm text-gray-600">
                              {new Date(payment.createdAt || payment.date || '').toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge variant={payment.status === 'Confirmé' ? 'default' : 'secondary'}>
                            {payment.status || 'En attente'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun paiement trouvé</p>
                  )}
                </CardContent>
              </Card>

              {/* Factures en attente */}
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-orange-600" />
                    Factures en Attente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <p>Chargement...</p>
                  ) : invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.filter(inv => inv.statut !== 'payée').slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{invoice.numero}</p>
                            <p className="text-sm text-gray-600">
                              {invoice.montantRestant?.toLocaleString()} MAD restant
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={invoice.statut === 'impayée' ? 'destructive' : 'secondary'}>
                              {invoice.statut}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune facture en attente</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {studentLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p>Chargement des informations...</p>
                </CardContent>
              </Card>
            ) : student ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations personnelles */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Informations Personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <IdCard className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nom complet</p>
                          <p className="text-lg font-semibold">{student.nom} {student.prenom}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-lg">{student.email || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Téléphone</p>
                          <p className="text-lg">{student.telephone || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Date de naissance</p>
                          <p className="text-lg">{formatDateSafe(student.date_naissance || student.dateNaissance || student.birth_date || student.birthDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Adresse</p>
                          <p className="text-lg">{student.adresse || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <IdCard className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nationalité</p>
                          <p className="text-lg">{student.nationalite || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations académiques */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center">
                      <School className="h-5 w-5 mr-2 text-green-600" />
                      Informations Académiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <GraduationCap className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Numéro étudiant</p>
                          <p className="text-lg font-semibold">{student.numero_etudiant || student.id || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <School className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Classe</p>
                          <p className="text-lg">{student.classe?.nom || student.classe_id || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Award className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Bourse</p>
                          <p className="text-lg">{student.bourse?.nom || student.bourse_id || "Aucune"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Année scolaire</p>
                          <p className="text-lg">{student.annee_scolaire || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Statut</p>
                          <Badge variant={student.status === 'actif' ? 'default' : 'secondary'}>
                            {student.status || 'Actif'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations financières */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      Informations Financières
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total payé</p>
                          <p className="text-lg font-semibold text-green-600">
                            {totalPaid.toLocaleString()} MAD
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Solde restant</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {remainingBalance.toLocaleString()} MAD
                          </p>
                        </div>
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Frais à payer</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {student.frais_payment ? `${student.frais_payment.toLocaleString()} MAD` : "N/A"}
                          </p>
                        </div>
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations familiales */}
                <Card className="hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Informations Familiales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Parent/Responsable</p>
                          <p className="text-lg">{student.parent?.nom || student.parent_id || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email parent</p>
                          <p className="text-lg">{student.parent?.email || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Téléphone parent</p>
                          <p className="text-lg">{student.parent?.telephone || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">Aucune information d'étudiant trouvée</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Historique des Paiements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <p>Chargement des paiements...</p>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <p className="font-medium">{payment.montantPaye?.toLocaleString()} MAD</p>
                              <Badge variant={payment.status === 'Confirmé' ? 'default' : 'secondary'}>
                                {payment.status || 'En attente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {payment.mode || payment.methode} • {payment.qui_a_paye}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(payment.createdAt || payment.date || '').toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="ml-4 flex flex-col space-y-2">
                            {payment.justificatif_url && (
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Justificatif
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center space-x-2"
                              onClick={() => handleDownloadInvoice(payment)}
                            >
                              <FileText className="h-4 w-4" />
                              <span>Facture</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-orange-600" />
                  Factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <p>Chargement des factures...</p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{invoice.numero}</p>
                            <p className="text-sm text-gray-600">
                              {invoice.montant_total?.toLocaleString()} MAD
                            </p>
                            <p className="text-sm text-gray-500">
                              Échéance: {new Date(invoice.date_echeance || '').toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              invoice.statut === 'payée' ? 'default' : 
                              invoice.statut === 'impayée' ? 'destructive' : 'secondary'
                            }>
                              {invoice.statut}
                            </Badge>
                            <Button size="sm" variant="outline" className="mt-2">
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overdueInvoices.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <p className="font-medium text-red-800">
                            {overdueInvoices.length} facture(s) en retard
                          </p>
                          <p className="text-sm text-red-600">
                            Veuillez régulariser votre situation
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium text-blue-800">
                          Prochaine échéance
                        </p>
                        <p className="text-sm text-blue-600">
                          Vérifiez vos factures en attente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
                    <h1 className="text-xl font-bold text-gray-900">École Supérieure</h1>
                  </div>
                  <p className="text-gray-600">123 Rue de l'Exemple, 75001 Paris</p>
                  <p className="text-gray-600">contact@ecole.fr</p>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">FACTURE</h2>
                  <p className="text-gray-600">
                    Date: {formatDateSafe(selectedPayment.date || selectedPayment.createdAt)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Facture #{selectedPayment.id?.substring(0, 8) || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Informations du destinataire */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Facturé à :</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">
                    {student?.prenom} {student?.nom}
                  </p>
                  <p className="text-gray-600">
                    N° Étudiant: {student?.user_id || student?.id || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    {student?.email || user?.email}
                  </p>
                </div>
              </div>

              {/* Tableau des éléments */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 text-gray-700">
                        Paiement - {selectedPayment.methode || selectedPayment.mode || 'Non spécifié'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {(selectedPayment.montantPaye || 0).toLocaleString('fr-FR')} MAD
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
                    {(selectedPayment.montantPaye || 0).toLocaleString('fr-FR')} MAD
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">TVA (0%)</span>
                  <span className="font-semibold">0.00 MAD</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t bg-green-50 px-4 -mx-4 rounded">
                  <span className="font-bold text-green-800">TOTAL PAYÉ</span>
                  <span className="font-bold text-green-800 text-lg">
                    {(selectedPayment.montantPaye || 0).toLocaleString('fr-FR')} MAD
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

export default ParentStudentPortal;
