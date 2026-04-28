import { apiRequest } from "@/lib/api";

export interface FraisPonctuel {
  id: string;
  nom: string;
  description: string;
  montant: number;
  type: 'sortie' | 'activite' | 'materiel' | 'autre';
  date_limite: string;
  classe_id?: string;
  niveau?: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFraisPonctuelData {
  nom: string;
  description: string;
  montant: number;
  type: 'sortie' | 'activite' | 'materiel' | 'autre';
  date_limite: string;
  classe_id?: string;
  niveau?: string;
}

export const fraisPonctuelService = {
  // Récupérer tous les frais ponctuels (admin seulement)
  getAll: async (params?: { type?: string; classe_id?: string; niveau?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.classe_id) queryParams.append('classe_id', params.classe_id);
    if (params?.niveau) queryParams.append('niveau', params.niveau);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/fraisPonctuels?${queryString}` : '/fraisPonctuels';
    return await apiRequest(url, "GET");
  },

  // Récupérer un frais ponctuel par ID
  getById: async (fraisId: string) => {
    return await apiRequest(`/fraisPonctuels/${fraisId}`, "GET");
  },

  // Créer un nouveau frais ponctuel
  create: async (data: CreateFraisPonctuelData) => {
    return await apiRequest("/fraisPonctuels", "POST", data);
  },

  // Mettre à jour un frais ponctuel
  update: async (fraisId: string, data: Partial<CreateFraisPonctuelData>) => {
    return await apiRequest(`/fraisPonctuels/${fraisId}`, "PUT", data);
  },

  // Supprimer un frais ponctuel
  delete: async (fraisId: string) => {
    return await apiRequest(`/fraisPonctuels/${fraisId}`, "DELETE");
  },

  // Activer/Désactiver un frais ponctuel
  toggleStatus: async (fraisId: string, isActive: boolean) => {
    return await apiRequest(`/fraisPonctuels/${fraisId}/status`, "PATCH", { isActive });
  },

  // Récupérer les frais ponctuels par classe
  getByClasse: async (classeId: string) => {
    return await apiRequest(`/fraisPonctuels?classe_id=${classeId}`, "GET");
  },

  // Récupérer les frais ponctuels par niveau
  getByNiveau: async (niveau: string) => {
    return await apiRequest(`/fraisPonctuels?niveau=${niveau}`, "GET");
  },

  // Récupérer les frais ponctuels par type
  getByType: async (type: string) => {
    return await apiRequest(`/fraisPonctuels?type=${type}`, "GET");
  },

  // Récupérer les frais ponctuels actifs
  getActive: async () => {
    return await apiRequest("/fraisPonctuels?isActive=true", "GET");
  },

  // Statistiques des frais ponctuels
  getStats: async () => {
    return await apiRequest("/fraisPonctuels/stats", "GET");
  }
};
