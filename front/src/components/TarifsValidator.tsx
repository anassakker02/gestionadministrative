import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Euro } from 'lucide-react';
import { getTarifs } from '@/api/tarifsApi';
import { getClasses } from '@/api/classesApi';
import { getCurrentAcademicYear } from '@/utils/academicYear';
import { formatCurrency } from '@/utils/format';
import CreateTarifModal from './CreateTarifModal';

interface TarifValidation {
  classeId: string;
  classeNom: string;
  hasInscription: boolean;
  hasScolarite: boolean;
  fraisInscription: number;
  fraisScolarite: number;
  totalFrais: number;
  isValid: boolean;
  errors: string[];
}

const TarifsValidator: React.FC = () => {
  const currentAcademicYear = getCurrentAcademicYear();

  const { data: tarifsData } = useQuery({
    queryKey: ['tarifs-validator'],
    queryFn: getTarifs,
  });

  console.log('Tarifs data in validator:', tarifsData); // Debug

  const { data: classesData } = useQuery({
    queryKey: ['classes-validator'],
    queryFn: getClasses,
  });

  // Gérer différents formats de réponse pour les tarifs
  const tarifs = useMemo(() => {
    if (!tarifsData) return [];
    return Array.isArray(tarifsData) ? tarifsData : (tarifsData.data as any[]) || [];
  }, [tarifsData]);

  const tarifsValidation = useMemo(() => {
    if (tarifs.length === 0) {
      return [];
    }

    // Récupérer les frais globaux (pas de classe spécifique)
    const fraisGlobaux = tarifs.filter((tarif: any) => 
      tarif.annee_scolaire === currentAcademicYear.label &&
      tarif.isActive &&
      (tarif.type === 'Inscription' || tarif.type === 'Scolarité')
    );

    const fraisInscription = fraisGlobaux.find((t: any) => t.type === 'Inscription');
    const fraisScolarite = fraisGlobaux.find((t: any) => t.type === 'Scolarité');

    const hasInscription = !!fraisInscription;
    const hasScolarite = !!fraisScolarite;
    const isValid = hasInscription && hasScolarite;

    const errors: string[] = [];
    if (!hasInscription) errors.push('Frais d\'inscription manquant');
    if (!hasScolarite) errors.push('Frais de scolarité manquant');

    return [{
      classeId: 'global',
      classeNom: 'Frais Globaux (Tous les étudiants)',
      hasInscription,
      hasScolarite,
      fraisInscription: fraisInscription?.montant || 0,
      fraisScolarite: fraisScolarite?.montant || 0,
      totalFrais: (fraisInscription?.montant || 0) + (fraisScolarite?.montant || 0),
      isValid,
      errors,
    } as TarifValidation];
  }, [tarifs, currentAcademicYear]);

  const validCount = tarifsValidation.filter(v => v.isValid).length;
  const invalidCount = tarifsValidation.filter(v => !v.isValid).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Validation des Tarifs - Année {currentAcademicYear.label}</h2>
          <p className="text-muted-foreground">
            Tous les étudiants paient le même montant. Les boursiers bénéficient d'une réduction.
          </p>
        </div>
        <CreateTarifModal />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut des Frais</CardTitle>
            {validCount > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${validCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {validCount > 0 ? 'Complet' : 'Incomplet'}
            </div>
            <p className="text-xs text-muted-foreground">
              {validCount > 0 ? 'Tous les frais sont définis' : 'Frais manquants'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Frais</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tarifsValidation.length > 0 ? formatCurrency(tarifsValidation[0].totalFrais) : '0 MAD'}
            </div>
            <p className="text-xs text-muted-foreground">
              Montant par étudiant
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes pour les frais manquants */}
      {invalidCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Les frais globaux ne sont pas complets. Il manque : 
            {tarifsValidation[0]?.errors.map((error, index) => (
              <span key={index}><strong> {error}</strong></span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des tarifs existants */}
      <Card>
        <CardHeader>
          <CardTitle>Tarifs Existants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tarifs.length > 0 ? (
              <div className="space-y-2">
                {tarifs.map((tarif: any) => (
                  <div key={tarif.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{tarif.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          Type: {tarif.type} | Année: {tarif.annee_scolaire}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(tarif.montant)}</div>
                        <Badge variant={tarif.isActive ? 'default' : 'secondary'}>
                          {tarif.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Aucun tarif trouvé pour l'année {currentAcademicYear.label}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Détail des frais globaux */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Frais Globaux</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tarifsValidation.map((validation) => (
              <div
                key={validation.classeId}
                className={`p-4 border rounded-lg ${
                  validation.isValid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{validation.classeNom}</h3>
                  <Badge variant={validation.isValid ? 'default' : 'destructive'}>
                    {validation.isValid ? 'Valide' : 'Invalide'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Frais d'Inscription</div>
                    <div className="font-semibold">
                      {validation.hasInscription ? (
                        formatCurrency(validation.fraisInscription)
                      ) : (
                        <span className="text-red-500">Manquant</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Frais de Scolarité</div>
                    <div className="font-semibold">
                      {validation.hasScolarite ? (
                        formatCurrency(validation.fraisScolarite)
                      ) : (
                        <span className="text-red-500">Manquant</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Total Frais</div>
                    <div className="font-bold text-lg">
                      {validation.isValid ? (
                        formatCurrency(validation.totalFrais)
                      ) : (
                        <span className="text-red-500">Incomplet</span>
                      )}
                    </div>
                  </div>
                </div>

                {validation.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-red-600 font-medium">Erreurs :</div>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TarifsValidator;
