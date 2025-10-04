export interface Facture {
  id: string;
  numero?: string;
  etudiant_id: string;
  parent_id?: string;
  montant_total: number;
  montantPaye: number;
  montantRestant: number;
  statut: "payée" | "impayée" | "partielle";
  date_emission: string;
  date_echeance?: string;
  description?: string;
  anneeScolaire?: string;
  currency?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}
