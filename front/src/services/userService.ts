import { apiRequest } from "@/lib/api";
import { User } from "@/types/user";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role?: string;
  telephone?: string;
  adresse?: string;
}

export interface SubAdminData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  adresse?: string;
}

export interface RoleAssignmentData {
  role: string;
  additionalData?: Record<string, unknown>;
}

export const userService = {
  // Authentification
  login: async (credentials: LoginCredentials) => {
    return await apiRequest(
      "/auth/login",
      "POST",
      credentials as unknown as Record<string, unknown>
    );
  },

  register: async (data: RegisterData) => {
    return await apiRequest(
      "/auth/register",
      "POST",
      data as unknown as Record<string, unknown>
    );
  },

  logout: async () => {
    return await apiRequest("/auth/logout", "POST");
  },

  // Session courante
  me: async () => {
    return await apiRequest("/auth/me", "GET");
  },

  // Gestion hiérarchique admin/sous-admin
  createSubAdmin: async (data: SubAdminData) => {
    return await apiRequest(
      "/auth/create-sub-admin",
      "POST",
      data as unknown as Record<string, unknown>
    );
  },

  assignRole: async (userId: string, role: string) => {
    return await apiRequest(`/auth/assign-role/${userId}`, "POST", {
      role,
    } as unknown as Record<string, unknown>);
  },

  // Gestion utilisateurs
  getAllUsers: async (params?: { status?: string; role?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.role) queryParams.append("role", params.role);

    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : "/users";
    return await apiRequest(url, "GET");
  },

  getPendingUsers: async () => {
    return await apiRequest("/users/pending", "GET");
  },

  getAvailableForStudent: async () => {
    return await apiRequest("/users/available-for-student", "GET");
  },

  getProfile: async (userId: string) => {
    return await apiRequest(`/users/${userId}`, "GET");
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    return await apiRequest(`/users/${userId}`, "PUT", data);
  },

  deleteUser: async (userId: string) => {
    return await apiRequest(`/users/${userId}`, "DELETE");
  },

  activateUser: async (userId: string) => {
    // Backend uses PATCH for activation
    return await apiRequest(`/users/${userId}/activate`, "PATCH");
  },

  deactivateUser: async (userId: string) => {
    // Backend uses PATCH for deactivation (soft)
    return await apiRequest(`/users/${userId}/deactivate`, "PATCH");
  },

  // Préférences de notification (email/SMS)
  updateNotificationPreferences: async (
    userId: string,
    prefs: { emailNotifications?: boolean; smsNotifications?: boolean }
  ) => {
    return await apiRequest(
      `/users/${userId}/preferences`,
      "PATCH",
      prefs as Record<string, unknown>
    );
  },

  changePassword: async (
    userId: string,
    passwords: { oldPassword: string; newPassword: string }
  ) => {
    return await apiRequest(`/users/${userId}/password`, "PUT", passwords);
  },

  getAvailableClasses: async () => {
    return await apiRequest("/users/available-classes", "GET");
  },
};
