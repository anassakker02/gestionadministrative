import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, User, GraduationCap, Percent, DollarSign } from 'lucide-react';
import { calculateStudentFees } from '@/api/tarifsApi';
import { toast } from "@/components/ui/use-toast";

interface StudentFeesData {
  etudiant: {
    id: string;
    nom: string;
    prenom: string;
    bourse_id: string | null;
  };
  annee_scolaire: string;
  calcul: {
    frais_inscription: number;
    frais_scolarite: number;
    frais_total: number;
    reduction_bourse: number;
    montant_final: number;
  };
  bourse: {
    nom: string;
    pourcentage_remise: number;
    description: string;
  } | null;
}

const StudentFeesCalculator: React.FC = () => {
  const [etudiantId, setEtudiantId] = useState('');
  const [anneeScolaire, setAnneeScolaire] = useState('2024-2025');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentFees', etudiantId, anneeScolaire],
    queryFn: () => calculateStudentFees(etudiantId, anneeScolaire),
    enabled: false, // Ne pas exécuter automatiquement
    select: (response) => response.data as StudentFeesData,
  });

  const handleCalculate = () => {
    if (!etudiantId.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer l'ID de l'étudiant",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculateur de Frais Étudiant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etudiantId">ID de l'Étudiant</Label>
              <Input
                id="etudiantId"
                value={etudiantId}
                onChange={(e) => setEtudiantId(e.target.value)}
                placeholder="Ex: std-omar-benali"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anneeScolaire">Année Scolaire</Label>
              <Input
                id="anneeScolaire"
                value={anneeScolaire}
                onChange={(e) => setAnneeScolaire(e.target.value)}
                placeholder="Ex: 2024-2025"
              />
            </div>
          </div>
          <Button onClick={handleCalculate} disabled={isLoading}>
            {isLoading ? "Calcul en cours..." : "Calculer les Frais"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Erreur: {error.message || "Impossible de calculer les frais"}
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Frais pour {data.etudiant.prenom} {data.etudiant.nom}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{data.annee_scolaire}</Badge>
              {data.bourse && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Boursier: {data.bourse.pourcentage_remise}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Détail des frais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Frais d'Inscription
                  </span>
                  <span className="font-medium">{formatCurrency(data.calcul.frais_inscription)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Frais de Scolarité
                  </span>
                  <span className="font-medium">{formatCurrency(data.calcul.frais_scolarite)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Calcul total */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Frais Total</span>
                <span className="font-semibold">{formatCurrency(data.calcul.frais_total)}</span>
              </div>

              {data.bourse && (
                <>
                  <div className="flex items-center justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Réduction Bourse ({data.bourse.nom})
                    </span>
                    <span className="font-medium">-{formatCurrency(data.calcul.reduction_bourse)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.bourse.description}
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between text-xl font-bold">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Montant Final à Payer
                </span>
                <span className="text-primary">{formatCurrency(data.calcul.montant_final)}</span>
              </div>
            </div>

            {/* Résumé */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Résumé</h4>
              <p className="text-sm text-muted-foreground">
                {data.bourse 
                  ? `L'étudiant bénéficie d'une bourse "${data.bourse.nom}" de ${data.bourse.pourcentage_remise}%, réduisant ses frais de ${formatCurrency(data.calcul.reduction_bourse)}.`
                  : "L'étudiant n'a pas de bourse et doit payer le montant total."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentFeesCalculator;
