import { apiRequest } from "@/lib/api";
import { Relance } from "@/pages/Relances"; // Assuming Relance interface is exported from Relances.tsx
// Import supprimé - utilisation des données du backend uniquement

export const relanceService = {
  getAllRelances: async () => {
    return await apiRequest("/relances", "GET");
  },

  sendEmailReminder: async (relanceId: string, to: string, subject: string, message: string) => {
    return await apiRequest(
      "/relances/send-email",
      "POST",
      { relanceId, to, subject, message } as unknown as Record<string, unknown>
    );
  },

  sendMessageReminder: async (relanceId: string, message: string) => {
    return await apiRequest(
      "/relances/send-message",
      "POST",
      { relanceId, message } as unknown as Record<string, unknown>
    );
  },

  updateRelance: async (id: string, data: Partial<Relance>) => {
    // Utilisation de l'API backend pour mettre à jour les relances
    return await apiRequest(`/relances/${id}`, "PUT", data as unknown as Record<string, unknown>);
  },
};
