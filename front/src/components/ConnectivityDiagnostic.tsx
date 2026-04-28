import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Server,
  Database,
  Clock,
  MemoryStick
} from 'lucide-react';
import { testConnectivity, testDiagnostic } from '@/lib/api';

interface ConnectivityStatus {
  isConnected: boolean;
  isLoading: boolean;
  lastCheck: Date | null;
  error: string | null;
  diagnostic: any | null;
}

const ConnectivityDiagnostic: React.FC = () => {
  const [status, setStatus] = useState<ConnectivityStatus>({
    isConnected: false,
    isLoading: true,
    lastCheck: null,
    error: null,
    diagnostic: null
  });

  const checkConnectivity = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Test de connectivité simple
      const healthResult = await testConnectivity();
      
      if (healthResult.success) {
        // Test de diagnostic complet
        const diagnosticResult = await testDiagnostic();
        
        setStatus({
          isConnected: true,
          isLoading: false,
          lastCheck: new Date(),
          error: null,
          diagnostic: diagnosticResult.success ? diagnosticResult.data : null
        });
      } else {
        setStatus({
          isConnected: false,
          isLoading: false,
          lastCheck: new Date(),
          error: healthResult.error || 'Connexion échouée',
          diagnostic: null
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        isLoading: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        diagnostic: null
      });
    }
  };

  // Vérification automatique au chargement
  useEffect(() => {
    checkConnectivity();
    
    // Vérification périodique toutes les 30 secondes
    const interval = setInterval(checkConnectivity, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (status.isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (status.isConnected) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (status.isLoading) return <Badge variant="secondary">Vérification...</Badge>;
    if (status.isConnected) return <Badge variant="default" className="bg-green-500">Connecté</Badge>;
    return <Badge variant="destructive">Déconnecté</Badge>;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Diagnostic de Connectivité
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="font-medium">État de la connexion</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Dernière vérification */}
        {status.lastCheck && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            Dernière vérification: {status.lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Erreur */}
        {status.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreur de connexion:</strong> {status.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic détaillé */}
        {status.diagnostic && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Diagnostic du serveur
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-mono">
                    {formatUptime(status.diagnostic.system.uptime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mémoire:</span>
                  <span className="font-mono">
                    {status.diagnostic.system.memory.heapUsed}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Firestore:</span>
                  <Badge 
                    variant={status.diagnostic.firestore.healthy ? "default" : "destructive"}
                    className={status.diagnostic.firestore.healthy ? "bg-green-500" : ""}
                  >
                    {status.diagnostic.firestore.connection}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Node.js:</span>
                  <span className="font-mono text-xs">
                    {status.diagnostic.system.nodeVersion}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton de rafraîchissement */}
        <div className="flex justify-end">
          <Button 
            onClick={checkConnectivity} 
            disabled={status.isLoading}
            variant="outline"
            size="sm"
          >
            {status.isLoading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Vérifier
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectivityDiagnostic;
