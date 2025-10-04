import { useState, useEffect, useCallback } from 'react';
import { testConnectivity, testDiagnostic } from '@/lib/api';

interface ConnectivityState {
  isConnected: boolean;
  isLoading: boolean;
  lastCheck: Date | null;
  error: string | null;
  diagnostic: any | null;
  retryCount: number;
}

interface UseConnectivityOptions {
  autoCheck?: boolean;
  checkInterval?: number; // en millisecondes
  maxRetries?: number;
  onConnectionLost?: () => void;
  onConnectionRestored?: () => void;
}

export const useConnectivity = (options: UseConnectivityOptions = {}) => {
  const {
    autoCheck = true,
    checkInterval = 30000, // 30 secondes
    maxRetries = 3,
    onConnectionLost,
    onConnectionRestored
  } = options;

  const [state, setState] = useState<ConnectivityState>({
    isConnected: false,
    isLoading: true,
    lastCheck: null,
    error: null,
    diagnostic: null,
    retryCount: 0
  });

  const checkConnectivity = useCallback(async (isRetry: boolean = false) => {
    if (isRetry) {
      setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
    } else {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      // Test de connectivité simple
      const healthResult = await testConnectivity();
      
      if (healthResult.success) {
        // Test de diagnostic complet seulement si connecté
        const diagnosticResult = await testDiagnostic();
        
        const wasConnected = state.isConnected;
        
        setState({
          isConnected: true,
          isLoading: false,
          lastCheck: new Date(),
          error: null,
          diagnostic: diagnosticResult.success ? diagnosticResult.data : null,
          retryCount: 0
        });

        // Appeler le callback si la connexion a été restaurée
        if (!wasConnected && onConnectionRestored) {
          onConnectionRestored();
        }
      } else {
        const wasConnected = state.isConnected;
        
        setState(prev => ({
          isConnected: false,
          isLoading: false,
          lastCheck: new Date(),
          error: healthResult.error || 'Connexion échouée',
          diagnostic: null,
          retryCount: prev.retryCount
        }));

        // Appeler le callback si la connexion a été perdue
        if (wasConnected && onConnectionLost) {
          onConnectionLost();
        }
      }
    } catch (error) {
      const wasConnected = state.isConnected;
      
      setState(prev => ({
        isConnected: false,
        isLoading: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        diagnostic: null,
        retryCount: prev.retryCount
      }));

      // Appeler le callback si la connexion a été perdue
      if (wasConnected && onConnectionLost) {
        onConnectionLost();
      }
    }
  }, [state.isConnected, onConnectionLost, onConnectionRestored]);

  const retryConnection = useCallback(async () => {
    if (state.retryCount < maxRetries) {
      await checkConnectivity(true);
    }
  }, [state.retryCount, maxRetries, checkConnectivity]);

  const forceCheck = useCallback(async () => {
    await checkConnectivity(false);
  }, [checkConnectivity]);

  // Vérification automatique
  useEffect(() => {
    if (autoCheck) {
      // Vérification initiale
      checkConnectivity();
      
      // Vérification périodique
      const interval = setInterval(() => {
        checkConnectivity();
      }, checkInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, checkConnectivity]);

  // Retry automatique en cas d'échec
  useEffect(() => {
    if (!state.isConnected && !state.isLoading && state.retryCount < maxRetries) {
      const retryTimeout = setTimeout(() => {
        retryConnection();
      }, 5000); // Retry après 5 secondes
      
      return () => clearTimeout(retryTimeout);
    }
  }, [state.isConnected, state.isLoading, state.retryCount, maxRetries, retryConnection]);

  return {
    ...state,
    checkConnectivity: forceCheck,
    retryConnection,
    canRetry: state.retryCount < maxRetries,
    isHealthy: state.isConnected && state.diagnostic?.firestore?.healthy
  };
};
