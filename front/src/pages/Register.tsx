import { RegisterForm } from "@/components/RegisterForm"
import { motion } from "framer-motion"

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <RegisterForm />
      </motion.div>
    </div>
  )
}