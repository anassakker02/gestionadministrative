import axios from "axios";

export interface Echeancier {
  id?: string;
  nom: string;
  description: string;
  // Ajoutez d'autres champs si nécessaire
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/frais-gestionScolaire/us-central1/api/v1";

export const getEcheanciers = async () => {
  const { data } = await axios.get(`${API_URL}/echeanciers`);
  return data;
};

export const createEcheancier = async (echeancier: Echeancier) => {
  const { data } = await axios.post(`${API_URL}/echeanciers`, echeancier);
  return data;
};

export const updateEcheancier = async (id: string, echeancier: Echeancier) => {
  const { data } = await axios.put(`${API_URL}/echeanciers/${id}`, echeancier);
  return data;
};

export const deleteEcheancier = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/echeanciers/${id}`);
  return data;
};
