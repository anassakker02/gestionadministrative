import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTarifs,
  createTarif,
  updateTarif,
  deleteTarif,
  Tarif,
} from "../api/tarifsApi";

const Tarifs = () => {
  const queryClient = useQueryClient();
  const { data: tarifs = [], isLoading } = useQuery<
    { tarifs: Tarif[] } | Tarif[]
  >({
    queryKey: ["tarifs"],
    queryFn: getTarifs,
  });
  const createMutation = useMutation({
    mutationFn: createTarif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tarifs"] }),
  });
  const updateMutation = useMutation({
    mutationFn: updateTarif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tarifs"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTarif,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tarifs"] }),
  });

  // TODO: Add form and UI logic for CRUD
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des Tarifs</h1>
      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <ul>
          {(Array.isArray(tarifs) ? tarifs : tarifs?.tarifs || []).map(
            (tarif: Tarif) => (
              <li
                key={tarif.id}
                className="mb-2 flex justify-between items-center"
              >
                <span>
                  {tarif.nom} - {tarif.montant} DH
                </span>
                <div>
                  <button
                    className="mr-2 px-2 py-1 bg-blue-500 text-white rounded"
                    onClick={() => {
                      /* TODO: Edit logic */
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() => deleteMutation.mutate(tarif.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
      {/* TODO: Add create form */}
    </div>
  );
};

export default Tarifs;
