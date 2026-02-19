import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { bourseService } from "@/services/bourseService";
import { getEtudiants } from "@/api/etudiantsApi";

interface Bourse {
  id: string;
  nom: string;
  description?: string;
  pourcentage_remise?: number;
  montant_remise?: number;
  criteres?: string;
  status: "active" | "inactive" | "expire";
  isExempt?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  nombreBeneficiaires?: number;
  maxBeneficiaires?: number;
}

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  classe?: string;
  status?: string;
  bourse_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

const BourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utiliser React Query pour récupérer la bourse depuis l'API
  const {
    data: bourseData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bourse", id],
    queryFn: () => bourseService.getById(id!),
    enabled: !!id,
  });

  const bourse = bourseData?.data;

  // Récupérer les étudiants affectés à cette bourse depuis l'API
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: ["bourse-students", id],
    queryFn: () => bourseService.getBourseStudents(id!),
    enabled: !!id,
  });

  const assignedStudents = studentsData?.data || [];

  // Récupérer tous les étudiants pour l'affectation
  const { data: allStudentsData, isLoading: allStudentsLoading } = useQuery({
    queryKey: ["all-students"],
    queryFn: getEtudiants,
  });

  const allStudents = allStudentsData?.data || [];

  // États pour l'affectation
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground">Active</Badge>
        );
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "expire":
        return <Badge variant="destructive">Expirée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  // Fonction pour ouvrir le dialog d'affectation
  const handleAssignClick = () => {
    setIsAssignDialogOpen(true);
  };

  // Fonction pour affecter un étudiant à la bourse
  const handleAssignStudent = async () => {
    if (!selectedStudentId || !id) return;

    try {
      // Mettre à jour l'étudiant avec l'ID de la bourse
      const response = await fetch(
        `/gestionadminastration/us-central1/api/v1/etudiants/${selectedStudentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            bourse_id: id,
          }),
        },
      );

      if (response.ok) {
        toast({
          title: "Étudiant affecté",
          description: "L'étudiant a été affecté à la bourse avec succès.",
        });

        // Rafraîchir les données
        queryClient.invalidateQueries(["bourse-students", id]);
        queryClient.invalidateQueries(["all-students"]);

        // Fermer le dialog
        setIsAssignDialogOpen(false);
        setSelectedStudentId("");
      } else {
        throw new Error("Erreur lors de l'affectation");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'affecter l'étudiant à la bourse.",
        variant: "destructive",
      });
    }
  };

  // Filtrer les étudiants déjà affectés à cette bourse
  const availableStudents = allStudents.filter(
    (student) =>
      !assignedStudents.some((assigned) => assigned.id === student.id),
  );

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Chargement de la bourse...</h2>
      </div>
    );
  }

  if (error || !bourse) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Bourse non trouvée</h2>
        <p className="text-muted-foreground mt-2">
          {error
            ? "Erreur lors du chargement de la bourse"
            : "Cette bourse n'existe pas"}
        </p>
        <Button onClick={() => navigate("/bourses")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste des bourses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl md:text-2xl font-bold">
            {bourse.nom}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(bourse.status)}
          </div>
        </CardHeader>
        <div className="px-6 pb-2 text-sm text-muted-foreground -mt-2">
          {bourse.description}
        </div>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            {bourse.pourcentage_remise && (
              <p>
                <span className="font-semibold">Pourcentage de remise:</span>{" "}
                {bourse.pourcentage_remise}%
              </p>
            )}
            {bourse.montant_remise && (
              <p>
                <span className="font-semibold">Montant de remise:</span>{" "}
                {bourse.montant_remise.toLocaleString()} MAD
              </p>
            )}
            {bourse.criteres && (
              <p className="mt-2">
                <span className="font-semibold">Critères:</span>{" "}
                {bourse.criteres}
              </p>
            )}
          </div>
          <div>
            {bourse.createdAt && (
              <p>
                <span className="font-semibold">Créée le:</span>{" "}
                {new Date(bourse.createdAt).toLocaleDateString("fr-FR")}
              </p>
            )}
            {bourse.updatedAt && (
              <p className="mt-2">
                <span className="font-semibold">Modifiée le:</span>{" "}
                {new Date(bourse.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            )}
            {bourse.isExempt && (
              <p className="mt-2">
                <span className="font-semibold">Exemption:</span>{" "}
                <Badge variant="success">Exempté</Badge>
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <p className="font-semibold">Bénéficiaires:</p>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((assignedStudents.length / 10) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {assignedStudents.length} étudiant(s) affecté(s) à cette bourse
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Étudiants Affectés</CardTitle>
          <Button
            onClick={handleAssignClick}
            size="sm"
            disabled={availableStudents.length === 0}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Affecter un étudiant
          </Button>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <p className="text-muted-foreground">Chargement des étudiants...</p>
          ) : studentsError ? (
            <p className="text-red-600">
              Erreur lors du chargement des étudiants
            </p>
          ) : assignedStudents.length === 0 ? (
            <p className="text-muted-foreground">
              Aucun étudiant affecté à cette bourse pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {assignedStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {student.prenom} {student.nom}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.email && `Email: ${student.email}`}
                      {student.telephone && ` | Tél: ${student.telephone}`}
                    </p>
                    {student.classe && (
                      <p className="text-sm text-muted-foreground">
                        Classe: {student.classe}
                      </p>
                    )}
                    {student.status && (
                      <Badge
                        variant={
                          student.status === "active" ? "default" : "secondary"
                        }
                      >
                        {student.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'affectation d'étudiant */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Affecter un étudiant à la bourse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-select">Sélectionner un étudiant</Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un étudiant..." />
                </SelectTrigger>
                <SelectContent>
                  {allStudentsLoading ? (
                    <SelectItem value="loading" disabled>
                      Chargement des étudiants...
                    </SelectItem>
                  ) : availableStudents.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucun étudiant disponible
                    </SelectItem>
                  ) : (
                    availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.prenom} {student.nom}
                        {student.email && ` (${student.email})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false);
                  setSelectedStudentId("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAssignStudent}
                disabled={!selectedStudentId}
              >
                Affecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BourseDetails;
