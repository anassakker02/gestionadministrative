const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");
const { generateCsv } = require('../../../utils/csvGenerator');
const { decrypt } = require('../../../utils/encryption');
const { uploadFileToFirebaseStorage } = require('../../../utils/firebaseStorage');
const ExportHistory = require('../../../classes/ExportHistory');
const admin = require('firebase-admin');

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      const studentsSnapshot = await db.collection("etudiants").get();
      const totalStudents = studentsSnapshot.docs.length;

      const paymentsSnapshot = await db.collection("paiements").get();
      let totalPayments = 0;
      let monthlyRevenue = 0;
      paymentsSnapshot.docs.forEach(doc => {
        const payment = doc.data();
        totalPayments += payment.montantPaye || 0;
        const paymentDate = payment.date_paiement instanceof Date ? payment.date_paiement : payment.date_paiement?.toDate();
        if (paymentDate && paymentDate.getMonth() === new Date().getMonth() && paymentDate.getFullYear() === new Date().getFullYear()) {
          monthlyRevenue += payment.montantPaye || 0;
        }
      });

      const invoicesSnapshot = await db.collection("factures").get();
      let totalInvoices = invoicesSnapshot.docs.length;
      let unpaidInvoices = 0;
      let pendingPaymentsAmount = 0;
      invoicesSnapshot.docs.forEach(doc => {
        const invoice = doc.data();
        if (invoice.statut === "impayée" || invoice.statut === "partielle") {
          unpaidInvoices++;
          pendingPaymentsAmount += invoice.montantRestant || 0;
        }
      });

      const auditLogsSnapshot = await db.collection("auditLogs").orderBy("timestamp", "desc").limit(4).get();
      const recentActivities = auditLogsSnapshot.docs.map(doc => {
        const log = doc.data();
        return {
          type: log.entityType.toLowerCase(),
          message: `${log.action} sur ${log.entityType} (ID: ${log.entityId})`,
          time: log.timestamp.toDate().toLocaleString(),
        };
      });

      const dashboardData = {
        stats: {
          totalStudents: totalStudents.toLocaleString(),
          pendingPayments: `€${pendingPaymentsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          monthlyRevenue: `€${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          unpaidInvoices: unpaidInvoices.toLocaleString(),
          totalPayments: `€${totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          totalInvoices: totalInvoices.toLocaleString(),
        },
        recentActivities: recentActivities,
      };

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'VIEW_DASHBOARD_STATS',
        entityType: 'Dashboard',
        entityId: null,
        details: { stats: dashboardData.stats },
      });
      await auditLog.save();

      res.status(200).json(dashboardData);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques du tableau de bord", error: error.message });
    }
  }

  async exportStudentsCsv(req, res) {
    try {
      const studentsSnapshot = await db.collection("etudiants").get();
      const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (students.length === 0) {
        return res.status(404).json({ status: false, message: "Aucun étudiant trouvé pour l'exportation." });
      }

      const headers = [
        { id: 'id', title: 'ID' },
        { id: 'nom', title: 'Nom' },
        { id: 'prenom', title: 'Prénom' },
        { id: 'dateNaissance', title: 'Date de Naissance' },
        { id: 'genre', title: 'Genre' },
        { id: 'nationalite', title: 'Nationalité' },
        { id: 'adresse', title: 'Adresse' },
        { id: 'telephone', title: 'Téléphone' },
        { id: 'email', title: 'Email' },
        { id: 'classe_id', title: 'ID Classe' },
        { id: 'anneeScolaire', title: 'Année Scolaire' },
        { id: 'parentId', title: 'ID Parent' },
        { id: 'exemptions', title: 'Exemptions' },
        { id: 'createdAt', title: 'Date de Création' },
        { id: 'updatedAt', title: 'Date de Mise à Jour' },
      ];

      const formattedStudents = students.map(student => ({
        ...student,
        dateNaissance: student.dateNaissance?.toDate ? student.dateNaissance.toDate().toISOString().split('T')[0] : student.dateNaissance,
        exemptions: student.exemptions ? student.exemptions.join('; ') : '',
        createdAt: student.createdAt?.toDate ? student.createdAt.toDate().toLocaleString() : student.createdAt,
        updatedAt: student.updatedAt?.toDate ? student.updatedAt.toDate().toLocaleString() : student.updatedAt,
      }));

      const csvString = await generateCsv(formattedStudents, headers);
      const fileName = `students_export_${Date.now()}.csv`;
      const storagePath = `exports/csv/${fileName}`;
      const downloadUrl = await uploadFileToFirebaseStorage(Buffer.from(csvString), storagePath, 'text/csv');
      
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'EXPORT_STUDENTS_CSV',
        entityType: 'Report',
        entityId: null,
        details: { recordCount: students.length, fileName: fileName, downloadUrl: downloadUrl },
      });
      await auditLog.save();

      // Record export history
      const exportHistory = new ExportHistory({
          userId: req.user?.id || 'system',
          exportType: 'csv',
          fileName: fileName,
          filePath: storagePath,
          downloadUrl: downloadUrl,
      });
      await db.collection('exportHistory').add(exportHistory.toFirestore());

      return res.status(200).json({ status: true, message: "CSV export generated and archived successfully", downloadUrl: downloadUrl });

    } catch (error) {
      console.error("Erreur lors de l'exportation CSV des étudiants:", error);
      res.status(500).json({ status: false, message: "Erreur lors de l'exportation CSV des étudiants", error: error.message });
    }
  }

  async exportStudentsExcel(req, res) {
    try {
      const studentsSnapshot = await db.collection('etudiants').get();
      const students = studentsSnapshot.docs.map(doc => doc.data());

      if (students.length === 0) {
        return res.status(404).json({ status: false, message: "Aucun étudiant trouvé à exporter" });
      }

      const headers = ['nom', 'prenom', 'date_naissance', 'nationalite', 'classe_id', 'bourse_id', 'exemptions', 'parentId'];
      const data = students.map(student => ({
        nom: student.nom,
        prenom: student.prenom,
        date_naissance: student.date_naissance ? new Date(student.date_naissance.toDate()).toLocaleDateString() : '',
        nationalite: student.nationalite,
        classe_id: student.classe_id,
        bourse_id: student.bourse_id,
        exemptions: student.exemptions ? JSON.parse(decrypt(student.exemptions)).join(', ') : '',
        parentId: student.parentId ? decrypt(student.parentId) : '',
      }));

      const fileName = `students_export_${Date.now()}.xlsx`;
      const { filePath, downloadUrl } = await require('../../../utils/excelGenerator').generateExcel(data, headers, 'Students', fileName);

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'EXPORT_STUDENTS_EXCEL',
        entityType: 'Report',
        entityId: null,
        details: { recordCount: students.length, fileName: fileName, downloadUrl: downloadUrl },
      });
      await auditLog.save();

      // Record export history
      const exportHistory = new ExportHistory({
          userId: req.user?.id || 'system',
          exportType: 'excel',
          fileName: fileName,
          filePath: filePath,
          downloadUrl: downloadUrl,
      });
      await db.collection('exportHistory').add(exportHistory.toFirestore());

      return res.status(200).json({ status: true, message: "Excel export generated and archived successfully", downloadUrl: downloadUrl });

    } catch (error) {
      console.error("Error exporting students to Excel:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de l'exportation Excel des étudiants", error: error.message });
    }
  }

  async getExportHistory(req, res) {
    try {
        const snapshot = await db.collection('exportHistory').orderBy('createdAt', 'desc').get();
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ status: true, data: history });
    } catch (error) {
        console.error("Error retrieving export history:", error);
        return res.status(500).json({ status: false, message: "Erreur lors de la récupération de l'historique des exports", error: error.message });
    }
  }

  async downloadExport(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ status: false, message: "ID de l'exportation requis" });
        }

        const exportDoc = await db.collection('exportHistory').doc(id).get();
        if (!exportDoc.exists) {
            return res.status(404).json({ status: false, message: "Exportation non trouvée" });
        }

        const exportData = exportDoc.data();

        if (!exportData.filePath) {
            return res.status(404).json({ status: false, message: "Chemin du fichier d'exportation non trouvé" });
        }

        // Stream the file from Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(exportData.filePath);
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        return res.status(200).json({ status: true, message: "Lien de téléchargement généré avec succès", downloadUrl: url });

    } catch (error) {
        console.error("Error downloading export:", error);
        return res.status(500).json({ status: false, message: "Erreur lors du téléchargement de l'exportation", error: error.message });
    }
  }
}

module.exports = new DashboardController();
