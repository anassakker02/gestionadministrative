import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalStudents: string;
  pendingPayments: string;
  monthlyRevenue: string;
  unpaidInvoices: string;
}

interface Activity {
  type: "payment" | "student" | "reminder" | "invoice";
  message: string;
  time: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: Activity[];
}

// const stats = [
//   {
//     title: "Total Étudiants",
//     value: "1,247",
//     change: "+12%",
//     icon: GraduationCap,
//     color: "text-primary"
//   },
//   {
//     title: "Paiements en attente",
//     value: "€45,320",
//     change: "-8%",
//     icon: Clock,
//     color: "text-warning"
//   },
//   {
//     title: "Revenus ce mois",
//     value: "€128,450",
//     change: "+23%",
//     icon: TrendingUp,
//     color: "text-success"
//   },
//   {
//     title: "Factures impayées",
//     value: "67",
//     change: "-5%",
//     icon: AlertCircle,
//     color: "text-destructive"
//   }
// ]

// const recentActivities = [
//   { type: "payment", message: "Paiement reçu de Marie Dubois", time: "Il y a 2h" },
//   { type: "student", message: "Nouvel étudiant inscrit: Jean Martin", time: "Il y a 4h" },
//   { type: "reminder", message: "Relance envoyée à 15 étudiants", time: "Il y a 6h" },
//   { type: "invoice", message: "Facture générée pour la classe 2A", time: "Il y a 8h" }
// ]

export default function Dashboard() {
  // Récupérer l'utilisateur connecté
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserId(user.id || "");
  }, []);

  // Récupérer les factures impayées
  const { data: facturesData } = useQuery({
    queryKey: ["factures", userId],
    queryFn: () => fetcher(`/factures?etudiant_id=${userId}&status=non-payee`),
    enabled: !!userId,
  });
  const totalUnpaid = facturesData?.data?.length || 0;

  // Récupérer les paiements en attente
  const { data: paiementsData } = useQuery({
    queryKey: ["paiements", userId],
    queryFn: () => fetcher(`/paiements?etudiant_id=${userId}&status=attente`),
    enabled: !!userId,
  });
  const totalPendingPayments = paiementsData?.data?.length || 0;

  // Récupérer les activités récentes
  const { data: activitiesData } = useQuery({
    queryKey: ["activities", userId],
    queryFn: () => fetcher(`/activites?etudiant_id=${userId}`),
    enabled: !!userId,
  });
  const recentActivities = activitiesData?.data || [];

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: () => fetcher("/dashboard"),
  });

  if (isLoading) return <div>Chargement du tableau de bord...</div>;
  if (error) return <div>Erreur lors du chargement: {error.message}</div>;

  const statsData = [
    {
      title: "Factures impayées",
      value: totalUnpaid,
      change: "",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "Paiements en attente",
      value: totalPendingPayments,
      change: "",
      icon: Clock,
      color: "text-warning",
    },
    {
      title: "Total Étudiants",
      value: data?.stats?.totalStudents ?? "0",
      change: "+0%", // Placeholder, assuming backend doesn't provide this yet
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      title: "Revenus ce mois",
      value: data?.stats?.monthlyRevenue ?? "€0",
      change: "+0%", // Placeholder
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground">
          Vue d'overview de votre système de gestion scolaire
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statsData.map((stat, index) => (
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
              {totalUnpaid > 0 && (
                <Button
                  className="w-full justify-start bg-gradient-primary hover:opacity-90"
                  onClick={() => (window.location.href = "/factures")}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Payer mes factures ({totalUnpaid})
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/profile")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Modifier mon profil
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
              {recentActivities.map((activity: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + 0.1 * index }}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {/* Icônes selon le type d'activité */}
                    {activity.type === "payment" && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    {activity.type === "invoice" && (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
