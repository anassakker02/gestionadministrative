import { apiRequest } from "@/lib/api";

export interface Echeancier {
  id: string;
  nom: string;
  description: string;
  type: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  nombre_echeances: number;
  montant_total: number;
  date_debut: string;
  date_fin: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEcheancierData {
  nom: string;
  description: string;
  type: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';
  nombre_echeances: number;
  montant_total: number;
  date_debut: string;
  date_fin: string;
}

export const echeancierService = {
  // Récupérer tous les échéanciers (admin seulement)
  getAll: async (params?: { type?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/echeanciers?${queryString}` : '/echeanciers';
    return await apiRequest(url, "GET");
  },

  // Récupérer un échéancier par ID
  getById: async (echeancierId: string) => {
    return await apiRequest(`/echeanciers/${echeancierId}`, "GET");
  },

  // Créer un nouvel échéancier
  create: async (data: CreateEcheancierData) => {
    return await apiRequest("/echeanciers", "POST", data);
  },

  // Mettre à jour un échéancier
  update: async (echeancierId: string, data: Partial<CreateEcheancierData>) => {
    return await apiRequest(`/echeanciers/${echeancierId}`, "PUT", data);
  },

  // Supprimer un échéancier
  delete: async (echeancierId: string) => {
    return await apiRequest(`/echeanciers/${echeancierId}`, "DELETE");
  },

  // Activer/Désactiver un échéancier
  toggleStatus: async (echeancierId: string, isActive: boolean) => {
    return await apiRequest(`/echeanciers/${echeancierId}/status`, "PATCH", { isActive });
  },

  // Récupérer les échéanciers par type
  getByType: async (type: string) => {
    return await apiRequest(`/echeanciers?type=${type}`, "GET");
  },

  // Récupérer les échéanciers actifs
  getActive: async () => {
    return await apiRequest("/echeanciers?isActive=true", "GET");
  },

  // Calculer les échéances
  calculateEcheances: async (echeancierId: string) => {
    return await apiRequest(`/echeanciers/${echeancierId}/calculate`, "POST");
  },

  // Statistiques des échéanciers
  getStats: async () => {
    return await apiRequest("/echeanciers/stats", "GET");
  }
};
