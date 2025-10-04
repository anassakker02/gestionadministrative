import React from "react";
import { useQuery } from "@tanstack/react-query";
import { factureService } from "@/services/factureService";
import { Link } from "react-router-dom";
import { Facture } from "@/types/facture";

// Page Factures minimale et stable
const Factures: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["factures"],
    queryFn: () => factureService.getFactures(),
  });

  if (isLoading) return <div>Chargement des factures...</div>;
  if (error) return <div>Erreur lors du chargement des factures</div>;

  const list: Facture[] = (data && (data as { data?: Facture[] }).data) || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Factures</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Numéro</th>
            <th className="px-4 py-2 text-left">Étudiant</th>
            <th className="px-4 py-2 text-left">Montant total</th>
            <th className="px-4 py-2 text-left">Montant payé</th>
            <th className="px-4 py-2 text-left">Montant restant</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length > 0 ? (
            list.map((f: Facture) => (
              <tr key={f.id} className="border-t">
                <td className="px-4 py-2">
                  {(f as unknown as { numero?: string }).numero ?? f.id}
                </td>
                <td className="px-4 py-2">
                  {(f as unknown as { etudiant?: { nom?: string } }).etudiant
                    ?.nom ?? "-"}
                </td>
                <td className="px-4 py-2">
                  {(f as unknown as { montant_total?: number | string })
                    .montant_total ?? "-"}
                </td>
                <td className="px-4 py-2">
                  {(f as unknown as { montantPaye?: number }).montantPaye ?? 0}
                </td>
                <td className="px-4 py-2">
                  {(f as unknown as { montantRestant?: number })
                    .montantRestant ?? 0}
                </td>
                <td className="px-4 py-2">
                  <Link to={`/factures/${f.id}`} className="text-blue-600">
                    Voir
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-2">
                Aucune facture trouvée.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Factures;
