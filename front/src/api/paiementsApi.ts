import { apiRequest } from "@/lib/api";

export interface Paiement {
  id?: string;
  etudiant_id: string;
  facture_ids: string[];
  montantPaye: number;
  // Backend uses `mode` for payment method
  mode?: string;
  // Legacy/compat field sometimes used in UI
  methode?: string;
  justificatif_url?: string;
  status?: string;
  // Backend uses createdAt for date
  createdAt?: string | Date;
  // Legacy date field for compatibility
  date?: string;
  description?: string;
  // Backend fields
  qui_a_paye?: string;
  enregistre_par?: string;
  payer_user_id?: string;
  recordedBy_user_id?: string;
  external_id?: string;
  details?: Record<string, unknown>;
  montant_du?: number;
  montant_payee?: number;
  montant_restant?: number;
  annee_scolaire?: string;
  updatedAt?: string | Date;
  disputeStatus?: string;
  disputeReason?: string;
  refundStatus?: string;
  refundReason?: string;
  // Add other fields as necessary
  [key: string]: unknown;
}

export const getAllPaiements = async (
  etudiant_id?: string,
  status?: string,
  method?: string
) => {
  const params: Record<string, string> = {};
  if (etudiant_id) {
    // Envoyer les deux clés pour compat (backend peut accepter l'une ou l'autre)
    params.etudiant_id = etudiant_id;
    params.student_id = etudiant_id;
  }
  if (status && status !== "Tous") params.status = status;
  if (method && method !== "Tous") params.method = method;
  // Bypass cache to avoid 304 with empty body on XHR
  params._ts = String(Date.now());
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/paiements?${queryString}` : "/paiements";
  if (queryString) {
    // Debug léger pour vérifier le filtrage
  }
  
  // Utiliser l'API backend réelle au lieu des données mockées
  const res = await apiRequest(url, "GET");

  // Normaliser la réponse afin de toujours retourner { status: boolean, data: Paiement[] }
  let data: Paiement[] = [];
  let statusFlag: boolean | undefined = undefined;
  try {
    const keys =
      res && typeof res === "object" ? Object.keys(res as object) : [];
    // Déterminer le statut si présent
    if (
      res &&
      typeof res === "object" &&
      "status" in (res as Record<string, unknown>)
    ) {
      statusFlag = Boolean((res as Record<string, unknown>)["status"]);
    }
    // Extraire un tableau de paiements quelle que soit la forme
    if (Array.isArray(res)) {
      data = res as Paiement[];
    } else if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        data = obj.data as Paiement[];
      } else if (
        obj.data &&
        typeof obj.data === "object" &&
        Array.isArray((obj.data as Record<string, unknown>).data)
      ) {
        data = (obj.data as Record<string, unknown>).data as Paiement[];
      } else if (Array.isArray(obj.results)) {
        data = obj.results as Paiement[];
      }
    }
  } catch (e) {
  }
  // Add logging for payment object keys
  if (Array.isArray(data)) {
    data.forEach((payment, index) => {
    });
  }
  return { status: statusFlag ?? true, data } as {
    status: boolean;
    data: Paiement[];
  };
};

export const createPaiement = async (
  paiement: Paiement | Partial<Paiement>
) => {
  // Normalize to backend shape
  const payload: Record<string, unknown> = { ...paiement };
  // Harmonize student id
  if (!payload["etudiant_id"] && typeof payload["student_id"] === "string") {
    payload["etudiant_id"] = payload["student_id"];
  }
  // Provide both keys for compatibility
  if (typeof payload["etudiant_id"] === "string" && !payload["student_id"]) {
    payload["student_id"] = payload["etudiant_id"];
  }
  // Harmonize amount field
  if (
    typeof payload["montantPaye"] === "undefined" &&
    typeof payload["montant_paye"] !== "undefined"
  ) {
    const v = Number(payload["montant_paye"]);
    if (!Number.isNaN(v)) payload["montantPaye"] = v;
  }
  // Ensure montantPaye is a valid number
  if (typeof payload["montantPaye"] !== "number") {
    const v = Number(payload["montantPaye"]);
    if (!Number.isNaN(v)) payload["montantPaye"] = v;
  }
  // Harmonize payment method
  const toStr = (v: unknown): string | undefined => {
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    return undefined;
  };
  // Ensure backend-required `mode` is present. Also keep `methode` for compat.
  {
    const mv =
      toStr(payload["mode_paiement"]) ??
      toStr(payload["mode"]) ??
      toStr(payload["methode"]);
    if (mv) {
      // Normalize PayPal casing
      const normalized = mv.toLowerCase() === "paypal" ? "PayPal" : mv;
      payload["mode"] = normalized;
      if (!payload["methode"]) payload["methode"] = normalized;
    }
    // Remove legacy alias if present; keep canonical keys
    delete payload["mode_paiement"];
  }
  // Ensure facture_ids is an array (backend may require the key to exist)
  if (!Array.isArray(payload["facture_ids"])) {
    payload["facture_ids"] = [] as string[];
  }
  // Default status if not provided
  if (!payload["status"]) {
    payload["status"] = "enregistré";
  }
  return await apiRequest("/paiements", "POST", payload);
};

export const updatePaiement = async (
  id: string,
  paiement: Partial<Paiement>
) => {
  return await apiRequest(`/paiements/${id}`, "PUT", paiement);
};

export const deletePaiement = async (id: string) => {
  return await apiRequest(`/paiements/${id}`, "DELETE");
};

export const getPaiementById = async (id: string) => {
  return await apiRequest(`/paiements/${id}`, "GET");
};

export const uploadPaymentProof = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  // Pass FormData directly so the api layer can detect and avoid forcing JSON Content-Type
  return await apiRequest(
    "/upload/single",
    "POST",
    formData as unknown as Record<string, unknown>
  );
};
