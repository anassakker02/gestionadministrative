import { apiRequest } from "@/lib/api";

export interface Payment {
  id: string;
  facture_ids: string[];
  student_id: string;
  date_paiement: string;
  montantPaye: number;
  mode: string;
  justificatif_url?: string;
  disputeStatus: 'none' | 'pending' | 'resolved' | 'rejected';
  disputeReason?: string;
  refundStatus: 'none' | 'pending' | 'completed' | 'failed';
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  facture_ids: string[];
  student_id: string;
  montantPaye: number;
  mode: string;
  justificatif_url?: string;
}

export const paymentService = {
  // Récupérer tous les paiements (admin, comptable)
  getAll: async (params?: { student_id?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/paiements?${queryString}` : '/paiements';
    return await apiRequest(url, "GET");
  },

  // Récupérer les paiements d'un étudiant spécifique
  getByStudent: async (studentId: string) => {
    return await apiRequest(`/paiements?etudiant_id=${studentId}`, "GET");
  },

  // Récupérer un paiement par ID
  getById: async (paymentId: string) => {
    return await apiRequest(`/paiements/${paymentId}`, "GET");
  },

  // Créer un nouveau paiement
  create: async (data: CreatePaymentData) => {
    return await apiRequest("/paiements", "POST", data);
  },

  // Mettre à jour un paiement
  update: async (paymentId: string, data: Partial<CreatePaymentData>) => {
    return await apiRequest(`/paiements/${paymentId}`, "PUT", data);
  },

  // Supprimer un paiement
  delete: async (paymentId: string) => {
    return await apiRequest(`/paiements/${paymentId}`, "DELETE");
  },

  // Marquer un paiement comme payé
  markAsPaid: async (paymentId: string) => {
    return await apiRequest(`/paiements/${paymentId}/mark-paid`, "PATCH");
  },

  // Gérer les litiges
  createDispute: async (paymentId: string, reason: string) => {
    return await apiRequest(`/paiements/${paymentId}/dispute`, "POST", { reason });
  },

  resolveDispute: async (paymentId: string, resolution: string) => {
    return await apiRequest(`/paiements/${paymentId}/resolve-dispute`, "PATCH", { resolution });
  },

  // Gérer les remboursements
  requestRefund: async (paymentId: string, reason: string) => {
    return await apiRequest(`/paiements/${paymentId}/refund`, "POST", { reason });
  },

  processRefund: async (paymentId: string, status: 'completed' | 'failed') => {
    return await apiRequest(`/paiements/${paymentId}/process-refund`, "PATCH", { status });
  },

  // Statistiques des paiements
  getStats: async () => {
    return await apiRequest("/paiements/stats", "GET");
  },

  // Paiements en attente
  getPending: async () => {
    return await apiRequest("/paiements?status=attente", "GET");
  },

  // Paiements par période
  getByPeriod: async (startDate: string, endDate: string) => {
    return await apiRequest(`/paiements?start_date=${startDate}&end_date=${endDate}`, "GET");
  }
};
