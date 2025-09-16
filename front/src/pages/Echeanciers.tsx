import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEcheanciers,
  createEcheancier,
  updateEcheancier,
  deleteEcheancier,
} from "../api/echeanciersApi";

const Echeanciers = () => {
  const queryClient = useQueryClient();
  const { data: echeanciers, isLoading } = useQuery({
    queryKey: ["echeanciers"],
    queryFn: getEcheanciers,
  });
  const createMutation = useMutation({
    mutationFn: createEcheancier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["echeanciers"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, echeancier }: { id: string; echeancier: any }) => updateEcheancier(id, echeancier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["echeanciers"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteEcheancier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["echeanciers"] }),
  });

  // TODO: Add form and UI logic for CRUD
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des Échéanciers</h1>
      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <ul>
          {echeanciers?.map((echeancier) => (
            <li
              key={echeancier.id}
              className="mb-2 flex justify-between items-center"
            >
              <span>
                {echeancier.nom} - {echeancier.description}
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
                  onClick={() => deleteMutation.mutate(echeancier.id)}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* TODO: Add create form */}
    </div>
  );
};

export default Echeanciers;
