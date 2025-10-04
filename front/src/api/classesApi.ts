import { apiRequest } from "@/lib/api";

export interface Classe {
  id?: string;
  nom: string;
  niveau: string;
  description: string;
  nombreEtudiants: number;
  capacite: number;
  annee_scolaire: string;
  createdAt: { _seconds: number; _nanoseconds: number };
  // Add other fields if necessary
  [key: string]: unknown;
}

export const getClasses = async () => {
  try {
    const response = await apiRequest("/classes", "GET");
    console.log("Classes API Raw Response:", response); // Raw response
    // Assuming the actual array data is nested under a 'data' property
    if (response && response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response; // If the data is already an array at the root
    } else {
      console.error("Unexpected API response structure for classes:", response);
      return []; // Return an empty array to prevent .map errors
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error; // Re-throw the error for react-query to handle
  }
};

export const createClasse = async (classe: Classe) => {
  return await apiRequest("/classes", "POST", classe);
};

export const updateClasse = async (id: string, classe: Classe) => {
  return await apiRequest(`/classes/${id}`, "PUT", classe);
};

export const deleteClasse = async (id: string) => {
  return await apiRequest(`/classes/${id}`, "DELETE");
};
