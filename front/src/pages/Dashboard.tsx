import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  Users,
  GraduationCap,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

const stats = [
  {
    title: "Total Étudiants",
    value: "1,247",
    change: "+12%",
    icon: GraduationCap,
    color: "text-primary"
  },
  {
    title: "Paiements en attente",
    value: "€45,320",
    change: "-8%",
    icon: Clock,
    color: "text-warning"
  },
  {
    title: "Revenus ce mois",
    value: "€128,450",
    change: "+23%",
    icon: TrendingUp,
    color: "text-success"
  },
  {
    title: "Factures impayées",
    value: "67",
    change: "-5%",
    icon: AlertCircle,
    color: "text-destructive"
  }
]

const recentActivities = [
  { type: "payment", message: "Paiement reçu de Marie Dubois", time: "Il y a 2h" },
  { type: "student", message: "Nouvel étudiant inscrit: Jean Martin", time: "Il y a 4h" },
  { type: "reminder", message: "Relance envoyée à 15 étudiants", time: "Il y a 6h" },
  { type: "invoice", message: "Facture générée pour la classe 2A", time: "Il y a 8h" }
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre système de gestion scolaire
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.change.startsWith('+') ? 'text-success' : 'text-destructive'}>
                    {stat.change}
                  </span>
                  {" "}par rapport au mois dernier
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Accès rapide aux tâches fréquentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start bg-gradient-primary hover:opacity-90">
                <GraduationCap className="mr-2 h-4 w-4" />
                Ajouter un étudiant
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Enregistrer un paiement
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Générer une facture
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Envoyer des relances
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Dernières actions sur le système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + 0.1 * index }}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {activity.type === 'payment' && <CheckCircle className="h-4 w-4 text-success" />}
                    {activity.type === 'student' && <GraduationCap className="h-4 w-4 text-primary" />}
                    {activity.type === 'reminder' && <AlertCircle className="h-4 w-4 text-warning" />}
                    {activity.type === 'invoice' && <CreditCard className="h-4 w-4 text-info" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}