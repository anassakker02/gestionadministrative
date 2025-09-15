exports.getDashboardStats = (req, res) => {
  try {
    const dashboardData = {
      stats: {
        totalStudents: "1,247",
        pendingPayments: "€45,320",
        monthlyRevenue: "€128,450",
        unpaidInvoices: "67",
      },
      recentActivities: [
        { type: "payment", message: "Paiement reçu de Marie Dubois", time: "Il y a 2h" },
        { type: "student", message: "Nouvel étudiant inscrit: Jean Martin", time: "Il y a 4h" },
        { type: "reminder", message: "Relance envoyée à 15 étudiants", time: "Il y a 6h" },
        { type: "invoice", message: "Facture générée pour la classe 2A", time: "Il y a 8h" }
      ],
    };
    res.status(200).json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques du tableau de bord", error: error.message });
  }
};
