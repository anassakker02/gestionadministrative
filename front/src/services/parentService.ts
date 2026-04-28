import { apiRequest } from "@/lib/api";

export interface Parent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  profession: string;
  enfants_ids: string[];
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateParentData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  profession: string;
  enfants_ids?: string[];
}

export const parentService = {
  // Récupérer tous les parents (admin, sous-admin)
  getAll: async (params?: { isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/parents?${queryString}` : '/parents';
    return await apiRequest(url, "GET");
  },

  // Récupérer un parent par ID
  getById: async (parentId: string) => {
    return await apiRequest(`/parents/${parentId}`, "GET");
  },

  // Créer un nouveau parent
  create: async (data: CreateParentData) => {
    return await apiRequest("/parents", "POST", data);
  },

  // Mettre à jour un parent
  update: async (parentId: string, data: Partial<CreateParentData>) => {
    return await apiRequest(`/parents/${parentId}`, "PUT", data);
  },

  // Supprimer un parent
  delete: async (parentId: string) => {
    return await apiRequest(`/parents/${parentId}`, "DELETE");
  },

  // Activer/Désactiver un parent
  toggleStatus: async (parentId: string, isActive: boolean) => {
    return await apiRequest(`/parents/${parentId}/status`, "PATCH", { isActive });
  },

  // Ajouter un enfant à un parent
  addChild: async (parentId: string, enfantId: string) => {
    return await apiRequest(`/parents/${parentId}/add-child`, "PATCH", { enfant_id: enfantId });
  },

  // Retirer un enfant d'un parent
  removeChild: async (parentId: string, enfantId: string) => {
    return await apiRequest(`/parents/${parentId}/remove-child`, "PATCH", { enfant_id: enfantId });
  },

  // Récupérer les enfants d'un parent
  getChildren: async (parentId: string) => {
    return await apiRequest(`/parents/${parentId}/children`, "GET");
  },

  // Rechercher des parents
  search: async (query: string) => {
    return await apiRequest(`/parents/search?q=${encodeURIComponent(query)}`, "GET");
  },

  // Statistiques des parents
  getStats: async () => {
    return await apiRequest("/parents/stats", "GET");
  }
};
