const router = require('express').Router();
const backupController = require('../controllers');
const { authenticate, authorize } = require('../../../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Backup
 *   description: Database backup and restoration operations
 */

/**
 * @swagger
 * /backup/initiate:
 *   post:
 *     summary: Initiate a full or partial database backup
 *     tags: [Backup]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collections:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of collection names to backup (e.g., ["users", "etudiants"])
 *             example:
 *               collections: ["users", "etudiants", "factures"]
 *     responses:
 *       202:
 *         description: Backup initiated successfully in the background
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 backupId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/initiate', authenticate, authorize(['admin']), backupController.initiateBackup.bind(backupController));

/**
 * @swagger
 * /backup/history:
 *   get:
 *     summary: Retrieve a list of all backup history records
 *     tags: [Backup]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of backup history records fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BackupHistory'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/history', authenticate, authorize(['admin']), backupController.getBackupHistory.bind(backupController));

/**
 * @swagger
 * /backup/{backupId}/collection/{collectionName}/download:
 *   get:
 *     summary: Get a download link for a specific collection from a backup
 *     tags: [Backup]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the backup history record
 *       - in: path
 *         name: collectionName
 *         schema:
 *           type: string
 *         required: true
 *         description: Name of the collection to download from the backup
 *     responses:
 *       200:
 *         description: Download link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 downloadUrl:
 *                   type: string
 *                   format: url
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/:backupId/collection/:collectionName/download', authenticate, authorize(['admin']), backupController.downloadBackupCollection.bind(backupController));

/**
 * @swagger
 * /backup/restore:
 *   post:
 *     summary: Initiate a database restore operation from a specific backup
 *     tags: [Backup]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupId:
 *                 type: string
 *                 description: The ID of the backup history record to restore from
 *               collectionsToRestore:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of collection names to restore (e.g., ["users", "etudiants"])
 *             example:
 *               backupId: "someBackupId123"
 *               collectionsToRestore: ["users", "etudiants"]
 *     responses:
 *       202:
 *         description: Restore initiated successfully in the background
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 backupId:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/restore', authenticate, authorize(['admin']), backupController.initiateRestore.bind(backupController));

module.exports = router;
