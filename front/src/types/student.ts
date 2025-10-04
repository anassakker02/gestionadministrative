export interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  classe_id?: string;
  classe?: {
    nom: string;
  };
  status?: string;
  balance?: number;
 
  paymentPlanId?: string;
  paymentOverride?: boolean;
  overdueNotificationsMutedUntil?: string;

  paymentStatus?: {
    totalMontantDu: number;
    totalPaid: number;
    remainingAmount: number;
    paymentWarningStatus: string;
    isOverdue?: boolean;
    expectedPaidPercentage?: number;
  };
}
