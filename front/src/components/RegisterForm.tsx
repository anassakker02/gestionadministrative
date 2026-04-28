import { useState } from "react";
import { motion } from "framer-motion";

// ─── Validation mot de passe fort ────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

function getPasswordStrength(pwd: string): { label: string; color: string; score: number } {
  if (!pwd) return { label: "", color: "", score: 0 };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;
  if (score <= 2) return { label: "Faible", color: "bg-red-500", score };
  if (score === 3) return { label: "Moyen", color: "bg-yellow-500", score };
  return { label: "Fort", color: "bg-green-500", score };
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Mail, Lock, Building } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/use-toast";

export function RegisterForm() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // role n'est plus envoyé
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation mot de passe fort
    if (!PASSWORD_REGEX.test(formData.password)) {
      toast({
        title: "Mot de passe trop faible",
        description: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (!@#$%...).",
        variant: "destructive",
      });
      return;
    }

    // Vérification confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Rôle forcé à "user" côté client — le backend confirme isActive: false
      await apiRequest("/auth/register", "POST", {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: formData.email,
        password: formData.password,
        role: "user", // Rôle minimal — jamais 'admin'
        isActive: false,
      });
      
      // Afficher un message de confirmation avec toast
      toast({
        title: "Inscription réussie",
        description: "Votre inscription a été soumise avec succès. Votre compte sera activé par un administrateur.",
      });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Erreur d'inscription",
        description: err?.message || t("register.error_creating_account"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20 shadow-elegant">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {t("register.title")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {t("register.description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-foreground"
                >
                  {t("register.first_name")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t("register.placeholder_first_name")}
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="pl-10 bg-background/50 border-primary/20 focus:border-primary transition-smooth"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-foreground"
                >
                  {t("register.last_name")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder={t("register.placeholder_last_name")}
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="pl-10 bg-background/50 border-primary/20 focus:border-primary transition-smooth"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                {t("register.email_address")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("register.placeholder_email")}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20 focus:border-primary transition-smooth"
                  required
                />
              </div>
            </div>

            {/* Le rôle est forcé à 'student' et le champ n'est plus affiché */}

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                {t("register.password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.placeholder_password")}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary transition-smooth"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-smooth"
                  aria-label={t(showPassword ? "register.hide_password" : "register.show_password")}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {formData.password && (() => {
              const strength = getPasswordStrength(formData.password);
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Force du mot de passe</span>
                    <span className={strength.score >= 4 ? "text-green-600" : strength.score === 3 ? "text-yellow-600" : "text-red-600"}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requis : 8+ caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                  </p>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                {t("register.confirm_password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t("register.placeholder_confirm_password")}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pl-10 pr-10 bg-background/50 border-primary/20 focus:border-primary transition-smooth"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-smooth"
                  aria-label={t(showConfirmPassword ? "register.hide_confirm_password" : "register.show_confirm_password")}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-md transition-smooth shadow-lg hover:shadow-primary/25"
              disabled={loading}
            >
              {loading ? t("register.creating_account") : t("register.create_account")}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("register.already_have_account")}{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-smooth"
                >
                  {t("register.sign_in_here")}
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
