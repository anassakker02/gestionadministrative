import { useQuery } from "@tanstack/react-query";
import { factureService } from "@/services/factureService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Filter, Download, Eye, CreditCard, ArrowLeft } from "lucide-react";

const Factures = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["factures", userId],
    queryFn: () => factureService.getFacturesByStudent(userId),
    enabled: !!userId,
  });

  const factures = data?.data || [];

  // Calcul des statistiques
  const stats = {
    payees: factures.filter((f: any) => f.status === "payee").reduce((sum: number, f: any) => sum + f.montant, 0),
    enAttente: factures.filter((f: any) => f.status === "en_attente").reduce((sum: number, f: any) => sum + f.montant, 0),
    enRetard: factures.filter((f: any) => f.status === "non_payee").reduce((sum: number, f: any) => sum + f.montant, 0),
    total: factures.reduce((sum: number, f: any) => sum + f.montant, 0)
  };

  // Filtrage des factures
  const filteredFactures = factures.filter((facture: any) => {
    const matchesSearch = facture.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facture.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || facture.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "payee":
        return <Badge className="bg-success text-success-foreground">Payé</Badge>;
      case "en_attente":
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      case "non_payee":
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header avec navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mes Factures
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>AK</span>
          <span>Ahmed Khalil</span>
          <Button variant="outline" size="sm">
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur-sm border-success/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">FACTURES PAYÉES</div>
            <div className="text-xl font-bold text-success">{stats.payees.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-warning/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">EN ATTENTE</div>
            <div className="text-xl font-bold text-warning">{stats.enAttente.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-destructive/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">EN RETARD</div>
            <div className="text-xl font-bold text-destructive">{stats.enRetard.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">TOTAL ANNÉE</div>
            <div className="text-xl font-bold text-primary">{stats.total.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrer les factures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="payee">Payé</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="non_payee">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Période</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toute l'année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute l'année</SelectItem>
                  <SelectItem value="current_month">Mois actuel</SelectItem>
                  <SelectItem value="last_month">Mois dernier</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-2 block">Date de début</label>
              <div className="flex gap-2">
                <Input type="date" placeholder="jj/mm/aaaa" className="flex-1" />
                <Input type="date" placeholder="jj/mm/aaaa" className="flex-1" />
                <Button className="bg-primary hover:bg-primary-hover">
                  Appliquer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Mes Factures ({filteredFactures.length})</h2>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des factures</p>
            </CardContent>
          </Card>
        )}

        {filteredFactures.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Aucune facture trouvée</p>
            </CardContent>
          </Card>
        )}

        {filteredFactures.map((facture: any) => (
          <Card key={facture.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">
                      Facture N° {facture.numero || `FAC-${facture.id?.slice(-8)}`}
                    </span>
                    {getStatusBadge(facture.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Période</span>
                      <div className="font-medium">Janvier 2025</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date d'émission</span>
                      <div className="font-medium">{facture.date || '2025-01-02'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date d'échéance</span>
                      <div className="font-medium">2025-01-30</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant</span>
                      <div className="font-bold text-lg text-primary">
                        {facture.montant?.toLocaleString() || '20000'} MAD
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:w-auto w-full">
                  {facture.status !== "payee" && (
                    <Button className="bg-primary hover:bg-primary-hover">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payer Maintenant
                    </Button>
                  )}
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Voir Détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Factures;
