import { apiRequest } from "@/lib/api";

export interface Classe {
  id: string;
  nom: string;
  niveau: string;
  description: string;
  capacite: number;
  annee_scolaire: string;
  enseignant_id?: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClasseData {
  nom: string;
  niveau: string;
  description: string;
  capacite: number;
  annee_scolaire: string;
  enseignant_id?: string;
}

export const classService = {
  // Récupérer toutes les classes (admin seulement)
  getAll: async (params?: { niveau?: string; annee_scolaire?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.niveau) queryParams.append('niveau', params.niveau);
    if (params?.annee_scolaire) queryParams.append('annee_scolaire', params.annee_scolaire);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/classes?${queryString}` : '/classes';
    return await apiRequest(url, "GET");
  },

  // Récupérer une classe par ID
  getById: async (classeId: string) => {
    return await apiRequest(`/classes/${classeId}`, "GET");
  },

  // Créer une nouvelle classe
  create: async (data: CreateClasseData) => {
    return await apiRequest("/classes", "POST", data);
  },

  // Mettre à jour une classe
  update: async (classeId: string, data: Partial<CreateClasseData>) => {
    return await apiRequest(`/classes/${classeId}`, "PUT", data);
  },

  // Supprimer une classe
  delete: async (classeId: string) => {
    return await apiRequest(`/classes/${classeId}`, "DELETE");
  },

  // Activer/Désactiver une classe
  toggleStatus: async (classeId: string, isActive: boolean) => {
    return await apiRequest(`/classes/${classeId}/status`, "PATCH", { isActive });
  },

  // Récupérer les classes par niveau
  getByNiveau: async (niveau: string) => {
    return await apiRequest(`/classes?niveau=${niveau}`, "GET");
  },

  // Récupérer les classes par année scolaire
  getByAnneeScolaire: async (anneeScolaire: string) => {
    return await apiRequest(`/classes?annee_scolaire=${anneeScolaire}`, "GET");
  },

  // Récupérer les classes disponibles
  getAvailable: async () => {
    return await apiRequest("/classes?isActive=true", "GET");
  },

  // Assigner un enseignant à une classe
  assignTeacher: async (classeId: string, enseignantId: string) => {
    return await apiRequest(`/classes/${classeId}/assign-teacher`, "PATCH", { enseignant_id: enseignantId });
  },

  // Statistiques des classes
  getStats: async () => {
    return await apiRequest("/classes/stats", "GET");
  }
};
