const admin = require('firebase-admin');
const db = require('../../../config/firebase');
const BackupHistory = require('../../../classes/BackupHistory');
const AuditLog = require('../../../classes/AuditLog');
const { backupCollections, restoreCollection } = require('../../../utils/backupUtility');

class BackupController {
    constructor() {
        this.backupHistoryCollection = db.collection('backupHistory');
    }

    async initiateBackup(req, res) {
        try {
            const { collections } = req.body; // Array of collection names to backup
            const backupBaseName = `manual-backup-${Date.now()}`;
            const userId = req.user?.id || 'system';

            if (!collections || !Array.isArray(collections) || collections.length === 0) {
                return res.status(400).json({ status: false, message: "Veuillez spécifier les collections à sauvegarder." });
            }

            const initialBackupRecord = new BackupHistory({
                userId,
                backupType: 'manual',
                collections,
                storagePath: `backups/${backupBaseName}`,
                status: 'pending',
            });
            const backupDocRef = await this.backupHistoryCollection.add(initialBackupRecord.toFirestore());

            // Perform backup in background
            backupCollections(collections, backupBaseName).then(async (backupDetails) => {
                let overallStatus = 'completed';
                for (const col in backupDetails) {
                    if (backupDetails[col].status === 'failed') {
                        overallStatus = 'failed';
                        break;
                    }
                }
                await backupDocRef.update({ status: overallStatus, details: backupDetails });

                const auditLog = new AuditLog({
                    userId,
                    action: 'INITIATE_BACKUP',
                    entityType: 'System',
                    entityId: backupDocRef.id,
                    details: { collections, backupBaseName, status: overallStatus, backupDetails },
                });
                await auditLog.save();

                console.log(`Backup ${backupDocRef.id} finished with status: ${overallStatus}`);
            }).catch(async (error) => {
                console.error(`Background backup failed for ${backupDocRef.id}:`, error);
                await backupDocRef.update({ status: 'failed', details: { error: error.message } });

                const auditLog = new AuditLog({
                    userId,
                    action: 'INITIATE_BACKUP_FAILED',
                    entityType: 'System',
                    entityId: backupDocRef.id,
                    details: { collections, backupBaseName, error: error.message },
                });
                await auditLog.save();
            });

            return res.status(202).json({ status: true, message: "Sauvegarde initiée avec succès en arrière-plan.", backupId: backupDocRef.id });

        } catch (error) {
            console.error("Error initiating backup:", error);
            return res.status(500).json({ status: false, message: "Erreur lors de l'initiation de la sauvegarde", error: error.message });
        }
    }

    async getBackupHistory(req, res) {
        try {
            const snapshot = await this.backupHistoryCollection.orderBy('timestamp', 'desc').get();
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json({ status: true, data: history });
        } catch (error) {
            console.error("Error retrieving backup history:", error);
            return res.status(500).json({ status: false, message: "Erreur lors de la récupération de l'historique des sauvegardes", error: error.message });
        }
    }

    async downloadBackupCollection(req, res) {
        try {
            const { backupId, collectionName } = req.params;
            if (!backupId || !collectionName) {
                return res.status(400).json({ status: false, message: "ID de sauvegarde et nom de collection requis." });
            }

            const backupDoc = await this.backupHistoryCollection.doc(backupId).get();
            if (!backupDoc.exists) {
                return res.status(404).json({ status: false, message: "Historique de sauvegarde non trouvé." });
            }

            const backupData = backupDoc.data();
            const collectionDetail = backupData.details && backupData.details[collectionName];

            if (!collectionDetail || collectionDetail.status !== 'completed' || !collectionDetail.downloadUrl) {
                return res.status(404).json({ status: false, message: `Fichier de sauvegarde pour la collection ${collectionName} non disponible ou échec.` });
            }

            return res.status(200).json({ status: true, message: "Lien de téléchargement de la collection de sauvegarde généré avec succès.", downloadUrl: collectionDetail.downloadUrl });

        } catch (error) {
            console.error("Error downloading backup collection:", error);
            return res.status(500).json({ status: false, message: "Erreur lors du téléchargement de la collection de sauvegarde", error: error.message });
        }
    }

    async initiateRestore(req, res) {
        try {
            const { backupId, collectionsToRestore } = req.body;
            const userId = req.user?.id || 'system';

            if (!backupId || !collectionsToRestore || !Array.isArray(collectionsToRestore) || collectionsToRestore.length === 0) {
                return res.status(400).json({ status: false, message: "ID de sauvegarde et collections à restaurer requis." });
            }

            const backupDoc = await this.backupHistoryCollection.doc(backupId).get();
            if (!backupDoc.exists) {
                return res.status(404).json({ status: false, message: "Historique de sauvegarde non trouvé." });
            }
            const backupData = backupDoc.data();

            if (backupData.status !== 'completed') {
                return res.status(400).json({ status: false, message: "Impossible de restaurer à partir d'une sauvegarde non complète." });
            }

            const restoreProcesses = [];
            for (const collectionName of collectionsToRestore) {
                const collectionDetail = backupData.details && backupData.details[collectionName];
                if (collectionDetail && collectionDetail.status === 'completed' && collectionDetail.filePath) {
                    restoreProcesses.push(restoreCollection(collectionName, collectionDetail.filePath));
                } else {
                    console.warn(`Collection ${collectionName} not found or not completed in backup ${backupId}. Skipping.`);
                }
            }

            if (restoreProcesses.length === 0) {
                return res.status(400).json({ status: false, message: "Aucune collection valide à restaurer trouvée dans la sauvegarde spécifiée." });
            }

            Promise.allSettled(restoreProcesses).then(async (results) => {
                const successfulRestores = results.filter(r => r.status === 'fulfilled');
                const failedRestores = results.filter(r => r.status === 'rejected');

                const overallRestoreStatus = failedRestores.length > 0 ? 'partially_failed' : 'completed';
                const restoreSummary = {
                    totalCollectionsAttempted: collectionsToRestore.length,
                    successfulRestores: successfulRestores.length,
                    failedRestores: failedRestores.length,
                    details: results.map(r => ({ status: r.status, reason: r.reason?.message || r.value } )),
                };

                const auditLog = new AuditLog({
                    userId,
                    action: 'INITIATE_RESTORE',
                    entityType: 'System',
                    entityId: backupId,
                    details: { collectionsToRestore, status: overallRestoreStatus, summary: restoreSummary },
                });
                await auditLog.save();

                console.log(`Restore operation for backup ${backupId} finished with status: ${overallRestoreStatus}`);
            });

            return res.status(202).json({ status: true, message: "Restauration initiée avec succès en arrière-plan.", backupId: backupId });

        } catch (error) {
            console.error("Error initiating restore:", error);
            return res.status(500).json({ status: false, message: "Erreur lors de l'initiation de la restauration", error: error.message });
        }
    }
}

module.exports = new BackupController();
