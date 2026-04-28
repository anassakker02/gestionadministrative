import React, { useState, useEffect } from 'react';
import { Bell, User, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/userService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

interface PendingUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  createdAt: string;
  type: 'new_user';
}

export function NotificationDropdown() {
  const [notificationCount, setNotificationCount] = useState(0);
  const queryClient = useQueryClient();

  // Vérifier si l'utilisateur est authentifié
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // Récupérer les utilisateurs en attente de validation
  const { data: pendingUsers = [], refetch, isLoading, error } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      if (!isAuthenticated) {
        console.warn('Utilisateur non authentifié - impossible de récupérer les notifications');
        return [];
      }

      try {
        console.log('🔍 Récupération des notifications avec token:', token ? 'Token présent' : 'Aucun token');
        const response = await userService.getPendingUsers();
        console.log('✅ Notifications récupérées:', response.data);
        return response.data || [];
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs en attente:', error);
        
        // Gérer spécifiquement l'erreur 404
        if (error.response?.status === 404) {
          console.warn('Endpoint /users/pending non trouvé - fonctionnalité non disponible');
          return [];
        }
        
        // Gérer l'erreur 403 (permissions insuffisantes)
        if (error.response?.status === 403) {
          console.warn('Permissions insuffisantes pour voir les utilisateurs en attente');
          return [];
        }

        // Gérer l'erreur 401 (non authentifié)
        if (error.response?.status === 401) {
          console.warn('Non authentifié - redirection vers la page de connexion');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return [];
        }
        
        return [];
      }
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    retry: 1, // Réessayer seulement 1 fois en cas d'erreur
    retryOnMount: false, // Ne pas réessayer au montage si l'erreur persiste
    enabled: isAuthenticated, // Ne pas exécuter si non authentifié
  });

  // Mettre à jour le compteur de notifications
  useEffect(() => {
    setNotificationCount(pendingUsers.length);
  }, [pendingUsers]);

  // Mutation pour approuver un utilisateur
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/users/${userId}/approve`, 'PUT', {
        role: 'etudiant',
        isActive: true,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Utilisateur approuvé",
        description: "Le compte a été activé et un email de confirmation a été envoyé.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'approbation",
        variant: "destructive",
      });
    },
  });

  // Mutation pour rejeter un utilisateur
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/users/${userId}/reject`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      toast({
        title: "Succès",
        description: "Utilisateur rejeté",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du rejet",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (userId: string) => {
    approveUserMutation.mutate(userId);
  };

  const handleReject = (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir rejeter cette inscription ?")) {
      rejectUserMutation.mutate(userId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent transition-colors"
          title={`${notificationCount} nouveau(x) utilisateur(s)`}
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold animate-pulse"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          Nouveaux utilisateurs ({notificationCount})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <DropdownMenuItem disabled>
            <div className="text-center text-muted-foreground py-4">
              Chargement des notifications...
            </div>
          </DropdownMenuItem>
        ) : error ? (
          <DropdownMenuItem disabled>
            <div className="text-center text-red-500 py-4">
              Erreur lors du chargement
            </div>
          </DropdownMenuItem>
        ) : pendingUsers.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="text-center text-muted-foreground py-4">
              Aucun nouvel utilisateur
            </div>
          </DropdownMenuItem>
        ) : (
          pendingUsers.map((user: PendingUser) => (
            <div key={user.id} className="p-3 border-b last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    Rôle: {user.role}
                  </p>
                  <p className="text-xs text-gray-400">
                    Créé le {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleApprove(user.id)}
                  disabled={approveUserMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                  onClick={() => handleReject(user.id)}
                  disabled={rejectUserMutation.isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Rejeter
                </Button>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
