import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Users, BookOpen, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteClasse, getClasses, Classe } from "../api/classesApi";
import { getEtudiants, type Etudiant } from "@/api/etudiantsApi";
import CreateClassModal from "@/components/CreateClassModal";
import { useState } from "react";
import EditClassModal from "@/components/EditClassModal";
import { toast } from "@/components/ui/use-toast";

export default function Classes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Classe | null>(null);
  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });
  const { data: etudiantsResp } = useQuery({
    queryKey: ["etudiants"],
    queryFn: getEtudiants,
  });
  const queryClient = useQueryClient();

  // Normaliser la réponse étudiants en tableau
  let etudiants: Etudiant[] = [];
  if (Array.isArray(etudiantsResp)) {
    etudiants = etudiantsResp as Etudiant[];
  } else if (etudiantsResp?.data && Array.isArray(etudiantsResp.data)) {
    etudiants = etudiantsResp.data as Etudiant[];
  }
  // Construire une map classe_id -> nombre d'étudiants
  const studentsCountByClass: Record<string, number> = etudiants.reduce(
    (acc: Record<string, number>, e: Etudiant) => {
      const cid = e?.classe_id;
      if (cid) {
        acc[cid] = (acc[cid] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClasse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Classe supprimée",
        description: "La classe a été supprimée avec succès.",
      });
    },
    onError: (error: unknown) => {
      const message = (error as Error)?.message ?? "Erreur inconnue";
      toast({
        title: "Erreur",
        description: `Suppression impossible: ${message}`,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Chargement des classes...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des classes: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestion des Classes
          </h1>
          <p className="text-muted-foreground">
            Organisez et gérez vos classes scolaires
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:opacity-90 shadow-glow"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer une classe
        </Button>
      </motion.div>

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <EditClassModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        classe={selectedClass}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {classes?.map((classe, index) => (
          <motion.div
            key={classe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-lg transition-all hover:scale-105">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{classe.nom}</CardTitle>
                    <CardDescription>{classe.niveau}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    {(() => {
                      const id = String(classe.id || "");
                      let count = 0;
                      if (typeof classe.nombreEtudiants === "number") {
                        count = classe.nombreEtudiants;
                      } else if (id) {
                        count = studentsCountByClass[id] ?? 0;
                      }
                      return `${count}/${Number(classe.capacite)}`;
                    })()}
                  </Badge>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedClass(classe as unknown as Classe);
                      setIsEditOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Éditer
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (!classe.id) {
                        toast({
                          title: "ID manquant",
                          description:
                            "Impossible de supprimer: identifiant introuvable.",
                          variant: "destructive",
                        });
                        return;
                      }
                      const ok = window.confirm(
                        `Supprimer la classe "${classe.nom}" ? Cette action est irréversible.`
                      );
                      if (ok) deleteMutation.mutate(classe.id as string);
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />{" "}
                    {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{classe.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Année Scolaire: {classe.annee_scolaire}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all"
                      style={(() => {
                        const id = String(classe.id || "");
                        let count = 0;
                        if (typeof classe.nombreEtudiants === "number") {
                          count = classe.nombreEtudiants;
                        } else if (id) {
                          count = studentsCountByClass[id] ?? 0;
                        }
                        const capacity = Math.max(
                          1,
                          Number(classe.capacite || 0)
                        );
                        const percent = Math.min(
                          100,
                          Math.max(0, (count / capacity) * 100)
                        );
                        return { width: `${percent}%` } as React.CSSProperties;
                      })()}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const id = String(classe.id || "");
                      let count = 0;
                      if (typeof classe.nombreEtudiants === "number") {
                        count = classe.nombreEtudiants;
                      } else if (id) {
                        count = studentsCountByClass[id] ?? 0;
                      }
                      const capacity = Math.max(
                        1,
                        Number(classe.capacite || 0)
                      );
                      return (
                        <>
                          {count} étudiants sur {capacity}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
