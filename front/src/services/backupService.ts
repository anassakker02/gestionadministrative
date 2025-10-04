import { apiRequest } from "@/lib/api";

export interface Backup {
  id: string;
  filename: string;
  size: number;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface CreateBackupData {
  type: 'full' | 'incremental' | 'differential';
  description?: string;
}

export const backupService = {
  // Récupérer toutes les sauvegardes (admin seulement)
  getAll: async () => {
    return await apiRequest("/backup", "GET");
  },

  // Récupérer une sauvegarde par ID
  getById: async (backupId: string) => {
    return await apiRequest(`/backup/${backupId}`, "GET");
  },

  // Créer une nouvelle sauvegarde
  create: async (data: CreateBackupData) => {
    return await apiRequest("/backup", "POST", data);
  },

  // Supprimer une sauvegarde
  delete: async (backupId: string) => {
    return await apiRequest(`/backup/${backupId}`, "DELETE");
  },

  // Télécharger une sauvegarde
  download: async (backupId: string) => {
    return await apiRequest(`/backup/${backupId}/download`, "GET");
  },

  // Restaurer une sauvegarde
  restore: async (backupId: string) => {
    return await apiRequest(`/backup/${backupId}/restore`, "POST");
  },

  // Vérifier l'intégrité d'une sauvegarde
  verify: async (backupId: string) => {
    return await apiRequest(`/backup/${backupId}/verify`, "POST");
  },

  // Planifier une sauvegarde automatique
  schedule: async (schedule: { frequency: string; time: string; type: string }) => {
    return await apiRequest("/backup/schedule", "POST", schedule);
  },

  // Obtenir la configuration de sauvegarde
  getConfig: async () => {
    return await apiRequest("/backup/config", "GET");
  },

  // Mettre à jour la configuration de sauvegarde
  updateConfig: async (config: Record<string, unknown>) => {
    return await apiRequest("/backup/config", "PUT", config);
  },

  // Statistiques des sauvegardes
  getStats: async () => {
    return await apiRequest("/backup/stats", "GET");
  }
};
