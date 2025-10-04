import { LoginForm } from "@/components/LoginForm"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"

export default function Login() {
  const { user, loading } = useAuth();

  // Si l'utilisateur est déjà connecté, rediriger selon son rôle
  if (!loading && user) {
    switch (user.role) {
      case 'admin':
      case 'sous-admin':
      case 'comptable':
        return <Navigate to="/dashboard" replace />;
      case 'etudiant':
      case 'parent':
        return <Navigate to="/portal" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <LoginForm />
      </motion.div>
    </div>
  )
}