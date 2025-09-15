import { apiRequest } from "@/lib/api";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'etudiant' | 'comptable' | 'admin';
  telephone?: string;
  classe_id?: string;
  status?: string;
}

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
  classe_id?: string;
}

export const userService = {
  // Authentification
  login: async (credentials: LoginCredentials) => {
    return await apiRequest("/auth/login", "POST", credentials as unknown as Record<string, unknown>);
  },

  register: async (data: RegisterData) => {
    return await apiRequest("/auth/register", "POST", data as unknown as Record<string, unknown>);
  },

  logout: async () => {
    return await apiRequest("/auth/logout", "POST");
  },

  // Gestion profil
  getProfile: async (userId: string) => {
    return await apiRequest(`/users/${userId}`, "GET");
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    return await apiRequest(`/users/${userId}`, "PUT", data);
  },

  changePassword: async (userId: string, passwords: { oldPassword: string; newPassword: string }) => {
    return await apiRequest(`/users/${userId}/password`, "PUT", passwords);
  },

  // Gestion utilisateurs (admin)
  getAllUsers: async () => {
    return await apiRequest("/users", "GET");
  },

  deleteUser: async (userId: string) => {
    return await apiRequest(`/users/${userId}`, "DELETE");
  },
};