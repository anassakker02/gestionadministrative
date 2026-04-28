import { apiRequest } from "@/lib/api";

export interface Echeancier {
  id?: string;
  nom: string;
  description: string;
  // Ajoutez d'autres champs si nécessaire
  [key: string]: unknown;
}

export const getEcheanciers = async () => {
  return await apiRequest("/echeanciers", "GET");
};

export const createEcheancier = async (echeancier: Echeancier) => {
  return await apiRequest("/echeanciers", "POST", echeancier);
};

export const updateEcheancier = async (id: string, echeancier: Echeancier) => {
  return await apiRequest(`/echeanciers/${id}`, "PUT", echeancier);
};

export const deleteEcheancier = async (id: string) => {
  return await apiRequest(`/echeanciers/${id}`, "DELETE");
};
