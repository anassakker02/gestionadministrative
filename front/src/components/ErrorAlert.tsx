import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 2,
}) => {
  const canRetry = retryCount < maxRetries && onRetry;
  const isEncryptionError = error.includes("encryption") || 
                          error.includes("Invalid key length") ||
                          error.includes("validation des données");

  return (
    <Alert className="mb-4" variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="block">{error}</span>
          {isEncryptionError && (
            <span className="text-xs text-muted-foreground mt-1 block">
              Problème technique détecté. Le système tente de se récupérer automatiquement.
            </span>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          {canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Tentative...' : 'Réessayer'}
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-xs"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
