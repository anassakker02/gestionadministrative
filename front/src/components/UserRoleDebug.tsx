import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

const UserRoleDebug = () => {
  const { user, isAdmin, isSubAdmin, canManageUsers } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer tous les utilisateurs
      const allUsersResponse = await userService.getAllUsers();
      console.log("All users response:", allUsersResponse);
      setAllUsers(allUsersResponse.data || []);

      // Récupérer les utilisateurs en attente
      const pendingResponse = await userService.getPendingUsers();
      console.log("Pending users response:", pendingResponse);
      setPendingUsers(pendingResponse.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      fetchData();
    }
  }, [canManageUsers]);

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">
            Vous n'avez pas l'autorisation de voir cette page de debug.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug - Informations Utilisateur Connecté</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Nom:</strong> {user?.prenom} {user?.nom}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Rôle:</strong> <Badge>{user?.role || "Non défini"}</Badge>
            </p>
            <p>
              <strong>Est Admin:</strong> {isAdmin ? "✅ Oui" : "❌ Non"}
            </p>
            <p>
              <strong>Est Sous-Admin:</strong>{" "}
              {isSubAdmin ? "✅ Oui" : "❌ Non"}
            </p>
            <p>
              <strong>Peut gérer utilisateurs:</strong>{" "}
              {canManageUsers ? "✅ Oui" : "❌ Non"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🗄️ Debug - Données API
            <Button onClick={fetchData} disabled={loading}>
              {loading ? "Chargement..." : "Rafraîchir"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Erreur:</strong> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tous les utilisateurs */}
            <div>
              <h3 className="font-semibold mb-3">
                👥 Tous les utilisateurs ({allUsers.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allUsers.map((user, index) => (
                  <div key={user.id || index} className="p-2 border rounded">
                    <p className="font-medium">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={user.role ? "default" : "secondary"}>
                        {user.role || "Sans rôle"}
                      </Badge>
                      {user.createdAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(
                            user.createdAt.seconds
                              ? user.createdAt.seconds * 1000
                              : user.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Utilisateurs en attente */}
            <div>
              <h3 className="font-semibold mb-3">
                ⏳ Utilisateurs en attente ({pendingUsers.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="p-2 border rounded bg-yellow-50"
                  >
                    <p className="font-medium">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {user.role || "Sans rôle"}
                      </Badge>
                      <Badge variant="secondary">
                        {user.status || "Statut non défini"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold mb-2">📊 Statistiques</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Total utilisateurs:</strong>
                <br />
                {allUsers.length}
              </div>
              <div>
                <strong>En attente:</strong>
                <br />
                {pendingUsers.length}
              </div>
              <div>
                <strong>Avec rôles:</strong>
                <br />
                {allUsers.filter((u) => u.role).length}
              </div>
              <div>
                <strong>Admins:</strong>
                <br />
                {
                  allUsers.filter(
                    (u) => u.role === "admin" || u.role === "sous-admin"
                  ).length
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleDebug;
