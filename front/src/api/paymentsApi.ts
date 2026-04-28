// Deprecated: use paiementsApi instead. Keep as a thin proxy for backward compatibility.
import {
  createPaiement as createPaymentReal,
  getPaiementById as getPaymentByIdReal,
  Paiement,
} from "./paiementsApi";

export interface PaymentProxy {
  id?: string;
  etudiant_id?: string;
  facture_ids?: string[];
  parent_id?: string | null;
  montantPaye?: number;
  mode?: "PayPal" | "Espèces" | "Virement" | "Carte bancaire" | string;
  date_paiement?: string;
  status?: string;
  qui_a_paye?: string | null;
  enregistre_par?: string | null;
  [key: string]: unknown;
}

export const paymentService = {
  // Prefer using getAllPaiements from paiementsApi directly
  createPayment: async (paymentData: Partial<PaymentProxy>) =>
    createPaymentReal(paymentData as Partial<Paiement>),
  getPaymentById: async (id: string) => getPaymentByIdReal(id),
};
