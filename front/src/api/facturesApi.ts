import { apiRequest } from "@/lib/api";

export interface Facture {
  id?: string;
  student_id: string;
  parent_id?: string;
  date_emission: string;
  montant_total: number;
  statut:
    | "payée"
    | "impayée"
    | "partielle"
    | "annulée"
    | "avoir"
    | "rectificative";
  numero_facture?: string;
  pdf_url?: string;
  logoUrl?: string;
  legalMentions?: string;
  termsAndConditions?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  originalFactureId?: string;
  reason?: string;
  parentId?: string;
  currency?: string;
  montantPaye?: number;
  montantRestant?: number;
  // Champs calculés côté backend (trilogie + somme)
  montant_du?: number;
  montant_payee?: number;
  montant_restant?: number;
  somme?: number;
  [key: string]: unknown;
}

export const getFacturesByStudent = async (
  student_id: string,
  status?: string
) => {
  const params: Record<string, string> = { etudiant_id: student_id };
  if (status) params.status = status;
  // Bypass cache to avoid 304 with empty body on XHR
  (params as Record<string, string>)["_ts"] = String(Date.now());
  const queryString = new URLSearchParams(params).toString();
  const url = `/factures?${queryString}`;
  return await apiRequest(url, "GET");
};

export const getFactureById = async (id: string) => {
  return await apiRequest(`/factures/${id}`, "GET");
};

export const createFacture = async (facture: Facture) => {
  return await apiRequest("/factures", "POST", facture);
};

export const updateFacture = async (id: string, facture: Partial<Facture>) => {
  return await apiRequest(`/factures/${id}`, "PUT", facture);
};

export const deleteFacture = async (id: string) => {
  return await apiRequest(`/factures/${id}`, "DELETE");
};

export const cancelFacture = async (id: string, reason: string) => {
  return await apiRequest(`/factures/${id}/cancel`, "PUT", { reason } as Record<
    string,
    unknown
  >);
};

export const createAvoir = async (avoirData: {
  originalFactureId: string;
  reason: string;
  montant_total: number;
  items: unknown[];
}) => {
  return await apiRequest(
    "/factures/avoir",
    "POST",
    avoirData as Record<string, unknown>
  );
};

export const createRectificativeFacture = async (rectificativeData: {
  originalFactureId: string;
  reason: string;
  [key: string]: unknown;
}) => {
  return await apiRequest("/factures/rectificative", "POST", rectificativeData);
};

export const createFamilyInvoice = async (familyInvoiceData: {
  parentId: string;
  date_emission?: string;
  logoUrl?: string;
  legalMentions?: string;
  termsAndConditions?: string;
  currency?: string;
}) => {
  return await apiRequest(
    "/factures/family-invoice",
    "POST",
    familyInvoiceData as Record<string, unknown>
  );
};

// Générer une facture automatiquement après un paiement (endpoint dédié backend)
export const generateInvoiceAfterPayment = async (payload: {
  student_id: string;
  parent_id?: string | null;
  montant_paye: number;
  mode_paiement: string;
  payment_id?: string | null;
  qui_a_paye: string;
  enregistre_par: string;
  reference_externe?: string | null;
  tarif_items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}) => {
  return await apiRequest(
    "/factures/generate-after-payment",
    "POST",
    payload as unknown as Record<string, unknown>
  );
};

export const getAllFactures = async () => {
  return await apiRequest("/factures", "GET");
};
