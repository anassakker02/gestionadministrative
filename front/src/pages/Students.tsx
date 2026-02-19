import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import {
  getEtudiants,
  deleteEtudiant,
  updateEtudiant,
} from "../api/etudiantsApi";
import { getAllPaiements } from "../api/paiementsApi";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Students = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isAdmin, isSubAdmin } = useAuth();
  const canManageStudents = isAdmin || isSubAdmin;
  // Pour afficher les détails d'un étudiant
  const handleView = async (id: string) => {
    navigate(`/students/${id}`);
  };

  // Pour supprimer un étudiant
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => deleteEtudiant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiants"] });
      toast({
        title: "Étudiant supprimé!",
        description: "L'étudiant a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la suppression de l'étudiant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet étudiant ?"))
      return;
    deleteStudentMutation.mutate(id);
  };

  // Pour modifier un étudiant (exemple simple: prompt)
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, student }: { id: string; student: any }) =>
      updateEtudiant(id, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiants"] });
      toast({
        title: "Étudiant mis à jour!",
        description: "L'étudiant a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la mise à jour de l'étudiant: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = async (student: any) => {
    const newName = window.prompt("Nouveau nom:", student.name);
    if (!newName) return;
    updateStudentMutation.mutate({ id: student.id, student: { nom: newName } });
  };
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["etudiants"],
    queryFn: getEtudiants,
  });

  // Récupérer tous les paiements pour agréger le montant payé par étudiant
  const { data: allPaymentsData } = useQuery({
    queryKey: ["paiements", "all"],
    queryFn: () => getAllPaiements(),
  });

  const allPayments = allPaymentsData?.data || [];
  const paymentsByStudent: Record<string, number> = {};
  allPayments.forEach((p: any) => {
    const sid = p.etudiant_id || p.student_id || "";
    const v = Number(p.montantPaye ?? p.montant_paye ?? 0);
    if (!sid) return;
    paymentsByStudent[sid] = (paymentsByStudent[sid] || 0) + (isNaN(v) ? 0 : v);
  });

  // Mapping des étudiants pour adapter les champs Firestore à ceux attendus par le front
  const students = (data?.data || []).map((etudiant: any) => ({
    id: etudiant.id,
    name: etudiant.nom + (etudiant.prenom ? " " + etudiant.prenom : ""),
    email: etudiant.email || "",
    class: etudiant.classe?.nom || etudiant.classe_id || "",
    phone: etudiant.telephone || "",
    status: etudiant.status || "Actif",
    balance: etudiant.balance ? etudiant.balance.toString() : "0",
  }));
  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) return <div>Chargement des étudiants...</div>;
  if (error) return <div>Erreur lors du chargement des étudiants</div>;

  return (
    <div className="space-y-8">
      {!user ? (
        <div className="text-red-600 font-bold p-4">
          Vous n'êtes pas connecté. Veuillez vous authentifier.
        </div>
      ) : !canManageStudents ? (
        <div className="text-red-600 font-bold p-4">
          Accès refusé. Vous n'avez pas la permission nécessaire pour accéder à
          cette page.
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Gestion des Étudiants
              </h1>
              <p className="text-muted-foreground">
                Gérez les informations de vos étudiants
              </p>
            </div>
            {/* Ajouter un étudiant retiré par décision du produit */}
          </motion.div>

          {/* Modal d'ajout d'étudiant retiré */}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </motion.div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant payé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge
                        variant={
                          student.status === "Actif" ? "default" : "secondary"
                        }
                      >
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(paymentsByStudent[student.id] || 0).toLocaleString()}{" "}
                      MAD
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(student.id)}
                      >
                        <Eye className="h-4 w-4" /> Détails
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">Aucun étudiant trouvé</p>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Students;
