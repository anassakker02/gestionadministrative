import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFraisPonctuels,
  createFraisPonctuel,
  updateFraisPonctuel,
  deleteFraisPonctuel,
} from "../api/fraisPonctuelsApi";

const FraisPonctuels = () => {
  const queryClient = useQueryClient();
  const { data: fraisPonctuels, isLoading } = useQuery({
    queryKey: ["fraisPonctuels"],
    queryFn: getFraisPonctuels,
  });
  const createMutation = useMutation({
    mutationFn: createFraisPonctuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraisPonctuels"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: updateFraisPonctuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraisPonctuels"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFraisPonctuel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraisPonctuels"] });
    },
  });

  // TODO: Add form and UI logic for CRUD
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des Frais Ponctuels</h1>
      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <ul>
          {fraisPonctuels?.map((frais) => (
            <li
              key={frais.id}
              className="mb-2 flex justify-between items-center"
            >
              <span>
                {frais.nom} - {frais.montant} DH
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
                  onClick={() => deleteMutation.mutate(frais.id)}
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

export default FraisPonctuels;
