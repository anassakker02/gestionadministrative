import { useQuery } from "@tanstack/react-query";
import { factureService } from "@/services/factureService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Factures = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>("");

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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4">Mes factures</h1>
      {isLoading && <div>Chargement des factures...</div>}
      {error && <div>Erreur lors du chargement des factures</div>}
      {factures.length === 0 && !isLoading && (
        <div className="text-muted-foreground">Aucune facture trouvée</div>
      )}
      <div className="grid gap-6">
        {factures.map((facture: any) => (
          <Card key={facture.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Facture #{facture.numero || facture.id}</CardTitle>
              <Badge variant={facture.status === "payee" ? "default" : "destructive"} className={facture.status === "payee" ? "bg-success text-success-foreground" : ""}>
                {facture.status === "payee" ? "Payée" : "Non payée"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">Montant : {facture.montant} MAD</div>
                  <div className="text-sm">Date : {facture.date || facture.createdAt}</div>
                </div>
                {/* Bouton pour payer si non payée (exemple) */}
                {facture.status !== "payee" && (
                  <Button size="sm" variant="outline">Payer</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Factures;
