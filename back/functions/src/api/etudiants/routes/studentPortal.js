const router = require("express").Router();
const studentPortalController = require("../controllers/studentPortal");
const { authenticate } = require("../../../middlewares/auth");

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentDashboard:
 *       type: object
 *       properties:
 *         etudiant:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             nom:
 *               type: string
 *             prenom:
 *               type: string
 *             email:
 *               type: string
 *             telephone:
 *               type: string
 *             classe:
 *               type: object
 *             bourse:
 *               type: object
 *         frais:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             reductionBourse:
 *               type: number
 *             totalAvecReduction:
 *               type: number
 *             totalPaye:
 *               type: number
 *             montantRestant:
 *               type: number
 *             statut:
 *               type: string
 *         paiements:
 *           type: array
 *           items:
 *             type: object
 *         factures:
 *           type: array
 *           items:
 *             type: object
 *         tarifs:
 *           type: array
 *           items:
 *             type: object
 *         anneeScolaire:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Student Portal
 *   description: Portail étudiant - Gestion des paiements et factures
 */

/**
 * @swagger
 * /etudiants/portal/dashboard:
 *   get:
 *     summary: Obtenir le tableau de bord de l'étudiant
 *     tags: [Student Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tableau de bord récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tableau de bord récupéré avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/StudentDashboard'
 *       401:
 *         description: Non autorisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Accès refusé. Aucun token fourni."
 *       404:
 *         description: Étudiant non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Étudiant non trouvé pour cet utilisateur"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Erreur lors de la récupération du tableau de bord"
 */
router.get("/dashboard", authenticate, studentPortalController.getStudentDashboard.bind(studentPortalController));

/**
 * @swagger
 * /etudiants/portal/payments:
 *   get:
 *     summary: Obtenir l'historique des paiements de l'étudiant
 *     tags: [Student Portal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Paiements récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Paiements récupérés avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paiements:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Étudiant non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/payments", authenticate, studentPortalController.getStudentPayments.bind(studentPortalController));

/**
 * @swagger
 * /etudiants/portal/invoices:
 *   get:
 *     summary: Obtenir les factures de l'étudiant
 *     tags: [Student Portal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Factures récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Factures récupérées avec succès"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Étudiant non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get("/invoices", authenticate, studentPortalController.getStudentInvoices.bind(studentPortalController));

module.exports = router;
