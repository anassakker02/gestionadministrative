import { apiRequest } from "@/lib/api";

export interface Activity {
  id: string;
  student_id: string;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  prix: number;
  statut: 'active' | 'inactive' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  student_id: string;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  prix: number;
}

export const activityService = {
  // Récupérer toutes les activités (admin seulement)
  getAll: async (params?: { student_id?: string; statut?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.student_id) queryParams.append('student_id', params.student_id);
    if (params?.statut) queryParams.append('statut', params.statut);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/activites?${queryString}` : '/activites';
    return await apiRequest(url, "GET");
  },

  // Récupérer les activités d'un étudiant spécifique
  getByStudent: async (studentId: string) => {
    return await apiRequest(`/activites?etudiant_id=${studentId}`, "GET");
  },

  // Récupérer une activité par ID
  getById: async (activityId: string) => {
    return await apiRequest(`/activites/${activityId}`, "GET");
  },

  // Créer une nouvelle activité
  create: async (data: CreateActivityData) => {
    return await apiRequest("/activites", "POST", data);
  },

  // Mettre à jour une activité
  update: async (activityId: string, data: Partial<CreateActivityData>) => {
    return await apiRequest(`/activites/${activityId}`, "PUT", data);
  },

  // Supprimer une activité
  delete: async (activityId: string) => {
    return await apiRequest(`/activites/${activityId}`, "DELETE");
  },

  // Activer/Désactiver une activité
  toggleStatus: async (activityId: string, statut: 'active' | 'inactive') => {
    return await apiRequest(`/activites/${activityId}/status`, "PATCH", { statut });
  },

  // Statistiques des activités
  getStats: async () => {
    return await apiRequest("/activites/stats", "GET");
  }
};
