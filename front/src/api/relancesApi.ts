import { apiRequest } from "@/lib/api";

export interface Relance {
  id?: string;
  etudiantId: string;
  etudiantNom: string;
  etudiantEmail: string;
  etudiantTelephone: string;
  factureId: string;
  factureNumero: string;
  montantDu: number;
  joursRetard: number;
  typeRelance: 'email' | 'sms' | 'appel' | 'courrier';
  statusRelance: 'en_attente' | 'envoye' | 'recu' | 'ignore' | 'appel_effectue';
  priorite: 'basse' | 'normale' | 'haute';
  dateCreation: string;
  messageContent?: string;
  dateAppel?: string;
  outcomeAppel?: 'atteint' | 'pas_atteint' | 'messagerie';
  // Champs requis par le backend
  facture_id: string;
  dateEnvoi: string;
  type: 'message' | 'appel';
}

// Récupérer toutes les relances
export const getAllRelances = async (): Promise<Relance[]> => {
  const response = await apiRequest("/relances", "GET");
  return response.data || [];
};

// Récupérer l'historique des relances (relances envoyées)
export const getRelancesHistorique = async (): Promise<Relance[]> => {
  const response = await apiRequest("/relances/historique", "GET");
  return response.data || [];
};

// Créer une nouvelle relance
export const createRelance = async (relance: Partial<Relance>): Promise<Relance> => {
  const response = await apiRequest("/relances", "POST", relance);
  return response.data;
};

// Mettre à jour une relance
export const updateRelance = async (id: string, relance: Partial<Relance>): Promise<Relance> => {
  const response = await apiRequest(`/relances/${id}`, "PUT", relance);
  return response.data;
};

// Envoyer un message de relance
export const sendMessageRelance = async (relanceId: string, message: string): Promise<void> => {
  await apiRequest(`/relances/${relanceId}/message`, "POST", { message });
};

// Enregistrer un appel de relance
export const recordCallRelance = async (relanceId: string, callData: {
  dateAppel: string;
  outcomeAppel: string;
  messageContent: string;
}): Promise<void> => {
  await apiRequest(`/relances/${relanceId}/call`, "POST", callData);
};
