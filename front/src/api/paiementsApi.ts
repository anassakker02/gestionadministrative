import axios from "axios";

export interface Paiement {
  id?: string;
  etudiant_id: string;
  status: string;
  // Add other fields as necessary
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";

export const getPaiements = async (etudiant_id: string, status: string) => {
  const { data } = await axios.get(`${API_URL}/paiements`, {
    params: { etudiant_id, status },
  });
  return data;
};

// Add other CRUD functions as needed
