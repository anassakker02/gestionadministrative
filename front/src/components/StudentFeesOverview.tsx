import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Gift,
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentAcademicYear, isDateInAcademicYear } from '@/utils/academicYear';
import { 
  calculateAllStudentsFees, 
  getFeesSummary,
  type StudentFeesCalculation 
} from '@/utils/studentFeesCalculator';
import { studentService } from '@/services/studentService';
import { recalculateStudentFees } from '@/api/etudiantsApi';
import { toast } from '@/components/ui/use-toast';
import { getTarifs } from '@/api/tarifsApi';
import { getAllPaiements } from '@/api/paiementsApi';
import { getAllBourses } from '@/api/boursesApi';
import { formatCurrency } from '@/utils';

interface StudentFeesOverviewProps {
  className?: string;
}

const StudentFeesOverview: React.FC<StudentFeesOverviewProps> = ({ className }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentAcademicYear = getCurrentAcademicYear();

  // Récupérer les données
  const { data: studentsData } = useQuery({
    queryKey: ['students-fees-overview'],
    queryFn: studentService.getAllStudents,
  });

  const { data: tarifsData } = useQuery({
    queryKey: ['tarifs-fees-overview'],
    queryFn: getTarifs,
  });

  console.log('Tarifs data:', tarifsData); // Debug pour voir le format des données

  const { data: paymentsData } = useQuery({
    queryKey: ['payments-fees-overview'],
    queryFn: () => getAllPaiements(),
  });

  const { data: boursesData } = useQuery({
    queryKey: ['bourses-fees-overview'],
    queryFn: getAllBourses,
  });

  // Mutation pour recalculer les frais
  const recalculateFeesMutation = useMutation({
    mutationFn: recalculateStudentFees,
    onSuccess: (data) => {
      toast({
        title: 'Frais recalculés',
        description: data.message || 'Les frais ont été recalculés avec succès.',
      });
      // Rafraîchir les données des étudiants
      queryClient.invalidateQueries({ queryKey: ['students-fees-overview'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: `Échec du recalcul des frais: ${error.message || 'Une erreur est survenue.'}`,
        variant: 'destructive',
      });
    },
  });

  // Calculer les frais pour tous les étudiants en utilisant frais_payment du backend
  const feesCalculations = useMemo(() => {
    if (!studentsData?.data || !paymentsData?.data) {
      return [];
    }

    const students = studentsData.data as any[];
    const payments = paymentsData.data as any[];
    const bourses = boursesData || [];

    return students.map(student => {
      // Récupérer les paiements de cet étudiant pour l'année scolaire actuelle
      const studentPayments = payments.filter((payment: any) => 
        payment.etudiant_id === student.id &&
        (payment.annee_scolaire === currentAcademicYear.label ||
         (payment.createdAt && isDateInAcademicYear(payment.createdAt, currentAcademicYear)))
      );

      const montantPaye = studentPayments
        .filter((p: any) => p.status === 'Validé' || p.status === 'Confirmé')
        .reduce((sum: number, p: any) => sum + (p.montantPaye || 0), 0);

      const fraisPayment = student.frais_payment || 0;
      const montantRestant = Math.max(0, fraisPayment - montantPaye);

      // Déterminer le statut
      let status: 'paid' | 'partial' | 'unpaid' | 'exempt';
      if (student.bourse && student.bourse.isExempt) {
        status = 'exempt';
      } else if (montantRestant === 0 && fraisPayment > 0) {
        status = 'paid';
      } else if (montantPaye > 0) {
        status = 'partial';
      } else {
        status = 'unpaid';
      }

      return {
        studentId: student.id,
        studentName: `${student.prenom} ${student.nom}`,
        className: student.classe?.nom || 'N/A',
        academicYear: currentAcademicYear.label,
        isBoursier: !!student.bourse_id,
        bourseInfo: student.bourse_id ? bourses.find(b => b.id === student.bourse_id) : null,
        fees: {
          frais_inscription: 0, // Non utilisé avec frais_payment
          frais_scolarite: 0, // Non utilisé avec frais_payment
          frais_total_brut: fraisPayment,
          reduction_bourse: 0, // Calculé côté backend
          frais_total_net: fraisPayment,
        },
        payments: {
          montant_paye: montantPaye,
          montant_restant: montantRestant,
          isPaid: status === 'paid',
        },
        status,
      };
    });
  }, [studentsData, paymentsData, boursesData, currentAcademicYear]);

  // Obtenir le résumé
  const summary = useMemo(() => getFeesSummary(feesCalculations), [feesCalculations]);

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (status: StudentFeesCalculation['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'exempt':
        return <Gift className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Fonction pour obtenir la couleur du badge
  const getStatusBadgeVariant = (status: StudentFeesCalculation['status']) => {
    switch (status) {
      case 'paid':
        return 'default' as const;
      case 'partial':
        return 'secondary' as const;
      case 'unpaid':
        return 'destructive' as const;
      case 'exempt':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status: StudentFeesCalculation['status']) => {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'partial':
        return 'Partiel';
      case 'unpaid':
        return 'Impayé';
      case 'exempt':
        return 'Exempté';
      default:
        return 'Inconnu';
    }
  };

  // Fonction pour voir les détails d'un étudiant
  const handleViewDetails = (studentId: string) => {
    navigate(`/students/${studentId}/payments`);
  };

  if (!studentsData || !tarifsData || !paymentsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} p-4 max-w-7xl mx-auto`}>
      {/* En-tête avec l'année scolaire */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Frais Scolaires - Année {currentAcademicYear.label}</h2>
          <p className="text-muted-foreground text-sm">
            Période : {currentAcademicYear.startDate.toLocaleDateString('fr-FR')} au {currentAcademicYear.endDate.toLocaleDateString('fr-FR')}
          </p>
        </div>
        {/* <Button
          onClick={() => recalculateFeesMutation.mutate()}
          disabled={recalculateFeesMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${recalculateFeesMutation.isPending ? 'animate-spin' : ''}`} />
          {recalculateFeesMutation.isPending ? 'Recalcul...' : 'Recalculer les frais'}
        </Button> */}
      </div>

      {/* Cartes de résumé */}
      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <Card className="w-64">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-3">
            <CardTitle className="text-xs font-medium">Total Étudiants</CardTitle>
            <Users className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 py-2">
            <div className="text-lg font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">
              {summary.exempt} exemptés
            </p>
          </CardContent>
        </Card>

        <Card className="w-64">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-3">
            <CardTitle className="text-xs font-medium">Total Frais</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 py-2">
            <div className="text-lg font-bold">{formatCurrency(summary.totalFees)}</div>
            <p className="text-xs text-muted-foreground">
              Frais annuels
            </p>
          </CardContent>
        </Card>

        

        <Card className="w-64">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-3">
            <CardTitle className="text-xs font-medium">Montant Restant</CardTitle>
            <AlertCircle className="h-3 w-3 text-red-500" />
          </CardHeader>
          <CardContent className="px-3 py-2">
            <div className="text-lg font-bold text-red-600">{formatCurrency(summary.totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">
              À recouvrer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des étudiants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Détail des Frais par Étudiant</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs px-3 py-2">ID Étudiant</TableHead>
                  <TableHead className="text-xs px-3 py-2">Nom</TableHead>
                  <TableHead className="text-xs px-3 py-2 text-right">Frais Net Dû</TableHead>
                  <TableHead className="text-xs px-3 py-2 text-center">Status</TableHead>
                  <TableHead className="text-xs px-3 py-2 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {feesCalculations.map((calculation) => {
                const student = studentsData.data.find((s: any) => s.id === calculation.studentId);
                if (!student) return null;

                return (
                  <TableRow key={calculation.studentId}>
                    <TableCell className="font-mono text-xs px-3 py-2">
                      {student.user_id || student.id || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium text-sm px-3 py-2">
                      {student.prenom} {student.nom}
                    </TableCell>
                    <TableCell className="text-right px-3 py-2">
                      {student.frais_payment ? (
                        <div className="font-semibold text-green-600 text-sm">
                          {formatCurrency(student.frais_payment)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Non calculé</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center px-3 py-2">
                      <div className="flex items-center justify-center">
                        {calculation.isBoursier ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
                            <Gift className="h-3 w-3 mr-1" />
                            Boursier
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 text-xs px-2 py-1">
                            Non Boursier
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-3 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(calculation.studentId)}
                        className="text-primary hover:text-primary-foreground h-7 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeesOverview;
