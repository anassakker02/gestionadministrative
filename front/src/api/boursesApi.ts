import { apiRequest } from "@/lib/api";

export interface Bourse {
  id: string;
  nom: string;
  description?: string;
  pourcentage_remise?: number | null;
  montant_remise?: number | null;
  isExempt?: boolean;
  criteres?: string;
  status?: 'active' | 'inactive' | 'expire';
  isActive?: boolean;
  nombreBeneficiaires?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBourseData {
  nom: string;
  description?: string;
  pourcentage_remise?: number | null;
  montant_remise?: number | null;
  isExempt?: boolean;
  criteres?: string;
  status?: 'active' | 'inactive' | 'expire';
}

export interface UpdateBourseData extends Partial<CreateBourseData> {
  id: string;
}

// Récupérer tous les pourcentages disponibles
export const getBoursePercentages = async (): Promise<number[]> => {
  try {
    const response = await apiRequest("/bourses/percentages", "GET");
    return response.data || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des pourcentages:", error);
    // Fallback vers les pourcentages par défaut
    return [25, 50, 60];
  }
};

// Récupérer toutes les bourses
export const getAllBourses = async (): Promise<Bourse[]> => {
  try {
    const response = await apiRequest("/bourses", "GET");
    return response.data || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des bourses:", error);
    return [];
  }
};

// Créer une nouvelle bourse
export const createBourse = async (data: CreateBourseData) => {
  return await apiRequest("/bourses", "POST", data);
};

// Mettre à jour une bourse
export const updateBourse = async (id: string, data: Partial<CreateBourseData>) => {
  return await apiRequest(`/bourses/${id}`, "PUT", data);
};

// Supprimer une bourse
export const deleteBourse = async (id: string) => {
  return await apiRequest(`/bourses/${id}`, "DELETE");
};

// Récupérer une bourse par ID
export const getBourseById = async (id: string) => {
  return await apiRequest(`/bourses/${id}`, "GET");
};
