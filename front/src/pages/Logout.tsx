import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  useEffect(() => {
    // Utiliser la fonction logout du contexte pour une déconnexion complète
    logout();
    navigate("/login");
  }, [navigate, logout]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Déconnexion en cours...</p>
      </div>
    </div>
  );
};

export default Logout;
