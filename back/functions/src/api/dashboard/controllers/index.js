const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");
const { generateCsv } = require("../../../utils/csvGenerator");
const { decrypt } = require("../../../utils/encryption");
const {
  uploadFileToFirebaseStorage,
} = require("../../../utils/firebaseStorage");
const ExportHistory = require("../../../classes/ExportHistory");
const admin = require("firebase-admin");

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [
        studentsCountSnap,
        totalInvoicesSnap,
        totalPaymentsSnap,
        monthlyPaymentsSnap,
        unpaidInvoicesSnap,
      ] = await Promise.all([
        db.collection("etudiants").count().get(),
        db.collection("factures").count().get(),
        db.collection("paiements").select("montantPaye").get(),
        db
          .collection("paiements")
          .where("createdAt", ">=", monthStart)
          .where("createdAt", "<", nextMonthStart)
          .select("montantPaye")
          .get(),
        db
          .collection("factures")
          .where("statut", "in", ["impayée", "partielle"])
          .select("montantRestant")
          .get(),
      ]);

      const totalStudents = studentsCountSnap.data().count || 0;
      const totalInvoices = totalInvoicesSnap.data().count || 0;
      const totalPayments = totalPaymentsSnap.docs.reduce((sum, doc) => {
        return sum + (Number(doc.data()?.montantPaye) || 0);
      }, 0);
      const monthlyRevenue = monthlyPaymentsSnap.docs.reduce((sum, doc) => {
        return sum + (Number(doc.data()?.montantPaye) || 0);
      }, 0);
      const unpaidInvoices = unpaidInvoicesSnap.docs.length;
      const pendingPaymentsAmount = unpaidInvoicesSnap.docs.reduce((sum, doc) => {
        return sum + (Number(doc.data()?.montantRestant) || 0);
      }, 0);

      let recentActivities = [];
      try {
        const auditLogsSnapshot = await db
          .collection("auditLogs")
          .orderBy("timestamp", "desc")
          .limit(4)
          .get();
        recentActivities = auditLogsSnapshot.docs.map((doc) => {
          const log = doc.data();
          const timestamp = log.timestamp?.toDate
            ? log.timestamp.toDate()
            : log.timestamp || new Date();
          return {
            type: (log.entityType || "system").toLowerCase(),
            message: `${log.action || "Action"} sur ${log.entityType || "entité"} (ID: ${log.entityId || "N/A"})`,
            time: timestamp.toLocaleString(),
          };
        });
      } catch (logError) {
        console.warn("Fallback auditLogs pour Dashboard:", logError.message);
        try {
          const auditLogsSnapshot = await db.collection("auditLogs").limit(4).get();
          recentActivities = auditLogsSnapshot.docs.map((doc) => {
            const log = doc.data();
            const timestamp = log.timestamp?.toDate
              ? log.timestamp.toDate()
              : log.timestamp || new Date();
            return {
              type: (log.entityType || "system").toLowerCase(),
              message: `${log.action || "Action"} sur ${log.entityType || "entité"} (ID: ${log.entityId || "N/A"})`,
              time: timestamp.toLocaleString(),
            };
          });
        } catch (innerError) {
          console.error("Echec total auditLogs:", innerError);
          recentActivities = [];
        }
      }

      const dashboardData = {
        stats: {
          totalStudents: totalStudents.toLocaleString(),
          pendingPayments: `€${pendingPaymentsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          monthlyRevenue: `€${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          unpaidInvoices: unpaidInvoices.toLocaleString(),
          totalPayments: `€${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          totalInvoices: totalInvoices.toLocaleString(),
        },
        recentActivities,
      };

      try {
        const auditLog = new AuditLog({
          userId: req.user?.id || "system",
          action: "VIEW_DASHBOARD_STATS",
          entityType: "Dashboard",
          entityId: null,
          details: { stats: dashboardData.stats },
        });
        await auditLog.save();
      } catch (saveError) {
        console.warn(
          "Impossible de sauvegarder l'audit log du dashboard:",
          saveError.message,
        );
      }

      res.status(200).json(dashboardData);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques du tableau de bord:",
        error,
      );
      res.status(500).json({
        message: "Erreur lors de la récupération des statistiques du tableau de bord",
        error: error.message,
      });
    }
  }

  async exportStudentsCsv(req, res) {
    try {
      const studentsSnapshot = await db.collection("etudiants").get();
      const students = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (students.length === 0) {
        return res
          .status(404)
          .json({
            status: false,
            message: "Aucun Ã©tudiant trouvÃ© pour l'exportation.",
          });
      }

      const headers = [
        { id: "id", title: "ID" },
        { id: "nom", title: "Nom" },
        { id: "prenom", title: "PrÃ©nom" },
        { id: "dateNaissance", title: "Date de Naissance" },
        { id: "genre", title: "Genre" },
        { id: "nationalite", title: "NationalitÃ©" },
        { id: "adresse", title: "Adresse" },
        { id: "telephone", title: "TÃ©lÃ©phone" },
        { id: "email", title: "Email" },
        { id: "classe_id", title: "ID Classe" },
        { id: "anneeScolaire", title: "AnnÃ©e Scolaire" },
        { id: "parentId", title: "ID Parent" },
        { id: "exemptions", title: "Exemptions" },
        { id: "createdAt", title: "Date de CrÃ©ation" },
        { id: "updatedAt", title: "Date de Mise Ã  Jour" },
      ];

      const formattedStudents = students.map((student) => ({
        ...student,
        dateNaissance: student.dateNaissance?.toDate
          ? student.dateNaissance.toDate().toISOString().split("T")[0]
          : student.dateNaissance,
        exemptions: student.exemptions ? student.exemptions.join("; ") : "",
        createdAt: student.createdAt?.toDate
          ? student.createdAt.toDate().toLocaleString()
          : student.createdAt,
        updatedAt: student.updatedAt?.toDate
          ? student.updatedAt.toDate().toLocaleString()
          : student.updatedAt,
      }));

      const csvString = await generateCsv(formattedStudents, headers);
      const fileName = `students_export_${Date.now()}.csv`;
      const storagePath = `exports/csv/${fileName}`;
      const downloadUrl = await uploadFileToFirebaseStorage(
        Buffer.from(csvString),
        storagePath,
        "text/csv",
      );

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "EXPORT_STUDENTS_CSV",
        entityType: "Report",
        entityId: null,
        details: {
          recordCount: students.length,
          fileName: fileName,
          downloadUrl: downloadUrl,
        },
      });
      await auditLog.save();

      // Record export history
      const exportHistory = new ExportHistory({
        userId: req.user?.id || "system",
        exportType: "csv",
        fileName: fileName,
        filePath: storagePath,
        downloadUrl: downloadUrl,
      });
      await db.collection("exportHistory").add(exportHistory.toFirestore());

      return res
        .status(200)
        .json({
          status: true,
          message: "CSV export generated and archived successfully",
          downloadUrl: downloadUrl,
        });
    } catch (error) {
      console.error("Erreur lors de l'exportation CSV des Ã©tudiants:", error);
      res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de l'exportation CSV des Ã©tudiants",
          error: error.message,
        });
    }
  }

  async exportStudentsExcel(req, res) {
    try {
      const studentsSnapshot = await db.collection("etudiants").get();
      const students = studentsSnapshot.docs.map((doc) => doc.data());

      if (students.length === 0) {
        return res
          .status(404)
          .json({ status: false, message: "Aucun Ã©tudiant trouvÃ© Ã  exporter" });
      }

      const headers = [
        "nom",
        "prenom",
        "date_naissance",
        "nationalite",
        "classe_id",
        "bourse_id",
        "exemptions",
        "parentId",
      ];
      const data = students.map((student) => ({
        nom: student.nom,
        prenom: student.prenom,
        date_naissance: student.date_naissance
          ? new Date(student.date_naissance.toDate()).toLocaleDateString()
          : "",
        nationalite: student.nationalite,
        classe_id: student.classe_id,
        bourse_id: student.bourse_id,
        exemptions: student.exemptions
          ? JSON.parse(decrypt(student.exemptions)).join(", ")
          : "",
        parentId: student.parentId ? decrypt(student.parentId) : "",
      }));

      const fileName = `students_export_${Date.now()}.xlsx`;
      const { filePath, downloadUrl } =
        await require("../../../utils/excelGenerator").generateExcel(
          data,
          headers,
          "Students",
          fileName,
        );

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "EXPORT_STUDENTS_EXCEL",
        entityType: "Report",
        entityId: null,
        details: {
          recordCount: students.length,
          fileName: fileName,
          downloadUrl: downloadUrl,
        },
      });
      await auditLog.save();

      // Record export history
      const exportHistory = new ExportHistory({
        userId: req.user?.id || "system",
        exportType: "excel",
        fileName: fileName,
        filePath: filePath,
        downloadUrl: downloadUrl,
      });
      await db.collection("exportHistory").add(exportHistory.toFirestore());

      return res
        .status(200)
        .json({
          status: true,
          message: "Excel export generated and archived successfully",
          downloadUrl: downloadUrl,
        });
    } catch (error) {
      console.error("Error exporting students to Excel:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de l'exportation Excel des Ã©tudiants",
          error: error.message,
        });
    }
  }

  async getExportHistory(req, res) {
    try {
      const snapshot = await db
        .collection("exportHistory")
        .orderBy("createdAt", "desc")
        .get();
      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: history });
    } catch (error) {
      console.error("Error retrieving export history:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la rÃ©cupÃ©ration de l'historique des exports",
          error: error.message,
        });
    }
  }

  async downloadExport(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de l'exportation requis" });
      }

      const exportDoc = await db.collection("exportHistory").doc(id).get();
      if (!exportDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Exportation non trouvÃ©e" });
      }

      const exportData = exportDoc.data();

      if (!exportData.filePath) {
        return res
          .status(404)
          .json({
            status: false,
            message: "Chemin du fichier d'exportation non trouvÃ©",
          });
      }

      // Stream the file from Firebase Storage
      const bucket = admin.storage().bucket();
      const file = bucket.file(exportData.filePath);
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

      return res
        .status(200)
        .json({
          status: true,
          message: "Lien de tÃ©lÃ©chargement gÃ©nÃ©rÃ© avec succÃ¨s",
          downloadUrl: url,
        });
    } catch (error) {
      console.error("Error downloading export:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors du tÃ©lÃ©chargement de l'exportation",
          error: error.message,
        });
    }
  }
}

module.exports = new DashboardController();

