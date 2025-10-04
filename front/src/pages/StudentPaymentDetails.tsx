import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import { studentService } from '@/services/studentService';
import { Student } from '@/types/student';
import { getAllPaiements, type Paiement } from '@/api/paiementsApi';
import { factureService } from '@/services/factureService';
import { Facture } from '@/types/facture';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { paymentPlanService, PaymentPlan } from '@/services/paymentPlanService'; // Import PaymentPlanService and PaymentPlan

// Helpers de parsing de dates (faible complexité)
function parsePrimitiveDate(val: unknown): Date | undefined {
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function parseFirestoreLikeDate(val: unknown): Date | undefined {
  if (typeof val !== "object" || val === null) return undefined;
  const anyV = val as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof anyV.toDate === "function") {
    const d = anyV.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
  }
  let seconds: number | undefined;
  if (typeof anyV.seconds === "number") seconds = anyV.seconds;
  if (typeof seconds !== "number" && typeof anyV._seconds === "number")
    seconds = anyV._seconds;
  if (typeof seconds === "number") {
    const d = new Date(seconds * 1000);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

const StudentPaymentDetails: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Return early if studentId is not available
  if (!studentId) {
    return (
      <div className="p-6 text-center text-destructive">
        ID étudiant manquant.
      </div>
    );
  }

  // Helper to safely get date fields
  const getDateField = React.useCallback((obj: unknown, keys: string[]) => {
    if (typeof obj !== "object" || obj === null) return undefined;
    const rec = obj as Record<string, unknown>;
    for (const k of keys) {
      const v = rec[k];
      if (v == null) continue;
      const d1 = parsePrimitiveDate(v);
      if (d1) return d1;
      const d2 = parseFirestoreLikeDate(v);
      if (d2) return d2;
    }
    return undefined;
  }, []);

  // Fetch student details
  const { data: studentData, isLoading: isLoadingStudent } = useQuery<Student>({
    queryKey: ['student', studentId],
    queryFn: async (): Promise<Student> => {
      const response = await studentService.getStudent(studentId);
      if (!response.status || !response.data) {
        throw new Error(response.message || "Student not found");
      }
      return response.data;
    },
    enabled: !!studentId,
  });

  // Fetch the student's payment plan
  const { data: paymentPlan, isLoading: isLoadingPaymentPlan } = useQuery<PaymentPlan>({
    queryKey: ['paymentPlan', studentData?.paymentPlanId],
    queryFn: async (): Promise<PaymentPlan> => {
      if (!studentData?.paymentPlanId) {
        throw new Error("Payment plan ID is missing");
      }
      const response = await paymentPlanService.getPaymentPlanById(studentData.paymentPlanId);
      if (!response) {
        throw new Error("Payment plan not found");
      }
      return response;
    },
    enabled: !!studentData?.paymentPlanId,
  });

  // Fetch all payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery<{ data: Paiement[] }>({
    queryKey: ['allPayments'],
    queryFn: () => getAllPaiements(),
  });

  // Fetch all invoices
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery<{ data: Facture[] }>({
    queryKey: ['allInvoices'],
    queryFn: () => factureService.getFactures(),
  });

  const student = studentData;
  const allPayments = paymentsData?.data || [];
  const allInvoices = invoicesData?.data || [];

  const studentPayments = React.useMemo(() => {
    if (!studentId) return [];
    return allPayments.filter(p => {
      // Assuming a direct student_id in payment or linking via invoice
      return p.etudiant_id === studentId || allInvoices.some(inv => inv.id === p.facture_id && inv.etudiant_id === studentId);
    });
  }, [allPayments, allInvoices, studentId]);

  const studentInvoices = React.useMemo(() => {
    if (!studentId) return [];
    return allInvoices.filter(inv => inv.etudiant_id === studentId);
  }, [allInvoices, studentId]);

  const { totalMontantDu, totalPaid, remainingAmount, paymentWarningStatus, isOverdue, expectedPaidPercentage } = student?.paymentStatus || {
    totalMontantDu: 0,
    totalPaid: 0,
    remainingAmount: 0,
    paymentWarningStatus: "Statut inconnu",
    isOverdue: false,
    expectedPaidPercentage: 0,
  };

  React.useEffect(() => {
    // Only show if not manually overridden and is overdue
    if (isOverdue && student?.paymentOverride !== true) {
      toast({
        title: "Retard de paiement",
        description: `${student?.nom} ${student?.prenom} a un retard de paiement. ${paymentWarningStatus}`,
        variant: "destructive",
      });
    }
  }, [isOverdue, student, paymentWarningStatus, toast]);

  // Helper for formatting money
  const formatMoney = (amount?: number) => {
    return `${(amount ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}`;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'Payé': return <Badge variant="default">Payé</Badge>; // Changed to "default"
      case 'En retard': return <Badge variant="destructive">En retard</Badge>;
      case 'En attente': return <Badge variant="secondary">En attente</Badge>; // Changed to "secondary"
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoadingStudent || isLoadingPayments || isLoadingInvoices || isLoadingPaymentPlan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center text-destructive">
        Étudiant non trouvé.
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Paiements de {student.nom} {student.prenom}
          </h1>
          <p className="text-muted-foreground">N° Étudiant: {student.code_massar || student.id}</p>
        </div>
      </div>

      {isOverdue && (
        <Card className="bg-red-50 border-red-200 text-red-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Avertissement de Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{paymentWarningStatus}</p>
            <p className="text-xs mt-2">Montant total dû: {formatMoney(totalMontantDu)}</p>
            <p className="text-xs">Montant payé: {formatMoney(totalPaid)}</p>
            <p className="text-xs">Montant restant: {formatMoney(remainingAmount)}</p>
            <p className="text-xs">Pourcentage attendu: {expectedPaidPercentage}%</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Facture Annuelle</CardTitle>
          <div className="flex items-center space-x-2">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner l'année" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Printer className="mr-2 h-4 w-4" /> Générer Facture {currentYear}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentPlan ? (
            <div className="space-y-2 text-sm">
              <p><strong>Plan de paiement:</strong> {paymentPlan.name} ({paymentPlan.anneeScolaire})</p>
              <p><strong>Installments:</strong></p>
              <ul className="list-disc pl-5">
                {paymentPlan.installments.map((inst, index) => (
                  <li key={index}>{inst.description} - {inst.percentage}% (Échéance: {new Date(new Date().getFullYear(), 9 + inst.dueDateOffsetMonths, 1).toLocaleDateString()})</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">Aucun plan de paiement attribué à cet étudiant.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des Paiements Individuels</CardTitle>
          <CardDescription>Liste de tous les paiements effectués par l'étudiant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Frais</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPayments.length > 0 ? (
                  studentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.description || 'Paiement'}</TableCell>
                      <TableCell>{formatMoney(payment.montantPaye)}</TableCell>
                      <TableCell>{getDateField(payment, ["date"])?.toLocaleDateString('fr-FR') || 'N/A'}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status || 'Inconnu')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Voir Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun paiement trouvé pour cet étudiant.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPaymentDetails;
