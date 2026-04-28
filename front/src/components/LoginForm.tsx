import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logAuthSuccess, logAuthFailure, logAuthLockout } from "@/services/logService";

// ─── Sécurité : blocage après 5 tentatives ────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
  const remainingSeconds = isLocked
    ? Math.ceil((lockedUntil! - Date.now()) / 1000)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification du verrouillage
    if (isLocked) {
      toast({
        title: "Compte temporairement bloqué",
        description: `Trop de tentatives. Réessayez dans ${remainingSeconds} secondes.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await login({ email, password });

      if (success) {
        logAuthSuccess(email);
        setAttempts(0);
        setLockedUntil(null);

        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === "etudiant" || userData.role === "parent") {
            navigate("/portal");
          } else {
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      } else {
        // Incrémenter le compteur de tentatives
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MS);
          logAuthLockout(email);
          // Message générique — anti-énumération
          toast({
            title: "Compte temporairement bloqué",
            description: `${MAX_ATTEMPTS} tentatives échouées. Réessayez dans 5 minutes.`,
            variant: "destructive",
          });
        } else {
          logAuthFailure(email);
          // Message toujours identique — anti-énumération (ne révèle pas si email existe)
          toast({
            title: "Identifiants invalides",
            description: "Email ou mot de passe incorrect.",
            variant: "destructive",
          });
        }
      }
    } catch {
      // Message générique même en cas d'erreur réseau
      toast({
        title: "Identifiants invalides",
        description: "Email ou mot de passe incorrect.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="shadow-lg border-0 bg-card">
        <CardHeader className="text-center space-y-4 pb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="bg-gradient-hero p-6 -mx-6 -mt-6 mb-6 rounded-t-lg">
              <h1 className="text-2xl font-bold text-primary-foreground mb-2">
                YNOV CAMPUS
              </h1>
              <CardTitle className="text-3xl font-bold text-primary-foreground">
                Connexion
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Gestion de frais de scolarité
              </CardDescription>
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLocked && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive text-center">
              Compte bloqué — réessayez dans {remainingSeconds} secondes
            </div>
          )}

          {attempts > 0 && !isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-center">
              {MAX_ATTEMPTS - attempts} tentative(s) restante(s) avant blocage
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@domaine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg border-2 focus:border-primary"
                required
                disabled={isLocked}
                autoComplete="email"
              />
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg border-2 focus:border-primary pr-12"
                  required
                  disabled={isLocked}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow"
                disabled={loading || isLocked}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="text-center space-y-4"
          >
            <Button
              variant="link"
              className="text-primary hover:text-primary-hover font-medium"
            >
              Mot de passe oublié ?
            </Button>

            <div className="text-sm text-muted-foreground">
              Vous n'avez pas de compte ?{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary-hover font-medium"
              >
                Inscrivez-vous
              </Link>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
