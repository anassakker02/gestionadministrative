import React, { createContext, useContext, useEffect, useState } from "react";
import { userService, LoginCredentials } from "@/services/userService";
import { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { refreshAccessToken } from "@/lib/api"; // Import refreshAccessToken

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
  canManageUsers: boolean;
  canCreateSubAdmin: boolean;
  isComptable: boolean;
  isEtudiant: boolean;
  isParent: boolean;
  isEnseignant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Vérifier si un utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = sessionStorage.getItem("user");
        let storedToken = sessionStorage.getItem("token");
        const storedRefreshToken = sessionStorage.getItem("refreshToken");

        let isAuthenticatedFromStorage = false;
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);

          // Vérifier si le compte est actif
          if (userData.isActive === false) {
            console.log("❌ Compte inactif détecté, déconnexion automatique");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            setUser(null);
            toast({
              title: "Compte inactif",
              description:
                "Votre compte a été désactivé. Veuillez contacter l'administrateur.",
              variant: "destructive",
            });
            return;
          }

          setUser(userData);
          isAuthenticatedFromStorage = true;
        }

        if (!isAuthenticatedFromStorage && storedRefreshToken) {
          // If no valid token, but a refresh token exists, try to refresh
          try {
            storedToken = await refreshAccessToken();
            // If refresh is successful, storedToken will be updated in sessionStorage
          } catch (refreshError) {
            console.error("Failed to refresh token on startup:", refreshError);
            // Clear any invalid tokens to ensure a clean state for login
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            // Optionally redirect to login, but the interceptor in api.ts might already handle this
          }
        }

        // Skip /me call if we already have user data - this makes navigation much faster
        if (!isAuthenticatedFromStorage && sessionStorage.getItem("token")) {
          // Only try /me if we don't have user data and have a token
          try {
            const me = await userService.me();
            if (me && me.user) {
              setUser(me.user);
              sessionStorage.setItem("user", JSON.stringify(me.user));
            } else {
              // If /me fails, clear tokens
              sessionStorage.removeItem("user");
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("refreshToken");
            }
          } catch (meError) {
            // If /me fails and we don't have stored user data, clear tokens
            if (!storedUser) {
              sessionStorage.removeItem("user");
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("refreshToken");
            }
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          error,
        );
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]); // Added toast to dependencies for completeness

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await userService.login(credentials);

      if (response.status && response.user) {
        const userData = response.user;

        // Debug: Afficher les informations de l'utilisateur
        console.log("User login data:", {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
        });

        // Gérer le cas où isActive est undefined (par défaut, considérer comme actif)
        // Mais seulement si le backend ne retourne pas ce champ
        if (userData.isActive === undefined) {
          console.log(
            "isActive is undefined, setting to true by default (backend compatibility)",
          );
          userData.isActive = true;
        }

        // Vérifier si le compte est explicitement désactivé (isActive: false)
        if (userData.isActive === false && userData.role !== "admin") {
          console.log(
            "Account explicitly deactivated for non-admin user:",
            userData.role,
          );
          toast({
            title: "Compte désactivé",
            description:
              "Votre compte a été désactivé. Veuillez contacter un administrateur.",
            variant: "destructive",
          });
          return false;
        }

        // Pour les admins, forcer isActive à true si ce n'est pas déjà le cas
        if (userData.role === "admin" && !userData.isActive) {
          console.log("Admin account marked as inactive, forcing activation");
          userData.isActive = true;
        }

        setUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));

        if (response.token) {
          sessionStorage.setItem("token", response.token);
        }
        if (response.refreshToken) {
          sessionStorage.setItem("refreshToken", response.refreshToken);
        }

        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${userData.prenom} ${userData.nom}`,
        });

        return true;
      } else {
        toast({
          title: "Erreur de connexion",
          description: response.message || "Identifiants invalides",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error("Erreur lors de la connexion:", error);

      // Gérer spécifiquement le cas d'un compte inactif
      if (error.response?.data?.code === "ACCOUNT_INACTIVE") {
        toast({
          title: "Compte désactivé",
          description:
            error.response.data.message ||
            "Votre compte a été désactivé. Veuillez contacter l'administrateur.",
          variant: "destructive",
        });
        return false;
      }

      // Gérer les autres erreurs de connexion
      toast({
        title: "Erreur de connexion",
        description:
          error.response?.data?.message ||
          "Impossible de se connecter au serveur",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken"); // Remove refresh token on logout
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user || !user.role) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isAuthenticated = !!user;
  const isAdmin = hasRole("admin");
  const isSubAdmin = hasRole("sous-admin");
  const canManageUsers = hasRole(["admin", "sous-admin"]);
  const canCreateSubAdmin = hasRole("admin"); // Seul l'admin principal peut créer des sous-admins
  const isComptable = hasRole("comptable");
  const isEtudiant = hasRole("etudiant");
  const isParent = hasRole("parent");
  const isEnseignant = hasRole("enseignant");

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
    isAdmin,
    isSubAdmin,
    canManageUsers,
    canCreateSubAdmin,
    isComptable,
    isEtudiant,
    isParent,
    isEnseignant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
