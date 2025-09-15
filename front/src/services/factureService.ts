import { apiRequest } from "@/lib/api";

export interface Facture {
  id: string;
  numero?: string;
  etudiant_id: string;
  montant: number;
  status: 'payee' | 'non_payee' | 'en_attente';
  date: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const factureService = {
  // Gestion factures
  getAllFactures: async () => {
    return await apiRequest("/factures", "GET");
  },

  getFacturesByStudent: async (etudiantId: string) => {
    return await apiRequest(`/factures?etudiant_id=${etudiantId}`, "GET");
  },

  getFacture: async (id: string) => {
    return await apiRequest(`/factures/${id}`, "GET");
  },

  createFacture: async (data: Omit<Facture, 'id'>) => {
    return await apiRequest("/factures", "POST", data);
  },

  updateFacture: async (id: string, data: Partial<Facture>) => {
    return await apiRequest(`/factures/${id}`, "PUT", data);
  },

  deleteFacture: async (id: string) => {
    return await apiRequest(`/factures/${id}`, "DELETE");
  },

  // Paiements
  payFacture: async (id: string, paymentData: any) => {
    return await apiRequest(`/factures/${id}/pay`, "POST", paymentData);
  },
};