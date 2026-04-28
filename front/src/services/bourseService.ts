import { apiRequest } from "@/lib/api";

export interface Bourse {
  id: string;
  nom: string;
  description: string;
  type: 'sociale' | 'merite' | 'sportive' | 'culturelle' | 'autre';
  montant: number;
  pourcentage: number;
  conditions: string;
  date_debut: string;
  date_fin: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBourseData {
  nom: string;
  description: string;
  type: 'sociale' | 'merite' | 'sportive' | 'culturelle' | 'autre';
  montant: number;
  pourcentage: number;
  conditions: string;
  date_debut: string;
  date_fin: string;
}

export const bourseService = {
  // Récupérer toutes les bourses (admin seulement)
  getAll: async (params?: { type?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/bourses?${queryString}` : '/bourses';
    return await apiRequest(url, "GET");
  },

  // Récupérer une bourse par ID
  getById: async (bourseId: string) => {
    return await apiRequest(`/bourses/${bourseId}`, "GET");
  },

  // Créer une nouvelle bourse
  create: async (data: CreateBourseData) => {
    return await apiRequest("/bourses", "POST", data);
  },

  // Mettre à jour une bourse
  update: async (bourseId: string, data: Partial<CreateBourseData>) => {
    return await apiRequest(`/bourses/${bourseId}`, "PUT", data);
  },

  // Supprimer une bourse
  delete: async (bourseId: string) => {
    return await apiRequest(`/bourses/${bourseId}`, "DELETE");
  },

  // Activer/Désactiver une bourse
  toggleStatus: async (bourseId: string, isActive: boolean) => {
    return await apiRequest(`/bourses/${bourseId}/status`, "PATCH", { isActive });
  },

  // Récupérer les bourses par type
  getByType: async (type: string) => {
    return await apiRequest(`/bourses?type=${type}`, "GET");
  },

  // Récupérer les bourses actives
  getActive: async () => {
    return await apiRequest("/bourses?isActive=true", "GET");
  },

  // Statistiques des bourses
  getStats: async () => {
    return await apiRequest("/bourses/stats", "GET");
  },

  // Récupérer les étudiants affectés à une bourse
  getBourseStudents: async (bourseId: string) => {
    return await apiRequest(`/bourses/${bourseId}/students`, "GET");
  }
};
