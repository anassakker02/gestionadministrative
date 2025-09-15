import { apiRequest } from "@/lib/api";

export const dashboardService = {
  // Statistiques générales
  getStats: async () => {
    return await apiRequest("/dashboard/stats", "GET");
  },

  // Données récentes
  getRecentActivities: async () => {
    return await apiRequest("/dashboard/activities", "GET");
  },

  // Notifications
  getNotifications: async (userId: string) => {
    return await apiRequest(`/dashboard/notifications/${userId}`, "GET");
  },

  markNotificationAsRead: async (notificationId: string) => {
    return await apiRequest(`/notifications/${notificationId}/read`, "PUT");
  },
};