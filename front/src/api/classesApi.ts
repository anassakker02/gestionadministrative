import axios from "axios";

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
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

export const getClasses = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/classes`);
    console.log("Classes API Raw Response:", data); // Raw response
    // Assuming the actual array data is nested under a 'data' property
    if (data && data.data) {
      return data.data;
    } else if (Array.isArray(data)) {
      return data; // If the data is already an array at the root
    } else {
      console.error("Unexpected API response structure for classes:", data);
      return []; // Return an empty array to prevent .map errors
    }
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error; // Re-throw the error for react-query to handle
  }
};

export const createClasse = async (classe: Classe) => {
  const { data } = await axios.post(`${API_URL}/classes`, classe);
  return data;
};

export const updateClasse = async (id: string, classe: Classe) => {
  const { data } = await axios.put(`${API_URL}/classes/${id}`, classe);
  return data;
};

export const deleteClasse = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/classes/${id}`);
  return data;
};
