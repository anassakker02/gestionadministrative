import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (user?.role === "etudiant" || user?.role === "parent") {
      navigate("/portal");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="flex justify-center">
          <ShieldX className="h-20 w-20 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          Contactez un administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <Button onClick={handleBack} className="bg-gradient-hero">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
