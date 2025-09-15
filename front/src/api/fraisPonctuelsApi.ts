import axios from "axios";

export interface FraisPonctuel {
  id?: string;
  nom: string;
  montant: number;
  // Ajoutez d'autres champs si nécessaire
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

export const getFraisPonctuels = async () => {
  const { data } = await axios.get(`${API_URL}/fraisPonctuels`);
  return data;
};

export const createFraisPonctuel = async (fraisPonctuel: FraisPonctuel) => {
  const { data } = await axios.post(`${API_URL}/fraisPonctuels`, fraisPonctuel);
  return data;
};

export const updateFraisPonctuel = async (
  id: string,
  fraisPonctuel: FraisPonctuel
) => {
  const { data } = await axios.put(
    `${API_URL}/fraisPonctuels/${id}`,
    fraisPonctuel
  );
  return data;
};

export const deleteFraisPonctuel = async (id: string) => {
  const { data } = await axios.delete(`${API_URL}/fraisPonctuels/${id}`);
  return data;
};
