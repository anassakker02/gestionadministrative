import { apiRequest } from "@/lib/api";
import { Student } from "@/types/student";
// Import supprimé - utilisation des données du backend uniquement

// Wrapper pour gérer les erreurs de connectivité
const withConnectivityErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  fallbackMessage: string = "Service temporairement indisponible"
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // Gérer les erreurs de connectivité spécifiquement
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error(`⏰ Timeout de connexion: ${fallbackMessage}`);
    }
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new Error(`🔌 Connexion refusée: Vérifiez que l'émulateur est démarré`);
    }
    
    if (error.response?.status === 503) {
      throw new Error(`🚫 Service temporairement indisponible: ${fallbackMessage}`);
    }
    
    // Re-throw l'erreur originale si ce n'est pas une erreur de connectivité
    throw error;
  }
};

export const studentService = {
  // Gestion étudiants
  getAllStudents: async () => {
    return await withConnectivityErrorHandling(
      () => apiRequest("/etudiants", "GET"),
      "Impossible de récupérer la liste des étudiants"
    );
  },

  getStudent: async (id: string) => {
    return await withConnectivityErrorHandling(
      () => apiRequest(`/etudiants/${id}`, "GET"),
      `Impossible de récupérer les informations de l'étudiant ${id}`
    );
  },

  createStudent: async (data: Omit<Student, "id">) => {
    return await withConnectivityErrorHandling(
      () => apiRequest("/etudiants", "POST", data),
      "Impossible de créer l'étudiant"
    );
  },

  updateStudent: async (id: string, data: Partial<Student>) => {
    return await withConnectivityErrorHandling(
      () => apiRequest(`/etudiants/${id}`, "PUT", data),
      `Impossible de mettre à jour l'étudiant ${id}`
    );
  },

  deleteStudent: async (id: string) => {
    return await withConnectivityErrorHandling(
      () => apiRequest(`/etudiants/${id}`, "DELETE"),
      `Impossible de supprimer l'étudiant ${id}`
    );
  },

  // Recherche étudiants
  searchStudents: async (query: string) => {
    return await apiRequest(
      `/etudiants/search?q=${encodeURIComponent(query)}`,
      "GET"
    );
  },
};
