export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role:
    | "admin"
    | "sous-admin"
    | "comptable"
    | "etudiant"
    | "parent"
    | "enseignant"
    | "personnel"
    | null;
  telephone?: string;
  adresse?: string;
  status?: "pending" | "active" | "inactive";
  createdBy?: string;
  assignedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}
