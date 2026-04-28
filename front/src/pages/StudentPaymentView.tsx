import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Filter, Printer, FileText, X, CreditCard, Calendar, GraduationCap, UserCheck } from "lucide-react";
import { getAllPaiements, createPaiement } from "@/api/paiementsApi";
import { getEtudiantById } from "@/api/etudiantsApi";
import { studentService } from "@/services/studentService";
import StudentIdDisplay from "@/components/StudentIdDisplay";
import StudentHeader from "@/components/StudentHeader";
import StudentInfoDisplay from "@/components/StudentInfoDisplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Schéma de validation pour le formulaire de paiement
const paymentFormSchema = z.object({
  etudiant: z.string().min(1, "L'étudiant est requis"),
  montantPaye: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  methode: z.string().min(1, "La méthode de paiement est requise"),
  numeroReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const StudentPaymentView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  // Debug: Vérifier que l'ID est bien récupéré
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Configuration du formulaire (TOUJOURS en premier, avant tous les autres hooks)
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      etudiant: id || "",
      montantPaye: 0,
      methode: "",
      numeroReference: "",
      notes: "",
    },
  });

  // Récupérer les données de l'étudiant
  const studentQuery = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID de l'étudiant manquant");
      }
      const response = await studentService.getStudent(id);
      return response.data;
    },
    enabled: !!id,
  });

  // Récupérer les paiements
  const paymentsQuery = useQuery({
    queryKey: ["payments", id],
    queryFn: () => getAllPaiements(),
    enabled: !!id,
  });

  const student = studentQuery.data;
  const allPayments = paymentsQuery.data || [];
  
  // Récupérer les données de paiements
  const paymentsData = Array.isArray(allPayments) ? allPayments : (allPayments?.data || []);
  
  // Filtrer les paiements pour l'étudiant sélectionné
  const payments = Array.isArray(paymentsData) ? paymentsData.filter(payment => payment.etudiant_id === id) : [];

  // Calculer les montants
  const totalPaye = Array.isArray(payments) ? payments.reduce((sum, payment) => {
    return sum + (payment.montantPaye || 0);
  }, 0) : 0;

  const fraisPayment = student?.frais_payment || 0;
  const resteAPayer = Math.max(0, fraisPayment - totalPaye);

  // Mettre à jour l'étudiant dans le formulaire quand les données sont chargées
  useEffect(() => {
    if (id) {
      paymentForm.setValue("etudiant", id);
    }
  }, [id, paymentForm]);

  // Calculer le total des paiements pour l'année sélectionnée
  const totalForYear = useMemo(() => {
    if (!Array.isArray(payments)) return 0;
    
    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
        return paymentDate.getFullYear().toString() === selectedYear;
      })
      .reduce((sum, payment) => sum + (payment.montantPaye || 0), 0);
  }, [payments, selectedYear]);

  // Vérifier si l'étudiant est en cours de chargement ou s'il n'existe pas
  if (studentQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données de l'étudiant...</p>
        </div>
      </div>
    );
  }

  if (studentQuery.isError || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Étudiant non trouvé</h2>
          <p className="text-gray-600 mb-4">
            L'étudiant avec l'ID "{id}" n'a pas été trouvé.
          </p>
          <Link to="/payments">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux paiements
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Soumission du formulaire de paiement
  const handlePaymentSubmit = async (data: PaymentFormData) => {
    try {
      // Vérifier que le montant ne dépasse pas le reste à payer
      if (data.montantPaye > resteAPayer) {
        toast({
          title: "Erreur de montant",
          description: `Le montant saisi (${formatAmount(data.montantPaye)}) ne peut pas dépasser le reste à payer (${formatAmount(resteAPayer)})`,
          variant: "destructive",
        });
        return;
      }

      // Date actuelle automatique
      const currentDate = new Date().toISOString();
      
      const paymentData = {
        etudiant_id: data.etudiant,
        montantPaye: data.montantPaye,
        methode: data.methode,
        mode: data.methode,
        numero_reference: data.numeroReference,
        date_paiement: currentDate,
        status: "Validé",
        notes: data.notes,
        description: `Paiement de ${data.montantPaye}€`,
        // Traçabilité de la personne qui enregistre
        enregistre_par: user?.nom || user?.prenom || "Utilisateur",
        recordedBy_user_id: user?.id || "",
        qui_a_paye: user?.nom || user?.prenom || "Utilisateur",
        payer_user_id: user?.id || "",
      };

      await createPaiement(paymentData);
      
      toast({
        title: "Succès",
        description: "Paiement créé avec succès",
      });
      
      setIsPaymentModalOpen(false);
      paymentForm.reset();
      
      // Rafraîchir les données
      paymentsQuery.refetch();
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le paiement",
        variant: "destructive",
      });
    }
  };

  // Formater les montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  // Formater les dates
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    
    let dateObj;
    if (date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formater les dates Firestore
  const formatFirestoreDate = (date: any) => {
    if (!date) return "N/A";
    
    let dateObj;
    if (date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'validé':
      case 'validé':
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case 'en attente':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'refusé':
        return <Badge className="bg-red-100 text-red-800">Refusé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || 'N/A'}</Badge>;
    }
  };

  // Ouvrir la facture
  const handleOpenInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setIsInvoiceModalOpen(true);
  };

  // Générer un ID de facture aléatoire
  const generateInvoiceId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handlePrintInvoice = () => {
    if (!selectedPayment || !student) return;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les popups.');
      return;
    }

    // Contenu HTML avec styles inline pour garantir l'affichage
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture - ${student.prenom} ${student.nom}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
              line-height: 1.4;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
            }
            .invoice-number {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .school-info {
              font-size: 14px;
              color: #666;
            }
            .school-name {
              font-weight: bold;
              color: #059669;
              margin-bottom: 4px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              text-align: right;
              margin-bottom: 8px;
            }
            .invoice-date {
              font-size: 14px;
              color: #666;
              text-align: right;
            }
            .billed-to {
              margin-bottom: 30px;
            }
            .billed-to h3 {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .student-info {
              background: #f9fafb;
              padding: 12px;
              border-radius: 6px;
            }
            .student-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .student-details {
              font-size: 14px;
              color: #666;
              line-height: 1.4;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .details-table th {
              text-align: left;
              padding: 8px 12px;
              border-bottom: 2px solid #e5e7eb;
              font-weight: bold;
              font-size: 14px;
            }
            .details-table td {
              padding: 12px;
              border-bottom: 1px solid #f3f4f6;
              font-size: 14px;
            }
            .details-table td:last-child {
              text-align: right;
              font-weight: bold;
            }
            .summary {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .summary-content {
              width: 256px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 14px;
            }
            .total-section {
              background: #059669;
              color: white;
              padding: 16px;
              border-radius: 6px;
              margin-top: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 30px;
            }
            .thank-you {
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .invoice-container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="header">
              <div>
                <div class="invoice-number">Facture #${generateInvoiceId()}</div>
                <div class="school-info">
                  <div class="school-name">École Supérieure</div>
                  <div>123 Rue de l'Exemple, 75001 Paris</div>
                  <div>contact@ecole.fr</div>
                </div>
              </div>
              <div>
                <div class="invoice-title">
                  ${selectedPayment.id?.startsWith('annual-') ? 'FACTURE ANNUELLE' : 'FACTURE'}
                </div>
                <div class="invoice-date">
                  Date: ${new Date().toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            <!-- Facturé à -->
            <div class="billed-to">
              <h3>Facturé à :</h3>
              <div class="student-info">
                <div class="student-name">
                  ${student.prenom} ${student.nom}
                </div>
                <div class="student-details">
                  N° Étudiant: ${student?.numero_etudiant || student?.id}<br>
                  ${student?.email || "email@exemple.com"}
                </div>
              </div>
            </div>

            <!-- Tableau des détails -->
            <table class="details-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                ${selectedPayment?.id?.startsWith('annual-') ? 
                  // Pour une facture annuelle, afficher tous les paiements de l'année
                  (() => {
                    const annualPayments = Array.isArray(payments) ? payments.filter(payment => {
                      const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                      return paymentDate.getFullYear().toString() === selectedYear;
                    }) : [];
                    
                    return annualPayments.map(payment => {
                      const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                      return `
                        <tr>
                          <td>Paiement des frais de scolarité</td>
                          <td>${paymentDate.toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })}</td>
                          <td>${payment.mode || payment.methode || 'N/A'}</td>
                          <td>${formatAmount(payment.montantPaye || 0)}</td>
                        </tr>
                      `;
                    }).join('');
                  })() : 
                  // Pour un paiement individuel
                  `
                    <tr>
                      <td>Paiement des frais de scolarité</td>
                      <td>${selectedPayment ? formatDate(selectedPayment.date_paiement || selectedPayment.date || selectedPayment.createdAt) : "N/A"}</td>
                      <td>${selectedPayment?.mode || selectedPayment?.methode || 'N/A'}</td>
                      <td>${selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}</td>
                    </tr>
                  `
                }
              </tbody>
            </table>

            <!-- Résumé -->
            <div class="summary">
              <div class="summary-content">
                <div class="summary-row">
                  <span>Sous-total</span>
                  <span>${selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}</span>
                </div>
                <div class="summary-row">
                  <span>TVA (0%)</span>
                  <span>0.00€</span>
                </div>
                <div class="total-section">
                  <div class="total-row">
                    <span>TOTAL PAYÉ</span>
                    <span>${selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="thank-you">Merci pour votre paiement.</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Écrire le contenu dans la nouvelle fenêtre
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  if (studentQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (studentQuery.error || paymentsQuery.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement des données</p>
          <Link to="/payments">
            <Button variant="outline">Retour aux paiements</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Étudiant non trouvé</p>
          <Link to="/payments">
            <Button variant="outline">Retour aux paiements</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/payments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <StudentHeader 
            studentId={id || student?.user_id || student?.id} 
            title="Paiements de"
            showIcon={true}
          />
        </div>

        {/* Informations de l'étudiant */}
        {student && (
          <StudentInfoDisplay 
            student={student} 
            title="Informations de l'étudiant"
          />
        )}

        {/* Facture Annuelle Globale */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Facture Annuelle Globale
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="bg-gray-800 text-white hover:bg-gray-900"
                  onClick={() => {
                    // Générer une facture annuelle pour l'année sélectionnée
                    const annualPayments = Array.isArray(payments) ? payments.filter(payment => {
                      const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                      return paymentDate.getFullYear().toString() === selectedYear;
                    }) : [];
                    
                    if (annualPayments.length === 0) {
                      toast({
                        title: "Aucun paiement",
                        description: `Aucun paiement trouvé pour l'année ${selectedYear}`,
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Créer une facture annuelle fictive
                    const annualInvoice = {
                      id: `annual-${selectedYear}`,
                      montantPaye: totalForYear,
                      date_paiement: new Date().toISOString(),
                      description: `Facture annuelle ${selectedYear}`,
                    };
                    
                    setSelectedPayment(annualInvoice);
                    setIsInvoiceModalOpen(true);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Générer Facture {selectedYear}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {formatAmount(totalPaye)}
                </div>
                <div className="text-xs text-gray-600">Total payé</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {formatAmount(fraisPayment)}
                </div>
                <div className="text-xs text-gray-600">Frais totaux</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">
                  {formatAmount(resteAPayer)}
                </div>
                <div className="text-xs text-gray-600">Reste à payer</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historique des Paiements Individuels */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-4 w-4" />
                Historique des Paiements Individuels
              </CardTitle>
              <Button onClick={() => setIsPaymentModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Paiement
              </Button>
            </div>
            {/* Information sur la colonne de traçabilité */}
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 text-green-700">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Enregistré par :</span>
                </div>
                <span className="text-sm text-green-600">Personne qui a enregistré le paiement dans le système</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Montant</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                    <TableHead className="text-xs font-semibold text-green-700">
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Enregistré par
                      </div>
                    </TableHead>
                    <TableHead className="text-xs">Créé le</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(payments) ? payments
                    .filter(payment => {
                      const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                      return paymentDate.getFullYear().toString() === selectedYear;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt?._seconds ? a.createdAt._seconds * 1000 : a.date_paiement || a.date || a.createdAt);
                      const dateB = new Date(b.createdAt?._seconds ? b.createdAt._seconds * 1000 : b.date_paiement || b.date || b.createdAt);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs p-2">
                          {payment.id?.substring(0, 6)}...
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs">{formatDate(payment.date_paiement || payment.date || payment.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm p-2">
                          {formatAmount(payment.montantPaye || 0)}
                        </TableCell>
                        <TableCell className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {payment.mode || payment.methode || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-2">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="text-xs p-2">
                          <div className="flex items-center gap-2">
                            <UserCheck className={`h-3 w-3 ${payment.enregistre_par ? 'text-green-500' : 'text-gray-400'}`} />
                            <div className="flex flex-col">
                              <span className={`font-medium ${payment.enregistre_par ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                                {payment.enregistre_par || 'Non renseigné'}
                              </span>
                              {payment.recordedBy_user_id && (
                                <span className="text-xs text-gray-500">
                                  ID: {payment.recordedBy_user_id.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                            {payment.enregistre_par && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                ✓
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 p-2">
                          {formatFirestoreDate(payment.createdAt)}
                        </TableCell>
                        <TableCell className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInvoice(payment)}
                            className="h-7 px-2 text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Facture
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Aucun paiement trouvé
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal d'ajout de paiement */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau paiement</DialogTitle>
              <DialogDescription>
                Enregistrer un nouveau paiement pour cet étudiant.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-3">
              {/* Étudiant (lecture seule) */}
              <div className="space-y-1">
                <Label htmlFor="etudiant">Étudiant</Label>
                <Input
                  id="etudiant"
                  value={`${student.prenom} ${student.nom} - N° ${student.user_id || student.id}`}
                  disabled
                  className="bg-gray-50"
                />
                <input type="hidden" {...paymentForm.register("etudiant")} />
              </div>

              {/* Montant à payer */}
              <div className="space-y-1">
                <Label>Montant à payer</Label>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-base font-semibold text-blue-800">
                    {formatAmount(resteAPayer)}
                  </div>
                  <div className="text-xs text-blue-600">
                    Reste à payer sur {formatAmount(fraisPayment)} de frais totaux
                  </div>
                </div>
              </div>

              {/* Montant payé */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                <Label htmlFor="montantPaye">Montant payé (€)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => paymentForm.setValue("montantPaye", resteAPayer)}
                    className="text-xs h-7 px-2"
                  >
                    Remplir ({formatAmount(resteAPayer)})
                  </Button>
                </div>
                <Input
                  id="montantPaye"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={resteAPayer}
                  {...paymentForm.register("montantPaye", { 
                    valueAsNumber: true,
                    required: "Le montant est requis"
                  })}
                  className={paymentForm.formState.errors.montantPaye ? "border-red-500" : ""}
                  placeholder={`Maximum: ${formatAmount(resteAPayer)}`}
                />
                {paymentForm.formState.errors.montantPaye && (
                  <p className="text-red-500 text-sm">
                    {paymentForm.formState.errors.montantPaye.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Montant maximum: {formatAmount(resteAPayer)}
                </p>
              </div>

              {/* Méthode de paiement */}
              <div className="space-y-1">
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
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
                {paymentForm.formState.errors.methode && (
                  <p className="text-sm text-red-600">
                    {paymentForm.formState.errors.methode.message}
                  </p>
                )}
              </div>

              {/* Numéro de référence */}
              <div className="space-y-1">
                <Label htmlFor="numeroReference">Numéro de référence (optionnel)</Label>
                <Input
                  id="numeroReference"
                  {...paymentForm.register("numeroReference")}
                  placeholder="Ex: CHQ-2024-001"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  {...paymentForm.register("notes")}
                  placeholder="Informations supplémentaires..."
                  rows={3}
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer le paiement
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de facture */}
        <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-white p-6 print:p-8 print:max-w-none print:h-auto print:overflow-visible">
              {/* Header de la facture */}
              <div className="flex justify-between items-start mb-6 print:mb-8">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2 print:text-2xl">
                    Facture #{generateInvoiceId()}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <GraduationCap className="h-4 w-4 text-green-600 print:h-5 print:w-5" />
                    <span className="font-semibold text-sm print:text-base">École Supérieure</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 print:text-sm">123 Rue de l'Exemple, 75001 Paris</p>
                  <p className="text-xs text-gray-600 print:text-sm">contact@ecole.fr</p>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-4xl">
                    {selectedPayment?.id?.startsWith('annual-') ? 'FACTURE ANNUELLE' : 'FACTURE'}
                  </h1>
                  <p className="text-sm text-gray-600 print:text-base">
                    Date: {new Date().toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Section Facturé à */}
              <div className="mb-6 print:mb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-2 print:text-lg">Facturé à :</h3>
                <div className="bg-gray-50 p-3 rounded-lg print:p-4">
                  <p className="font-semibold text-gray-900 text-sm print:text-base">
                    {student?.prenom} {student?.nom}
                  </p>
                  <p className="text-gray-600 text-sm print:text-base">
                    N° Étudiant: {student?.numero_etudiant || student?.id}
                  </p>
                  <p className="text-gray-600 text-sm print:text-base">
                    {student?.email || "email@exemple.com"}
                  </p>
                </div>
              </div>

              {/* Tableau des détails */}
              <div className="mb-6 print:mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-3 font-semibold text-gray-900 text-sm print:text-base print:py-3 print:px-4">Description</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-900 text-sm print:text-base print:py-3 print:px-4">Date</th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-900 text-sm print:text-base print:py-3 print:px-4">Mode</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-900 text-sm print:text-base print:py-3 print:px-4">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPayment?.id?.startsWith('annual-') ? (
                      // Pour une facture annuelle, afficher tous les paiements de l'année
                      Array.isArray(payments) ? payments
                        .filter(payment => {
                          const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                          return paymentDate.getFullYear().toString() === selectedYear;
                        })
                        .sort((a, b) => {
                          const dateA = new Date(a.createdAt?._seconds ? a.createdAt._seconds * 1000 : a.date_paiement || a.date || a.createdAt);
                          const dateB = new Date(b.createdAt?._seconds ? b.createdAt._seconds * 1000 : b.date_paiement || b.date || b.createdAt);
                          return dateA.getTime() - dateB.getTime();
                        })
                        .map((payment, index) => {
                          const paymentDate = new Date(payment.createdAt?._seconds ? payment.createdAt._seconds * 1000 : payment.date_paiement || payment.date || payment.createdAt);
                          return (
                            <tr key={payment.id || index} className="border-b border-gray-100">
                              <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                                Paiement des frais de scolarité
                              </td>
                              <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                                {paymentDate.toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })}
                              </td>
                              <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                                {payment.mode || payment.methode || 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-sm print:text-base print:py-4 print:px-4">
                                {formatAmount(payment.montantPaye || 0)}
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr className="border-b border-gray-100">
                            <td colSpan={4} className="py-3 px-3 text-center text-gray-500 text-sm print:text-base print:py-4 print:px-4">
                              Aucun paiement trouvé
                            </td>
                          </tr>
                        )
                    ) : (
                      // Pour un paiement individuel
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                          Paiement des frais de scolarité
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                          {selectedPayment ? formatDate(selectedPayment.date_paiement || selectedPayment.date || selectedPayment.createdAt) : "N/A"}
                        </td>
                        <td className="py-3 px-3 text-gray-600 text-sm print:text-base print:py-4 print:px-4">
                          {selectedPayment?.mode || selectedPayment?.methode || 'N/A'}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-sm print:text-base print:py-4 print:px-4">
                          {selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Résumé */}
              <div className="flex justify-end mb-6 print:mb-8">
                <div className="w-64 print:w-80">
                  <div className="flex justify-between py-1 print:py-2">
                    <span className="text-gray-600 text-sm print:text-base">Sous-total</span>
                    <span className="font-semibold text-sm print:text-base">
                      {selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 print:py-2">
                    <span className="text-gray-600 text-sm print:text-base">TVA (0%)</span>
                    <span className="font-semibold text-sm print:text-base">0.00€</span>
                  </div>
                  <div className="bg-green-600 text-white p-3 rounded-lg mt-3 print:p-4 print:mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base print:text-lg">TOTAL PAYÉ</span>
                      <span className="font-bold text-base print:text-lg">
                        {selectedPayment ? formatAmount(selectedPayment.montantPaye) : "0.00€"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end">
                <p className="text-gray-600 text-sm print:text-base">Merci pour votre paiement.</p>
                <Button 
                  className="bg-black text-white hover:bg-gray-800 text-sm"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentPaymentView;
