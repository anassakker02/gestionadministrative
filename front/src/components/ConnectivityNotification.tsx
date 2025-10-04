import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';

interface ConnectivityNotificationProps {
  showWhenConnected?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
}

const ConnectivityNotification: React.FC<ConnectivityNotificationProps> = ({
  showWhenConnected = false,
  position = 'top',
  className = ''
}) => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    retryConnection, 
    canRetry,
    lastCheck 
  } = useConnectivity({
    autoCheck: true,
    checkInterval: 30000,
    onConnectionLost: () => {
      console.log('🔌 Connexion perdue avec l\'émulateur');
    },
    onConnectionRestored: () => {
      console.log('✅ Connexion restaurée avec l\'émulateur');
    }
  });

  // Ne pas afficher si connecté et showWhenConnected est false
  if (isConnected && !showWhenConnected) {
    return null;
  }

  // Ne pas afficher si en cours de chargement initial
  if (isLoading && !lastCheck) {
    return null;
  }

  const getAlertVariant = () => {
    if (isConnected) return 'default';
    if (isLoading) return 'secondary';
    return 'destructive';
  };

  const getIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isConnected) return <CheckCircle className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (isLoading) return 'Vérification de la connexion...';
    if (isConnected) return 'Connexion avec l\'émulateur établie';
    return `Connexion perdue: ${error || 'Erreur inconnue'}`;
  };

  const positionClasses = position === 'top' 
    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50' 
    : 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';

  return (
    <div className={`${positionClasses} ${className}`}>
      <Alert 
        variant={getAlertVariant()} 
        className="w-full max-w-md shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <AlertDescription className="text-sm">
              {getMessage()}
            </AlertDescription>
          </div>
          
          {!isConnected && canRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={retryConnection}
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        {lastCheck && (
          <div className="text-xs text-muted-foreground mt-1">
            Dernière vérification: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </Alert>
    </div>
  );
};

export default ConnectivityNotification;
