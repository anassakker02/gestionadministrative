import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { testConnectivity, testDiagnostic } from "@/lib/api";
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface DiagnosticResult {
  success: boolean;
  status?: number;
  data?: any;
  endpoint?: string;
  error?: string;
  code?: string;
  suggestions?: string[];
}

export const ConnectionDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [connectivityResult, setConnectivityResult] = useState<DiagnosticResult | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setLastChecked(new Date());
    
    try {
      // Test de connectivité de base
      const connectivity = await testConnectivity();
      setConnectivityResult(connectivity);
      
      // Test de diagnostic complet si la connectivité fonctionne
      if (connectivity.success) {
        const diagnostic = await testDiagnostic();
        setDiagnosticResult(diagnostic);
      } else {
        setDiagnosticResult(null);
      }
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Test automatique au chargement
    runDiagnostic();
  }, []);

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Connecté" : "Déconnecté"}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Diagnostic de Connexion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connectivité */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectivityResult ? getStatusIcon(connectivityResult.success) : <AlertCircle className="h-4 w-4 text-yellow-500" />}
            <span className="font-medium">Connectivité Émulateur</span>
          </div>
          {connectivityResult && getStatusBadge(connectivityResult.success)}
        </div>

        {/* Détails de connectivité */}
        {connectivityResult && (
          <div className="bg-muted p-3 rounded-lg">
            {connectivityResult.success ? (
              <div className="space-y-1">
                <p className="text-sm text-green-600">
                  ✅ Émulateur accessible sur {connectivityResult.endpoint}
                </p>
                <p className="text-xs text-muted-foreground">
                  Statut: {connectivityResult.status}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-600">
                  ❌ Émulateur non accessible
                </p>
                <p className="text-xs text-muted-foreground">
                  Erreur: {connectivityResult.error}
                </p>
                {connectivityResult.suggestions && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Solutions suggérées:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {connectivityResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statut de diagnostic */}
        {diagnosticResult && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnosticResult.success)}
              <span className="font-medium">Diagnostic Complet</span>
            </div>
            {getStatusBadge(diagnosticResult.success)}
          </div>
        )}

        {/* Informations de diagnostic */}
        {diagnosticResult && (
          <div className="bg-muted p-3 rounded-lg">
            {diagnosticResult.success ? (
              <div className="space-y-1">
                <p className="text-sm text-green-600">
                  ✅ Diagnostic complet réussi
                </p>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {JSON.stringify(diagnosticResult.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-red-600">
                  ❌ Diagnostic échoué
                </p>
                <p className="text-xs text-muted-foreground">
                  Erreur: {diagnosticResult.error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Informations de dernière vérification */}
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Dernière vérification: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        {/* Bouton de test */}
        <div className="flex justify-end">
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Test en cours...' : 'Tester la connexion'}
          </Button>
        </div>

        {/* Instructions de démarrage */}
        {connectivityResult && !connectivityResult.success && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Émulateur Firebase non accessible</p>
              <p className="text-sm mb-2">Pour démarrer l'émulateur:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Ouvrez un terminal dans le dossier <code>back/functions</code></li>
                <li>Exécutez: <code>firebase emulators:start</code></li>
                <li>Attendez que l'émulateur soit prêt</li>
                <li>Rechargez cette page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
