import { apiRequest } from "@/lib/api";

export interface ParentItem {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  password?: string; // Optionnel car pas toujours affiché
  etudiant_id?: string; // ID de l'étudiant lié
}

type ParentsListResponse =
  | { status?: boolean; message?: string; data?: ParentItem[] }
  | ParentItem[];

function hasDataArray(x: ParentsListResponse): x is { data: ParentItem[] } {
  return (
    typeof x === "object" &&
    x !== null &&
    "data" in x &&
    Array.isArray((x as { data?: unknown }).data)
  );
}

export const getParents = async (): Promise<ParentItem[]> => {
  const response = (await apiRequest("/parents", "GET")) as ParentsListResponse;
  if (Array.isArray(response)) return response;
  if (hasDataArray(response)) return response.data;
  return [];
};

export const createParent = async (parent: Omit<ParentItem, "id">): Promise<ParentItem> => {
  try {
    
    // Validation côté client des données
    if (!parent.nom || !parent.prenom || !parent.email || !parent.password) {
      throw new Error("Tous les champs obligatoires doivent être remplis");
    }
    
    // Nettoyer le numéro de téléphone
    const cleanTelephone = parent.telephone?.replace(/[^\d+]/g, '') || "";
    
    // Utiliser l'endpoint /parents qui créera à la fois un parent et un utilisateur
    const parentData = {
      nom: parent.nom.trim(),
      prenom: parent.prenom.trim(),
      email: parent.email.trim().toLowerCase(),
      telephone: cleanTelephone,
      adresse: parent.adresse?.trim() || "",
      password: parent.password,
      etudiant_id: parent.etudiant_id || null,
    };
    
    const response = await apiRequest("/parents", "POST", parentData);
    
    // Vérifier la réponse
    if (!response || !response.data) {
      throw new Error("Réponse invalide du serveur");
    }
    
    // Retourner les données dans le format attendu
    return {
      id: response.data.id,
      nom: response.data.nom,
      prenom: response.data.prenom,
      email: response.data.email,
      telephone: response.data.telephone,
      adresse: response.data.adresse,
    };
  } catch (error: any) {
    
    // Améliorer les messages d'erreur
    if (error.message?.includes("encryption") || error.message?.includes("Invalid key length")) {
      throw new Error("Erreur de validation des données. Vérifiez le format des champs.");
    } else if (error.message?.includes("email") && error.message?.includes("existe")) {
      throw new Error("Cette adresse email est déjà utilisée.");
    } else if (error.message?.includes("validation")) {
      throw new Error("Erreur de validation des données. Vérifiez le format des champs.");
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      throw new Error("Erreur de connexion. Vérifiez votre connexion internet.");
    } else {
      throw new Error(error.message || "Erreur lors de la création du parent");
    }
  }
};
