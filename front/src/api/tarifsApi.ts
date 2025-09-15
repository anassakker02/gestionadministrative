import axios from "axios";

export interface Tarif {
  id?: string;
  nom: string;
  montant: number;
  // Ajoutez d'autres champs si nécessaire
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

export const getTarifs = async () => {
  const { data } = await axios.get(`${API_URL}/tarifs`);
  return data;
};

export const createTarif = async (tarif: Tarif) => {
  const { data } = await axios.post(`${API_URL}/tarifs`, tarif);
  return data;
};

export const updateTarif = async (id: string, tarif: Tarif) => {
  const { data } = await axios.put(`${API_URL}/tarifs/${id}`, tarif);
  return data;
};

export const deleteTarif = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/tarifs/${id}`);
  return data;
};

