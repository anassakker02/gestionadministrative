const router = require('express').Router();
const tarifsController = require('../controllers');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tarif:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the tariff
 *         nom:
 *           type: string
 *           description: Name of the tariff (e.g., "Scolarité L1")
 *         montant:
 *           type: number
 *           description: Amount of the tariff
 *         classe_id:
 *           type: string
 *           description: ID of the class this tariff applies to
 *         nationalite:
 *           type: string
 *           description: Nationality this tariff applies to
 *         annee_scolaire:
 *           type: string
 *           description: Academic year this tariff applies to
 *         type:
 *           type: string
 *           enum: [Scolarité, Autres frais, Cantine]
 *           description: Type of tariff (e.g., Scolarité, Autres frais)
 *         isActive:
 *           type: boolean
 *           description: Whether the tariff is currently active
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The end date of validity for the tariff if not active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the tariff was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the tariff was last updated
 *     CreateTarifRequest:
 *       type: object
 *       required:
 *         - nom
 *         - montant
 *         - classe_id
 *         - nationalite
 *         - annee_scolaire
 *         - type
 *       properties:
 *         nom:
 *           type: string
 *         montant:
 *           type: number
 *         classe_id:
 *           type: string
 *         nationalite:
 *           type: string
 *         annee_scolaire:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Scolarité, Autres frais, Cantine]
 *         isActive:
 *           type: boolean
 *         endDate:
 *           type: string
 *           format: date-time
 *     UpdateTarifRequest:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         montant:
 *           type: number
 *         classe_id:
 *           type: string
 *         nationalite:
 *           type: string
 *         annee_scolaire:
 *           type: string
 *         type:
 *           type: string
 *           enum: [Scolarité, Autres frais, Cantine]
 *         isActive:
 *           type: boolean
 *         endDate:
 *           type: string
 *           format: date-time
 *     TarifStats:
 *       type: object
 *       properties:
 *         totalTarifs:
 *           type: number
 *         tarifsByAnneeScolaire:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         tarifsByNationalite:
 *           type: object
 *           additionalProperties:
 *             type: number
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 *         data:
 *           type: object
 *           description: Optional data returned by the operation
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 */

/**
 * @swagger
 * tags:
 *   name: Tarifs
 *   description: Tariff management operations
 */

/**
 * @swagger
 * /tarifs:
 *   post:
 *     summary: Create a new tariff
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTarifRequest'
 *     responses:
 *       201:
 *         description: Tariff created successfully
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
 *                   example: "Tariff created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Tarif'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all active tariffs
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of tariffs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of tariffs to skip
 *     responses:
 *       200:
 *         description: A list of active tariffs
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
 *                   example: "Tariffs fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tarif'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', tarifsController.create.bind(tarifsController));
router.get('/', tarifsController.getAll.bind(tarifsController));

/**
 * @swagger
 * /tarifs/search:
 *   get:
 *     summary: Search tariffs by nationality or other criteria
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nationalite
 *         schema:
 *           type: string
 *         description: Nationality to filter tariffs by
 *       - in: query
 *         name: annee_scolaire
 *         schema:
 *           type: string
 *         description: Academic year to filter tariffs by
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Scolarité, Autres frais, Cantine]
 *         description: Type of tariff to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of tariffs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of tariffs to skip
 *     responses:
 *       200:
 *         description: A list of matching tariffs
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
 *                   example: "Tariffs fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tarif'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', tarifsController.search.bind(tarifsController));

/**
 * @swagger
 * /tarifs/stats:
 *   get:
 *     summary: Get tariff statistics
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tariff statistics
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
 *                   example: "Tariff statistics fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/TarifStats'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', tarifsController.getStats.bind(tarifsController));

/**
 * @swagger
 * /tarifs/calculate/{etudiant_id}:
 *   get:
 *     summary: Calculate total fees for a student
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: etudiant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student
 *       - in: query
 *         name: annee_scolaire
 *         schema:
 *           type: string
 *         description: Academic year (optional, defaults to current year)
 *     responses:
 *       200:
 *         description: Student fees calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     etudiant:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         nom:
 *                           type: string
 *                         prenom:
 *                           type: string
 *                         bourse_id:
 *                           type: string
 *                     annee_scolaire:
 *                       type: string
 *                     calcul:
 *                       type: object
 *                       properties:
 *                         frais_inscription:
 *                           type: number
 *                         frais_scolarite:
 *                           type: number
 *                         frais_total:
 *                           type: number
 *                         reduction_bourse:
 *                           type: number
 *                         montant_final:
 *                           type: number
 *                     bourse:
 *                       type: object
 *                       nullable: true
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/calculate/:etudiant_id', tarifsController.calculateStudentFees.bind(tarifsController));

/**
 * @swagger
 * /tarifs/{id}:
 *   get:
 *     summary: Get a tariff by ID
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tariff to retrieve
 *     responses:
 *       200:
 *         description: Tariff data
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
 *                   example: "Tariff fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Tarif'
 *       404:
 *         description: Tariff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     summary: Update a tariff by ID (creates a new active tariff and deactivates the old one)
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tariff to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTarifRequest'
 *     responses:
 *       200:
 *         description: Tariff updated successfully
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
 *                   example: "Tariff updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Tarif'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Tariff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Deactivate a tariff by ID (soft delete)
 *     tags: [Tarifs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the tariff to deactivate
 *     responses:
 *       200:
 *         description: Tariff deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Tariff not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', tarifsController.getById.bind(tarifsController));
router.put('/:id', tarifsController.update.bind(tarifsController));
router.delete('/:id', tarifsController.delete.bind(tarifsController));

module.exports = router;
