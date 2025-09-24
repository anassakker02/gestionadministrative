const Relance = require('../../../classes/Relance');
const db = require('../../../config/firebase');
const AuditLog = require('../../../classes/AuditLog');

class RelanceController {
  constructor() {
    this.collection = db.collection('relances');
  }

  // Créer une relance
  async create(req, res) {
    try {
      const { facture_id, dateEnvoi, type, statutEnvoi, efficacite, dateReponse, periodeCible, montantPeriodeDu, messageContent } = req.body;

      if (!facture_id || !dateEnvoi || !type) {
        return res.status(400).json({
          status: false,
          message: 'Les champs facture_id, dateEnvoi et type sont requis',
        });
      }

      const relanceData = {
        facture_id,
        dateEnvoi: new Date(dateEnvoi),
        type: type.trim(),
        statutEnvoi: statutEnvoi || 'en attente',
        efficacite: efficacite || 'pending',
        dateReponse: dateReponse ? new Date(dateReponse) : null,
        periodeCible: periodeCible || null, // Store target period
        montantPeriodeDu: montantPeriodeDu || null, // Store amount due for the period
        messageContent: messageContent || null, // Store message content
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(relanceData);
      const newRelance = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_RELANCE',
        entityType: 'Relance',
        entityId: newRelance.id,
        details: { newRelanceData: newRelance.data() },
      });
      await auditLog.save();

      return res.status(201).json({
        status: true,
        message: 'Relance créée avec succès',
        data: { id: newRelance.id, ...newRelance.data() },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  // Récupérer toutes les relances
  async getAll(req, res) {
    try {
      const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
      const relances = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: relances });
    } catch (error) {
      console.error('Erreur lors de la récupération des relances:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des relances',
        error: error.message,
      });
    }
  }

  // Récupérer une relance par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceDoc = await this.collection.doc(id).get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      const relanceData = relanceDoc.data();
      const relance = new Relance({ id: relanceDoc.id, ...relanceData });

      return res.status(200).json({ status: true, data: relance.toJSON() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération de la relance',
        error: error.message,
      });
    }
  }

  // Mettre à jour une relance
  async update(req, res) {
    try {
      const { id } = req.params;
      const { facture_id, dateEnvoi, type, statutEnvoi, efficacite, dateReponse, periodeCible, montantPeriodeDu, messageContent } = req.body;

      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceRef = this.collection.doc(id);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      const oldRelanceData = relanceDoc.data();

      const updateData = { updatedAt: new Date() };
      if (facture_id !== undefined) updateData.facture_id = facture_id;
      if (dateEnvoi !== undefined) updateData.dateEnvoi = new Date(dateEnvoi);
      if (type !== undefined) updateData.type = type.trim();
      if (statutEnvoi !== undefined) updateData.statutEnvoi = statutEnvoi;
      if (efficacite !== undefined) updateData.efficacite = efficacite;
      if (dateReponse !== undefined) updateData.dateReponse = dateReponse ? new Date(dateReponse) : null;
      if (periodeCible !== undefined) updateData.periodeCible = periodeCible;
      if (montantPeriodeDu !== undefined) updateData.montantPeriodeDu = montantPeriodeDu;
      if (messageContent !== undefined) updateData.messageContent = messageContent;

      await relanceRef.update(updateData);
      const updatedRelance = await relanceRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_RELANCE',
        entityType: 'Relance',
        entityId: id,
        details: { oldData: oldRelanceData, newData: updatedRelance.data() },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: 'Relance mise à jour avec succès',
        data: { id: updatedRelance.id, ...updatedRelance.data() },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la mise à jour de la relance',
        error: error.message,
      });
    }
  }

  async updateRelanceEffectiveness(req, res) {
    try {
      const { id } = req.params;
      const { efficacite, dateReponse } = req.body;

      if (!id || !efficacite) {
        return res.status(400).json({ status: false, message: "Reminder ID and effectiveness status are required." });
      }

      const relanceRef = this.collection.doc(id);
      const relanceDoc = await relanceRef.get();

      if (!relanceDoc.exists) {
        return res.status(404).json({ status: false, message: "Relance non trouvée." });
      }

      const oldRelanceData = relanceDoc.data();

      await relanceRef.update({
        efficacite,
        dateReponse: dateReponse ? new Date(dateReponse) : new Date(), // Set to now if not provided
        updatedAt: new Date(),
      });

      const updatedRelance = await relanceRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_RELANCE_EFFECTIVENESS',
        entityType: 'Relance',
        entityId: id,
        details: { oldData: oldRelanceData, newData: updatedRelance.data() },
      });
      await auditLog.save();

      return res.status(200).json({ status: true, message: "Efficacité de la relance mise à jour.", data: { id: updatedRelance.id, ...updatedRelance.data() } });

    } catch (error) {
      console.error("Error updating reminder effectiveness:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la mise à jour de l'efficacité de la relance." });
    }
  }

  async sendEmailReminder(req, res) {
    try {
      const { relanceId, to, subject, message } = req.body;

      if (!relanceId || !to || !subject || !message) {
        return res.status(400).json({
          status: false,
          message: 'Les champs relanceId, to, subject et message sont requis.',
        });
      }

      const relanceRef = this.collection.doc(relanceId);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists) {
        return res.status(404).json({ status: false, message: 'Relance non trouvée.' });
      }

      const oldRelanceData = relanceDoc.data();

      // Assume sendEmail function is available via module.exports from utils/sendmail.js
      const sendEmail = require('../../../utils/sendmail');

      await sendEmail({
        to,
        subject,
        template: 'genericEmailTemplate', // You might want a specific template for reminders
        context: { messageContent: message }, // Pass message content to template
      });

      const updateData = {
        statusRelance: 'envoye',
        dateEnvoi: new Date().toISOString(),
        messageContent: message, // Store the email message content
        updatedAt: new Date(),
      };
      await relanceRef.update(updateData);
      const updatedRelance = await relanceRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'SEND_EMAIL_REMINDER',
        entityType: 'Relance',
        entityId: relanceId,
        details: { oldData: oldRelanceData, newData: updatedRelance.data(), emailSentTo: to, emailSubject: subject },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: 'Email de relance envoyé avec succès.',
        data: { id: updatedRelance.id, ...updatedRelance.data() },
      });

    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de relance:", error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de l\'envoi de l\'email de relance.',
        error: error.message,
      });
    }
  }

  async sendMessageReminder(req, res) {
    try {
      const { relanceId, message } = req.body;

      if (!relanceId || !message) {
        return res.status(400).json({
          status: false,
          message: 'Les champs relanceId et message sont requis.',
        });
      }

      const relanceRef = this.collection.doc(relanceId);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists) {
        return res.status(404).json({ status: false, message: 'Relance non trouvée.' });
      }

      const oldRelanceData = relanceDoc.data();

      // Here you would typically integrate with an SMS gateway or other messaging service.
      // For now, we'll just store the message content in the relance document.

      const updateData = {
        type: 'SMS', // Assuming 'SMS' for message reminders
        statutEnvoi: 'envoye',
        dateEnvoi: new Date().toISOString(),
        messageContent: message, // Store the message content
        updatedAt: new Date(),
      };
      await relanceRef.update(updateData);
      const updatedRelance = await relanceRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'SEND_MESSAGE_REMINDER',
        entityType: 'Relance',
        entityId: relanceId,
        details: { oldData: oldRelanceData, newData: updatedRelance.data(), messageSent: message },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: 'Message de relance envoyé avec succès.',
        data: { id: updatedRelance.id, ...updatedRelance.data() },
      });
    } catch (error) {
      console.error("Erreur lors de l\'envoi du message de relance:", error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de l\'envoi du message de relance.',
        error: error.message,
      });
    }
  }

  // Supprimer une relance
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceRef = this.collection.doc(id);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      const deletedRelanceData = relanceDoc.data(); // For audit log

      await relanceRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DELETE_RELANCE',
        entityType: 'Relance',
        entityId: id,
        details: { deletedRelanceData },
      });
      await auditLog.save();

      return res
        .status(200)
        .json({ status: true, message: 'Relance supprimée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la suppression de la relance',
        error: error.message,
      });
    }
  }
}

module.exports = new RelanceController();
