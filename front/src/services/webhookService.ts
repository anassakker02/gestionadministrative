import { apiRequest } from "@/lib/api";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWebhookData {
  url: string;
  events: string[];
  secret?: string;
}

export const webhookService = {
  // Récupérer tous les webhooks (admin seulement)
  getAll: async () => {
    return await apiRequest("/webhooks", "GET");
  },

  // Récupérer un webhook par ID
  getById: async (webhookId: string) => {
    return await apiRequest(`/webhooks/${webhookId}`, "GET");
  },

  // Créer un nouveau webhook
  create: async (data: CreateWebhookData) => {
    return await apiRequest("/webhooks", "POST", data);
  },

  // Mettre à jour un webhook
  update: async (webhookId: string, data: Partial<CreateWebhookData>) => {
    return await apiRequest(`/webhooks/${webhookId}`, "PUT", data);
  },

  // Supprimer un webhook
  delete: async (webhookId: string) => {
    return await apiRequest(`/webhooks/${webhookId}`, "DELETE");
  },

  // Activer/Désactiver un webhook
  toggleStatus: async (webhookId: string, isActive: boolean) => {
    return await apiRequest(`/webhooks/${webhookId}/status`, "PATCH", { isActive });
  },

  // Tester un webhook
  test: async (webhookId: string) => {
    return await apiRequest(`/webhooks/${webhookId}/test`, "POST");
  },

  // Récupérer les logs d'un webhook
  getLogs: async (webhookId: string) => {
    return await apiRequest(`/webhooks/${webhookId}/logs`, "GET");
  },

  // Statistiques des webhooks
  getStats: async () => {
    return await apiRequest("/webhooks/stats", "GET");
  }
};
