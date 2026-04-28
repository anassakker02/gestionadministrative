import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

const NotificationTest: React.FC = () => {
  const { data: pendingUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/users/pending', 'GET');
        return response.data || [];
      } catch (error) {
        console.error('Erreur:', error);
        return [];
      }
    },
  });

  const createTestUser = async () => {
    try {
      const timestamp = Date.now();
      const testUserData = {
        prenom: "Test",
        nom: "User",
        email: `test.user.${timestamp}@example.com`,
        password: "password123",
        role: "user",
        isActive: false
      };

      await apiRequest('/auth/register', 'POST', testUserData);
      refetch(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur création utilisateur test:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Test des Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Utilisateurs en attente de validation
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={pendingUsers.length > 0 ? "destructive" : "secondary"}>
                {isLoading ? "..." : pendingUsers.length}
              </Badge>
              {pendingUsers.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  notification(s) dans la navbar
                </span>
              )}
            </div>
          </div>
          <Button onClick={createTestUser} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un utilisateur test
          </Button>
        </div>

        {pendingUsers.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Utilisateurs en attente :</h4>
            {pendingUsers.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{user.prenom} {user.nom}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                      <XCircle className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          💡 Les notifications apparaissent automatiquement dans la navbar pour les administrateurs et comptables.
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTest;
