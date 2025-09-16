import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";

interface Bourse {
  id: string;
  nom: string;
  description: string;
  montant: number;
  criteres: string;
  dateDebut: string;
  dateFin: string;
  status: 'active' | 'inactive' | 'expire';
  nombreBeneficiaires: number;
  maxBeneficiaires: number;
}

const Bourses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBourse, setSelectedBourse] = useState<Bourse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development
  const mockBourses: Bourse[] = [
    {
      id: '1',
      nom: 'Bourse Excellence Académique',
      description: 'Bourse destinée aux étudiants ayant obtenu une moyenne supérieure à 16/20',
      montant: 5000,
      criteres: 'Moyenne ≥ 16/20, Situation financière',
      dateDebut: '2024-09-01',
      dateFin: '2025-06-30',
      status: 'active',
      nombreBeneficiaires: 25,
      maxBeneficiaires: 50
    },
    {
      id: '2',
      nom: 'Bourse Sociale',
      description: 'Aide financière pour les étudiants en difficulté économique',
      montant: 3000,
      criteres: 'Revenus familiaux < 30 000 DH/an',
      dateDebut: '2024-09-01',
      dateFin: '2025-06-30',
      status: 'active',
      nombreBeneficiaires: 40,
      maxBeneficiaires: 100
    },
    {
      id: '3',
      nom: 'Bourse Innovation',
      description: 'Bourse pour projets innovants et entrepreneuriaux',
      montant: 8000,
      criteres: 'Projet innovant validé, Présentation devant jury',
      dateDebut: '2024-10-01',
      dateFin: '2025-05-31',
      status: 'active',
      nombreBeneficiaires: 5,
      maxBeneficiaires: 20
    }
  ];

  const { data: bourses = mockBourses, isLoading } = useQuery({
    queryKey: ['bourses'],
    queryFn: async () => {
      // Replace with actual API call
      return mockBourses;
    }
  });

  const filteredBourses = bourses.filter(bourse => {
    const matchesSearch = bourse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bourse.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bourse.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'expire':
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Bourses</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les programmes de bourses et les aides financières pour les étudiants
          </p>
        </div>
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary-hover">
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

      {/* Bourses Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBourses.map((bourse) => (
            <Card key={bourse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{bourse.nom}</CardTitle>
                  {getStatusBadge(bourse.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {bourse.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Montant:</span>
                    <span className="font-semibold text-primary">{bourse.montant.toLocaleString()} MAD</span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bénéficiaires:</span>
                      <span>{bourse.nombreBeneficiaires}/{bourse.maxBeneficiaires}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(bourse.nombreBeneficiaires / bourse.maxBeneficiaires) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Critères:</p>
                    <p className="text-sm">{bourse.criteres}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Du {bourse.dateDebut}</span>
                    <span>Au {bourse.dateFin}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(bourse)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredBourses.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucune bourse trouvée.</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedBourse ? 'Modifier la bourse' : 'Créer une nouvelle bourse'}
            </DialogTitle>
          </DialogHeader>
          {/* Dialog content would go here */}
          <div className="p-4">
            <p className="text-muted-foreground">
              Formulaire de création/modification à implémenter selon les besoins spécifiques.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bourses;