import { apiRequest } from "@/lib/api";

export interface Tarif {
  id?: string;
  nom: string;
  montant: number;
  annee_scolaire: string;
  nationalite?: string | null;
  reductions: string[];
  type: "Scolarité" | "Autres frais" | "Cantine" | string;
  isActive: boolean;
  endDate?: string | null;
  [key: string]: unknown;
}

export const getTarifs = async () => {
  return await apiRequest("/tarifs", "GET");
};

export const createTarif = async (tarif: Tarif) => {
  return await apiRequest("/tarifs", "POST", tarif);
};

export const updateTarif = async (id: string, tarif: Tarif) => {
  return await apiRequest(`/tarifs/${id}`, "PUT", tarif);
};

export const deleteTarif = async (id: string) => {
  return await apiRequest(`/tarifs/${id}`, "DELETE");
};

export const calculateStudentFees = async (etudiantId: string, anneeScolaire?: string) => {
  const params = anneeScolaire ? `?annee_scolaire=${anneeScolaire}` : "";
  return await apiRequest(`/tarifs/calculate/${etudiantId}${params}`, "GET");
};
