import { apiRequest } from "@/lib/api";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export const uploadService = {
  // Upload d'un fichier (admin seulement)
  uploadFile: async (file: File, folder?: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiRequest("/upload", "POST", formData);
    return response.data;
  },

  // Upload multiple de fichiers
  uploadMultipleFiles: async (files: File[], folder?: string): Promise<UploadResponse[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await apiRequest("/upload/multiple", "POST", formData);
    return response.data;
  },

  // Supprimer un fichier
  deleteFile: async (filename: string) => {
    return await apiRequest(`/upload/${filename}`, "DELETE");
  },

  // Lister les fichiers
  listFiles: async (folder?: string) => {
    const url = folder ? `/upload?folder=${folder}` : '/upload';
    return await apiRequest(url, "GET");
  },

  // Obtenir l'URL d'un fichier
  getFileUrl: async (filename: string) => {
    return await apiRequest(`/upload/url/${filename}`, "GET");
  }
};
