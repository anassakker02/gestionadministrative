import { getCurrentAcademicYear, type AcademicYear } from './academicYear';

export interface StudentFeesCalculation {
  studentId: string;
  academicYear: string;
  isBoursier: boolean;
  bourseInfo?: {
    id: string;
    nom: string;
    pourcentage_remise?: number;
    montant_remise?: number;
  };
  fees: {
    frais_inscription: number;
    frais_scolarite: number;
    frais_total_brut: number;
    reduction_bourse: number;
    frais_total_net: number;
  };
  payments: {
    montant_paye: number;
    montant_restant: number;
    isPaid: boolean;
  };
  status: 'paid' | 'partial' | 'unpaid' | 'exempt';
}

export interface StudentData {
  id: string;
  nom: string;
  prenom: string;
  classe_id: string;
  bourse_id?: string | null;
  bourse?: {
    id: string;
    nom: string;
    pourcentage_remise?: number;
    montant_remise?: number;
  } | null;
}

export interface TarifData {
  id: string;
  nom: string;
  classe_id: string;
  montant: number;
  type: 'Scolarité' | 'Inscription' | 'Autres frais';
  annee_scolaire: string;
  isActive: boolean;
}

export interface PaymentData {
  id: string;
  etudiant_id: string;
  montantPaye: number;
  status: string;
  createdAt: string | Date;
  annee_scolaire?: string;
}

/**
 * Calcule les frais scolaires pour un étudiant donné
 */
export function calculateStudentFees(
  student: StudentData,
  tarifs: TarifData[],
  payments: PaymentData[],
  academicYear?: AcademicYear
): StudentFeesCalculation {
  const currentAcademicYear = academicYear || getCurrentAcademicYear();
  const academicYearLabel = currentAcademicYear.label;

  // Vérifier si l'étudiant est boursier
  const isBoursier = !!student.bourse_id && !!student.bourse;
  
  // Si boursier, les frais sont exemptés
  if (isBoursier) {
    return {
      studentId: student.id,
      academicYear: academicYearLabel,
      isBoursier: true,
      bourseInfo: student.bourse ? {
        id: student.bourse.id,
        nom: student.bourse.nom,
        pourcentage_remise: student.bourse.pourcentage_remise,
        montant_remise: student.bourse.montant_remise,
      } : undefined,
      fees: {
        frais_inscription: 0,
        frais_scolarite: 0,
        frais_total_brut: 0,
        reduction_bourse: 0,
        frais_total_net: 0,
      },
      payments: {
        montant_paye: 0,
        montant_restant: 0,
        isPaid: true,
      },
      status: 'exempt',
    };
  }

  // Tous les étudiants paient le même montant (pas de différence par classe)
  // Récupérer les frais globaux pour l'année scolaire
  const fraisGlobaux = tarifs.filter(tarif => 
    tarif.annee_scolaire === academicYearLabel &&
    tarif.isActive &&
    (tarif.type === 'Inscription' || tarif.type === 'Scolarité')
  );

  // Calculer les frais d'inscription et de scolarité (même montant pour tous)
  const fraisInscription = fraisGlobaux
    .filter(t => t.type === 'Inscription')
    .reduce((sum, t) => sum + t.montant, 0);

  const fraisScolarite = fraisGlobaux
    .filter(t => t.type === 'Scolarité')
    .reduce((sum, t) => sum + t.montant, 0);

  // Le montant total que l'étudiant doit payer = Frais Inscription + Frais Scolarité
  const montantFraisBrut = fraisInscription + fraisScolarite;

  // Appliquer la réduction de bourse si l'étudiant est boursier
  let reductionBourse = 0;
  let montantFraisNet = montantFraisBrut;

  if (student.bourse && student.bourse.pourcentage_remise) {
    reductionBourse = (montantFraisBrut * student.bourse.pourcentage_remise) / 100;
    montantFraisNet = Math.max(0, montantFraisBrut - reductionBourse);
  } else if (student.bourse && student.bourse.montant_remise) {
    reductionBourse = student.bourse.montant_remise;
    montantFraisNet = Math.max(0, montantFraisBrut - reductionBourse);
  }

  // Calculer les paiements pour cette année scolaire
  const relevantPayments = payments.filter(payment => 
    payment.etudiant_id === student.id &&
    (payment.annee_scolaire === academicYearLabel || 
     isPaymentInAcademicYear(payment.createdAt, currentAcademicYear))
  );

  const montantPaye = relevantPayments
    .filter(p => p.status === 'Validé' || p.status === 'Confirmé')
    .reduce((sum, p) => sum + p.montantPaye, 0);

  const montantRestant = Math.max(0, montantFraisNet - montantPaye);

  // Déterminer le statut
  let status: StudentFeesCalculation['status'];
  if (montantRestant === 0 && montantFraisNet > 0) {
    status = 'paid';
  } else if (montantPaye > 0) {
    status = 'partial';
  } else {
    status = 'unpaid';
  }

  return {
    studentId: student.id,
    academicYear: academicYearLabel,
    isBoursier: !!student.bourse,
    bourseInfo: student.bourse ? {
      id: student.bourse.id,
      nom: student.bourse.nom,
      pourcentage_remise: student.bourse.pourcentage_remise,
      montant_remise: student.bourse.montant_remise,
    } : undefined,
    fees: {
      frais_inscription: fraisInscription,
      frais_scolarite: fraisScolarite,
      frais_total_brut: montantFraisBrut,
      reduction_bourse: reductionBourse,
      frais_total_net: montantFraisNet,
    },
    payments: {
      montant_paye: montantPaye,
      montant_restant: montantRestant,
      isPaid: status === 'paid',
    },
    status,
  };
}

/**
 * Vérifie si un paiement est dans l'année scolaire donnée
 */
function isPaymentInAcademicYear(
  paymentDate: string | Date, 
  academicYear: AcademicYear
): boolean {
  const date = typeof paymentDate === 'string' ? new Date(paymentDate) : paymentDate;
  return date >= academicYear.startDate && date <= academicYear.endDate;
}

/**
 * Calcule les frais pour tous les étudiants
 */
export function calculateAllStudentsFees(
  students: StudentData[],
  tarifs: TarifData[],
  payments: PaymentData[],
  academicYear?: AcademicYear
): StudentFeesCalculation[] {
  return students.map(student => 
    calculateStudentFees(student, tarifs, payments, academicYear)
  );
}

/**
 * Obtient le résumé des frais pour un groupe d'étudiants
 */
export function getFeesSummary(calculations: StudentFeesCalculation[]) {
  const total = calculations.length;
  const paid = calculations.filter(c => c.status === 'paid').length;
  const partial = calculations.filter(c => c.status === 'partial').length;
  const unpaid = calculations.filter(c => c.status === 'unpaid').length;
  const exempt = calculations.filter(c => c.status === 'exempt').length;

  const totalFees = calculations.reduce((sum, c) => sum + c.fees.frais_total_net, 0);
  const totalPaid = calculations.reduce((sum, c) => sum + c.payments.montant_paye, 0);
  const totalRemaining = calculations.reduce((sum, c) => sum + c.payments.montant_restant, 0);

  return {
    total,
    paid,
    partial,
    unpaid,
    exempt,
    totalFees,
    totalPaid,
    totalRemaining,
    paymentRate: totalFees > 0 ? (totalPaid / totalFees) * 100 : 0,
  };
}
