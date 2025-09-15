import { apiRequest } from "@/lib/api";

export interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  classe_id?: string;
  classe?: {
    nom: string;
  };
  status?: string;
  balance?: number;
}

export const studentService = {
  // Gestion étudiants
  getAllStudents: async () => {
    return await apiRequest("/etudiants", "GET");
  },

  getStudent: async (id: string) => {
    return await apiRequest(`/etudiants/${id}`, "GET");
  },

  createStudent: async (data: Omit<Student, 'id'>) => {
    return await apiRequest("/etudiants", "POST", data);
  },

  updateStudent: async (id: string, data: Partial<Student>) => {
    return await apiRequest(`/etudiants/${id}`, "PUT", data);
  },

  deleteStudent: async (id: string) => {
    return await apiRequest(`/etudiants/${id}`, "DELETE");
  },

  // Recherche étudiants
  searchStudents: async (query: string) => {
    return await apiRequest(`/etudiants/search?q=${encodeURIComponent(query)}`, "GET");
  },
};