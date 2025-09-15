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
import { Search, Plus, Filter, Edit, Trash2, Eye } from "lucide-react";
import CreateStudentModal from "@/components/CreateStudentModal";
import { getEtudiants, deleteEtudiant, updateEtudiant } from "../api/etudiantsApi";
import { toast } from "@/components/ui/use-toast";

const Students = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  // Pour afficher les détails d'un étudiant
  const handleView = async (id: string) => {
    try {
      // const res = await studentService.getStudent(id);
      alert(
        `Détails étudiant: (Not implemented yet)`
      );
    } catch (err: any) {
      alert(`Erreur lors de la récupération de l'étudiant: ${err.message}`);
    }
  };

  // Pour supprimer un étudiant
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => deleteEtudiant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiants"] });
      toast({ title: "Étudiant supprimé!", description: "L'étudiant a été supprimé avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de la suppression de l'étudiant: ${error.message}`, variant: "destructive" });
    },
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet étudiant ?")) return;
    deleteStudentMutation.mutate(id);
  };

  // Pour modifier un étudiant (exemple simple: prompt)
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, student }: { id: string; student: any }) => updateEtudiant(id, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["etudiants"] });
      toast({ title: "Étudiant mis à jour!", description: "L'étudiant a été mis à jour avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de la mise à jour de l'étudiant: ${error.message}`, variant: "destructive" });
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
      student.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Chargement des étudiants...</div>;
  if (error) return <div>Erreur lors du chargement des étudiants</div>;

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
            Gestion des Étudiants
          </h1>
          <p className="text-muted-foreground">
            Gérez les informations de vos étudiants
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un étudiant
        </Button>
      </motion.div>

      <CreateStudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

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

      {/* Students List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6"
      >
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{student.name}</CardTitle>
                    <CardDescription>{student.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        student.status === "Actif" ? "default" : "secondary"
                      }
                      className={student.status === "Actif" ? "bg-success" : ""}
                    >
                      {student.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        student.balance.includes("-")
                          ? "border-destructive text-destructive"
                          : student.balance.includes("+")
                          ? "border-success text-success"
                          : ""
                      }
                    >
                      {student.balance}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Classe:</span>{" "}
                      {student.class}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Téléphone:</span>{" "}
                      {student.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(student.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(student.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

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
    </div>
  );
};

export default Students;
