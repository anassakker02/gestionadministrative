import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CreateBourseModal from "@/components/CreateBourseModal";
import { useNavigate } from "react-router-dom";
import {
  getAllBourses,
  createBourse,
  updateBourse,
  deleteBourse,
  Bourse,
} from "@/api/boursesApi";

interface BourseAssignment {
  bourseId: string;
  studentId: string;
}

const Bourses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBourse, setSelectedBourse] = useState<Bourse | null>(null);
  const [bourseToDelete, setBourseToDelete] = useState<Bourse | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Récupérer les bourses depuis l'API backend
  const { data: bourses = [], isLoading } = useQuery<Bourse[]>({
    queryKey: ["bourses"],
    queryFn: getAllBourses,
  });

  const filteredBourses = bourses.filter((bourse) => {
    const matchesSearch =
      bourse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bourse.description &&
        bourse.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || bourse.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
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

  const handleEdit = (bourse: Bourse) => {
    setSelectedBourse(bourse);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBourse(null);
    setIsDialogOpen(true);
  };

  // Mutation pour créer une bourse
  const createBourseMutation = useMutation({
    mutationFn: createBourse,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bourses"] });
      toast({
        title: "Bourse créée",
        description: `La bourse "${data.nom}" a été ajoutée avec succès.`,
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la bourse",
        variant: "destructive",
      });
    },
  });

  // Mutation pour mettre à jour une bourse
  const updateBourseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Bourse> }) =>
      updateBourse(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bourses"] });
      toast({
        title: "Bourse modifiée",
        description: `La bourse "${data.nom}" a été modifiée avec succès.`,
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de la modification de la bourse",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer une bourse
  const deleteBourseMutation = useMutation({
    mutationFn: deleteBourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bourses"] });
      toast({
        title: "Bourse supprimée",
        description: "La bourse a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de la suppression de la bourse",
        variant: "destructive",
      });
    },
  });

  const handleAddBourse = (
    newBourseData: Omit<Bourse, "id" | "nombreBeneficiaires">,
  ) => {
    createBourseMutation.mutate(newBourseData);
  };

  const handleUpdateBourse = (
    updatedBourseData: Omit<Bourse, "nombreBeneficiaires"> & { id: string },
  ) => {
    const { id, ...data } = updatedBourseData;
    updateBourseMutation.mutate({ id, data });
  };

  const handleViewDetails = useCallback(
    (bourse: Bourse) => {
      navigate(`/bourses/${bourse.id}`);
    },
    [navigate],
  );

  const handleDeleteClick = (bourse: Bourse) => {
    setBourseToDelete(bourse);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (bourseToDelete) {
      deleteBourseMutation.mutate(bourseToDelete.id);
      setIsDeleteDialogOpen(false);
      setBourseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setBourseToDelete(null);
  };

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Gestion des Bourses
          </h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1">
            Gérez les programmes de bourses et les aides financières pour les
            étudiants
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          className="bg-primary hover:bg-primary-hover w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Bourse
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher une bourse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expire">Expirée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bourses List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px] text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Nom</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Description
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          %
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Critères
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Bénéficiaires
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Statut
                        </TableHead>
                        <TableHead className="text-center whitespace-nowrap">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBourses.map((bourse) => (
                        <TableRow key={bourse.id}>
                          <TableCell className="font-medium align-top">
                            <div className="font-semibold line-clamp-1 max-w-[180px]">
                              {bourse.nom}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-top max-w-[220px]">
                            <div
                              className="truncate"
                              title={bourse.description || ""}
                            >
                              {bourse.description || "Aucune description"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <span className="font-semibold text-primary">
                              {bourse.pourcentage_remise ?? 0}%
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell align-top max-w-[260px]">
                            <div
                              className="truncate"
                              title={bourse.criteres || ""}
                            >
                              {bourse.criteres || "Aucun critère"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <Badge
                              variant="outline"
                              className="px-2 py-1 text-xs"
                            >
                              {bourse.nombreBeneficiaires || 0} étudiant(s)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            {getStatusBadge(bourse.status)}
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleViewDetails(bourse)}
                                title="Voir les détails"
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(bourse)}
                                title="Modifier"
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClick(bourse)}
                                disabled={deleteBourseMutation.isPending}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredBourses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune bourse trouvée
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredBourses.map((bourse) => (
              <Card key={bourse.id} className="p-4">
                <div className="space-y-3">
                  {/* Header with title and status */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{bourse.nom}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bourse.description || "Aucune description"}
                      </p>
                    </div>
                    <div className="ml-2">{getStatusBadge(bourse.status)}</div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Pourcentage:
                      </span>
                      <div className="font-semibold text-primary">
                        {bourse.pourcentage_remise ?? 0}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Bénéficiaires:
                      </span>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {bourse.nombreBeneficiaires || 0} étudiant(s)
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Criteria */}
                  {bourse.criteres && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Critères:</span>
                      <p className="mt-1">{bourse.criteres}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(bourse)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(bourse)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(bourse)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredBourses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune bourse trouvée
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {selectedBourse
                ? "Modifier la bourse"
                : "Créer une nouvelle bourse"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {selectedBourse
                ? "Modifiez les informations de la bourse sélectionnée."
                : "Remplissez les informations pour créer une nouvelle bourse."}
            </p>
          </DialogHeader>
          <CreateBourseModal
            initialData={selectedBourse}
            onSubmit={selectedBourse ? handleUpdateBourse : handleAddBourse}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-red-600">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer la bourse{" "}
              <strong>"{bourseToDelete?.nom}"</strong> ?
              <br />
              <br />
              Cette action est <strong>irréversible</strong> et supprimera
              définitivement :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Les informations de la bourse</li>
                <li>Les critères d'éligibilité</li>
                <li>L'historique des bénéficiaires</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={handleCancelDelete} className="flex-1">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteBourseMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteBourseMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Bourses;
