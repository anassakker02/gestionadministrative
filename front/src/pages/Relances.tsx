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
import { 
  Bell, 
  Send, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  User,
  Plus,
  Search,
  Filter,
  Eye,
  AlertTriangle
} from "lucide-react";

interface Relance {
  id: string;
  etudiantId: string;
  etudiantNom: string;
  etudiantEmail: string;
  etudiantTelephone?: string;
  factureId: string;
  factureNumero: string;
  montantDu: number;
  joursRetard: number;
  typeRelance: 'email' | 'sms' | 'appel' | 'courrier';
  statusRelance: 'en_attente' | 'envoye' | 'recu' | 'ignore';
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  dateCreation: string;
  dateEnvoi?: string;
  message: string;
  reponse?: string;
}

const Relances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [prioriteFilter, setPrioriteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelance, setSelectedRelance] = useState<Relance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for development
  const mockRelances: Relance[] = [
    {
      id: '1',
      etudiantId: 'E001',
      etudiantNom: 'Ahmed Khalil',
      etudiantEmail: 'ahmed.khalil@email.com',
      etudiantTelephone: '+212 6 12 34 56 78',
      factureId: 'F001',
      factureNumero: 'FAC-2025-001',
      montantDu: 20000,
      joursRetard: 15,
      typeRelance: 'email',
      statusRelance: 'envoye',
      priorite: 'normale',
      dateCreation: '2024-12-20',
      dateEnvoi: '2024-12-21',
      message: 'Rappel de paiement pour la facture de janvier 2025. Merci de régulariser votre situation.',
    },
    {
      id: '2',
      etudiantId: 'E002',
      etudiantNom: 'Fatima Zahra',
      etudiantEmail: 'fatima.zahra@email.com',
      etudiantTelephone: '+212 6 98 76 54 32',
      factureId: 'F002',
      factureNumero: 'FAC-2024-123',
      montantDu: 15000,
      joursRetard: 30,
      typeRelance: 'sms',
      statusRelance: 'en_attente',
      priorite: 'haute',
      dateCreation: '2024-12-15',
      message: 'Dernière relance avant procédure de recouvrement.',
    },
    {
      id: '3',
      etudiantId: 'E003',
      etudiantNom: 'Omar Benali',
      etudiantEmail: 'omar.benali@email.com',
      factureId: 'F003',
      factureNumero: 'FAC-2024-122',
      montantDu: 25000,
      joursRetard: 45,
      typeRelance: 'appel',
      statusRelance: 'recu',
      priorite: 'urgente',
      dateCreation: '2024-12-01',
      dateEnvoi: '2024-12-02',
      message: 'Appel téléphonique effectué concernant les factures en retard.',
      reponse: 'Étudiant contacté, promesse de paiement sous 48h'
    }
  ];

  const { data: relances = mockRelances, isLoading } = useQuery({
    queryKey: ['relances'],
    queryFn: async () => {
      // Replace with actual API call
      return mockRelances;
    }
  });

  const filteredRelances = relances.filter(relance => {
    const matchesSearch = relance.etudiantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relance.factureNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relance.etudiantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || relance.typeRelance === typeFilter;
    const matchesPriorite = prioriteFilter === 'all' || relance.priorite === prioriteFilter;
    const matchesStatus = statusFilter === 'all' || relance.statusRelance === statusFilter;
    
    return matchesSearch && matchesType && matchesPriorite && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      case 'envoye':
        return <Badge className="bg-info text-info-foreground">Envoyé</Badge>;
      case 'recu':
        return <Badge className="bg-success text-success-foreground">Reçu</Badge>;
      case 'ignore':
        return <Badge variant="destructive">Ignoré</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return <Badge variant="destructive" className="animate-pulse">Urgente</Badge>;
      case 'haute':
        return <Badge className="bg-orange-500 text-white">Haute</Badge>;
      case 'normale':
        return <Badge variant="secondary">Normale</Badge>;
      case 'basse':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'appel':
        return <Phone className="h-4 w-4" />;
      case 'courrier':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getRetardLevel = (jours: number) => {
    if (jours >= 60) return { level: 'critique', color: 'text-red-600' };
    if (jours >= 30) return { level: 'sévère', color: 'text-orange-500' };
    if (jours >= 15) return { level: 'modéré', color: 'text-yellow-600' };
    return { level: 'léger', color: 'text-blue-500' };
  };

  const handleCreateRelance = () => {
    setSelectedRelance(null);
    setIsDialogOpen(true);
  };

  const handleViewRelance = (relance: Relance) => {
    setSelectedRelance(relance);
    setIsDialogOpen(true);
  };

  // Stats
  const stats = {
    total: relances.length,
    enAttente: relances.filter(r => r.statusRelance === 'en_attente').length,
    envoye: relances.filter(r => r.statusRelance === 'envoye').length,
    recu: relances.filter(r => r.statusRelance === 'recu').length,
    montantTotal: relances.reduce((sum, r) => sum + r.montantDu, 0)
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Relances</h1>
          <p className="text-muted-foreground mt-2">
            Suivez et gérez les relances de paiement pour les factures en retard
          </p>
        </div>
        <Button onClick={handleCreateRelance} className="bg-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Relance
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">TOTAL RELANCES</div>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">EN ATTENTE</div>
            <div className="text-2xl font-bold text-warning">{stats.enAttente}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">ENVOYÉES</div>
            <div className="text-2xl font-bold text-info">{stats.envoye}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">REÇUES</div>
            <div className="text-2xl font-bold text-success">{stats.recu}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">MONTANT TOTAL</div>
            <div className="text-xl font-bold text-primary">{stats.montantTotal.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="recu">Reçu</SelectItem>
                <SelectItem value="ignore">Ignoré</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="appel">Appel</SelectItem>
                <SelectItem value="courrier">Courrier</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relances List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRelances.map((relance) => {
            const retardInfo = getRetardLevel(relance.joursRetard);
            
            return (
              <Card key={relance.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(relance.typeRelance)}
                          <span className="font-semibold text-lg">{relance.etudiantNom}</span>
                        </div>
                        {getStatusBadge(relance.statusRelance)}
                        {getPrioriteBadge(relance.priorite)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Facture:</span>
                          <div className="font-medium">{relance.factureNumero}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Montant dû:</span>
                          <div className="font-bold text-primary">{relance.montantDu.toLocaleString()} MAD</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Retard:</span>
                          <div className={`font-medium ${retardInfo.color}`}>
                            {relance.joursRetard} jours ({retardInfo.level})
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Créée le:</span>
                          <div className="font-medium">{relance.dateCreation}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">{relance.message}</p>
                        {relance.reponse && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">Réponse: </span>
                            <span className="text-sm text-success">{relance.reponse}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-auto w-full">
                      <Button 
                        variant="outline"
                        onClick={() => handleViewRelance(relance)}
                        className="w-full md:w-auto"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                      
                      {relance.statusRelance === 'en_attente' && (
                        <Button className="bg-primary hover:bg-primary-hover w-full md:w-auto">
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </Button>
                      )}
                      
                      {relance.statusRelance === 'ignore' && (
                        <Button variant="outline" className="w-full md:w-auto">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Relancer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredRelances.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucune relance trouvée.</p>
          </CardContent>
        </Card>
      )}

      {/* View/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRelance ? 'Détails de la relance' : 'Créer une nouvelle relance'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedRelance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Étudiant</label>
                    <p className="text-lg">{selectedRelance.etudiantNom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p>{selectedRelance.etudiantEmail}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Facture</label>
                    <p>{selectedRelance.factureNumero}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Montant</label>
                    <p className="font-bold text-primary">{selectedRelance.montantDu.toLocaleString()} MAD</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg">
                    <p>{selectedRelance.message}</p>
                  </div>
                </div>
                
                {selectedRelance.reponse && (
                  <div>
                    <label className="text-sm font-medium">Réponse</label>
                    <div className="mt-1 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p>{selectedRelance.reponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Formulaire de création de relance à implémenter selon les besoins spécifiques.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Relances;