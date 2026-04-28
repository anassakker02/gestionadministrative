import { apiRequest } from "@/lib/api";
import { Facture } from "@/types/facture"; // Importe l'interface depuis le nouveau fichier

// Fonction utilitaire pour nettoyer les valeurs undefined
const cleanUndefinedValues = (
  obj: Record<string, unknown>
): Record<string, unknown> => {
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      obj[key] = value; // Utilise obj[key] pour modifier l'objet directement
    }
  }
  return obj;
};

export const factureService = {
  // Gestion factures
  getFactures: async () => {
    return await apiRequest("/factures", "GET");
  },

  getFacturesByStudent: async (etudiantId: string) => {
    return await apiRequest(`/factures?etudiant_id=${etudiantId}`, "GET");
  },

  getFacture: async (id: string) => {
    return await apiRequest(`/factures/${id}`, "GET");
  },

  createFacture: async (data: Omit<Facture, "id">) => {
    return await apiRequest("/factures", "POST", data);
  },

  updateFacture: async (id: string, data: Partial<Facture>) => {
    return await apiRequest(`/factures/${id}`, "PUT", data);
  },

  deleteFacture: async (id: string) => {
    return await apiRequest(`/factures/${id}`, "DELETE");
  },

  // Paiements
  payFacture: async (id: string, paymentData: Record<string, unknown>) => {
    return await apiRequest(`/factures/${id}/pay`, "POST", paymentData);
  },

  // Génération automatique après paiement
  generateAfterPayment: async (paymentData: {
    student_id: string;
    parent_id?: string;
    montant_paye: number;
    mode_paiement: "PayPal" | "Espèces" | "Virement" | "Carte bancaire";
    payment_id?: string;
    qui_a_paye: string;
    enregistre_par: string;
    reference_externe?: string;
    tarif_items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  }) => {
    const cleanedData = cleanUndefinedValues(paymentData);
    return await apiRequest(
      "/factures/generate-after-payment",
      "POST",
      cleanedData
    );
  },

  // Générer facture pour un étudiant (endpoint ajouté back)
  generateForStudent: async (payload: {
    student_id: string;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    description?: string;
    currency?: string;
  }) => {
    const cleaned = cleanUndefinedValues(payload as Record<string, unknown>);
    return await apiRequest("/factures/generate-for-student", "POST", cleaned);
  },

  // Enregistrement paiement manuel
  recordManualPayment: async (paymentData: {
    facture_id: string;
    montant_paye: number;
    qui_a_paye: string;
    mode_paiement: "PayPal" | "Espèces" | "Virement" | "Carte bancaire";
    reference_externe?: string;
    commentaires?: string;
  }) => {
    const cleanedData = cleanUndefinedValues(paymentData);
    return await apiRequest(
      "/factures/record-manual-payment",
      "POST",
      cleanedData
    );
  },
};
