import axios from "axios";

export interface Etudiant {
  id?: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  classe_id: string;
  nationalite: string;
  bourse_id?: string;
  // Add other fields as necessary
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

export const createEtudiant = async (etudiant: Etudiant) => {
  const { data } = await axios.post(`${API_URL}/etudiants`, etudiant);
  return data;
};

export const getEtudiants = async () => {
  const { data } = await axios.get(`${API_URL}/etudiants`);
  return data;
};

export const deleteEtudiant = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/etudiants/${id}`);
  return data;
};

export const updateEtudiant = async (id: string, etudiant: Partial<Etudiant>) => {
  const { data } = await axios.put(`${API_URL}/etudiants/${id}`, etudiant);
  return data;
};

export const getClassesForStudentForm = async () => {
  const { data } = await axios.get(`${API_URL}/classes`);
  // Assuming backend returns { status: true, data: [...] }
  return data.data || [];
};

export const getBoursesForStudentForm = async () => {
    const { data } = await axios.get(`${API_URL}/bourses`);
    return data.data || [];
};
