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
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // Import useTranslation
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "@/components/AdminDashboard";

interface DashboardStats {
  totalStudents: string;
  pendingPayments: string;
  monthlyRevenue: string;
  unpaidInvoices: string;
  totalPayments: string;
  totalInvoices: string;
}

interface Activity {
  type: string; // Adjusted to string to accommodate more types
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
  const { t } = useTranslation(); // Initialize useTranslation
  const { user, canManageUsers, isEtudiant, isParent, isComptable } = useAuth(); // Get role-based permissions
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (isEtudiant || isParent) {
      setShouldRedirect(true);
    }
  }, [isEtudiant, isParent]);

  // Récupérer l'utilisateur connecté
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    setUserId(user.id || "");
  }, []);

  // Récupérer les factures impayées
  const { data: facturesData } = useQuery({
    queryKey: ["factures", userId],
    queryFn: () => fetcher(`/factures?etudiant_id=${userId}&status=non-payee`),
    enabled: !!userId && (isEtudiant || isParent),
  });
  const totalUnpaid = facturesData?.data?.length || 0;

  // Récupérer les paiements en attente
  const { data: paiementsData } = useQuery({
    queryKey: ["paiements", userId],
    queryFn: () => fetcher(`/paiements?etudiant_id=${userId}&status=attente`),
    enabled: !!userId && (isEtudiant || isParent),
  });
  const totalPendingPayments = paiementsData?.data?.length || 0;

  // Récupérer les activités récentes
  const { data: activitiesData } = useQuery({
    queryKey: ["activities", userId],
    queryFn: () => fetcher(`/activites?etudiant_id=${userId}`),
    enabled: !!userId && (isEtudiant || isParent),
  });
  const recentActivities = activitiesData?.data || [];

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["dashboardData"],
    queryFn: () => fetcher("/dashboard"),
    enabled: canManageUsers || isComptable, // Fix: Also for comptable
  });

  if (shouldRedirect) {
    return <Navigate to="/portal" replace />;
  }

  // Si l'utilisateur peut gérer les utilisateurs, afficher le dashboard admin
  if (canManageUsers) {
    return <AdminDashboard />;
  }

  const handleExportCsv = async () => {
    try {
      const response = await axios.get("/dashboard/export/students/csv", {
        responseType: "blob", // Important for downloading files
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error("Erreur lors de l'exportation CSV:", exportError);
      // Handle error, e.g., show a toast notification
    }
  };

  if (isLoading) return <div>Chargement du tableau de bord...</div>;
  if (error) return <div>Erreur lors du chargement: {error.message}</div>;

  const statsData = [
    {
      title: "dashboard.total_students",
      value: data?.stats?.totalStudents ?? "0",
      icon: GraduationCap,
      color: "text-primary",
    },
    {
      title: "dashboard.total_payments",
      value: data?.stats?.totalPayments ?? "€0",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "dashboard.monthly_revenue",
      value: data?.stats?.monthlyRevenue ?? "€0",
      icon: TrendingUp,
      color: "text-success",
    },
    {
      title: "dashboard.unpaid_invoices",
      value: data?.stats?.unpaidInvoices ?? "0",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: "dashboard.pending_payments",
      value: data?.stats?.pendingPayments ?? "€0",
      icon: Clock,
      color: "text-warning",
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
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.overview")}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6"
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
                  {t(stat.title)}
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
              <CardTitle>{t("dashboard.quick_actions")}</CardTitle>
              <CardDescription>{t("dashboard.frequent_tasks")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportCsv}
              >
                <FileText className="mr-2 h-4 w-4" />
                {t("dashboard.export_students_csv")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/profile")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("dashboard.edit_profile")}
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
              <CardTitle>{t("dashboard.recent_activity")}</CardTitle>
              <CardDescription>{t("dashboard.latest_actions")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + 0.1 * index }}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {activity.type === "payment" && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                    {activity.type === "invoice" && (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                    {(activity.type === "student" ||
                      activity.type === "user") && (
                      <Users className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === "reminder" && (
                      <Clock className="h-4 w-4 text-gray-500" />
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
