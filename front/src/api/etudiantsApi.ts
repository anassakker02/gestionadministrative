import { apiRequest } from "@/lib/api";

export interface Etudiant {
  id?: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  classe_id: string;
  nationalite: string;
  bourse_id?: string;
  frais_payment?: number; // Montant total des frais avec réduction de bourse
  // Add other fields as necessary
  [key: string]: unknown;
}

export const createEtudiant = async (etudiant: Etudiant) => {
  return await apiRequest("/etudiants", "POST", etudiant);
};

export const getEtudiants = async () => {
  return await apiRequest("/etudiants", "GET");
};

export const deleteEtudiant = async (id: string) => {
  return await apiRequest(`/etudiants/${id}`, "DELETE");
};

export const updateEtudiant = async (
  id: string,
  etudiant: Partial<Etudiant>
) => {
  return await apiRequest(`/etudiants/${id}`, "PUT", etudiant);
};

export const getEtudiantById = async (id: string) => {
  return await apiRequest(`/etudiants/${id}`, "GET");
};

export const getClassesForStudentForm = async () => {
  const response = await apiRequest("/classes", "GET");
  // Assuming backend returns { status: true, data: [...] }
  return response.data || [];
};

export const getBoursesForStudentForm = async () => {
  const response = await apiRequest("/bourses", "GET");
  return response.data || [];
};

export const recalculateStudentFees = async () => {
  return await apiRequest("/etudiants/recalculate-fees", "POST");
};
