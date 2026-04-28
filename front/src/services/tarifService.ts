import { apiRequest } from "@/lib/api";

export interface Tarif {
  id: string;
  nom: string;
  description: string;
  montant: number;
  type: 'inscription' | 'scolaire' | 'transport' | 'cantine' | 'autre';
  niveau: string;
  annee_scolaire: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTarifData {
  nom: string;
  description: string;
  montant: number;
  type: 'inscription' | 'scolaire' | 'transport' | 'cantine' | 'autre';
  niveau: string;
  annee_scolaire: string;
}

export const tarifService = {
  // Récupérer tous les tarifs (admin, comptable)
  getAll: async (params?: { type?: string; niveau?: string; annee_scolaire?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.niveau) queryParams.append('niveau', params.niveau);
    if (params?.annee_scolaire) queryParams.append('annee_scolaire', params.annee_scolaire);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/tarifs?${queryString}` : '/tarifs';
    return await apiRequest(url, "GET");
  },

  // Récupérer un tarif par ID
  getById: async (tarifId: string) => {
    return await apiRequest(`/tarifs/${tarifId}`, "GET");
  },

  // Créer un nouveau tarif
  create: async (data: CreateTarifData) => {
    return await apiRequest("/tarifs", "POST", data);
  },

  // Mettre à jour un tarif
  update: async (tarifId: string, data: Partial<CreateTarifData>) => {
    return await apiRequest(`/tarifs/${tarifId}`, "PUT", data);
  },

  // Supprimer un tarif
  delete: async (tarifId: string) => {
    return await apiRequest(`/tarifs/${tarifId}`, "DELETE");
  },

  // Activer/Désactiver un tarif
  toggleStatus: async (tarifId: string, isActive: boolean) => {
    return await apiRequest(`/tarifs/${tarifId}/status`, "PATCH", { isActive });
  },

  // Récupérer les tarifs par niveau
  getByNiveau: async (niveau: string) => {
    return await apiRequest(`/tarifs?niveau=${niveau}`, "GET");
  },

  // Récupérer les tarifs par type
  getByType: async (type: string) => {
    return await apiRequest(`/tarifs?type=${type}`, "GET");
  },

  // Statistiques des tarifs
  getStats: async () => {
    return await apiRequest("/tarifs/stats", "GET");
  },

  // Récupérer les tarifs de scolarité pour le calcul automatique
  getScolariteTarifs: async (anneeScolaire?: string) => {
    const currentYear = new Date().getFullYear();
    const academicYear = anneeScolaire || `${currentYear}-${currentYear + 1}`;
    
    const queryParams = new URLSearchParams();
    queryParams.append('annee_scolaire', academicYear);
    queryParams.append('type', 'Scolarité');
    queryParams.append('isActive', 'true');
    
    return await apiRequest(`/tarifs?${queryParams.toString()}`, "GET");
  },

  // Calculer les frais totaux pour un étudiant
  calculateStudentFees: async (etudiantId: string, anneeScolaire?: string) => {
    const queryParams = new URLSearchParams();
    if (anneeScolaire) queryParams.append('annee_scolaire', anneeScolaire);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/tarifs/calculate/${etudiantId}?${queryString}` : `/tarifs/calculate/${etudiantId}`;
    return await apiRequest(url, "GET");
  }
};
