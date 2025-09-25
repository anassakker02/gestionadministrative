const router = require('express').Router();
const etudiantController = require('../controllers');
const { authenticate } = require('../../../middlewares/auth');

// Import des routes du portail étudiant
const studentPortalRoutes = require('./studentPortal');

/**
 * @swagger
 * components:
 *   schemas:
 *   # Reusing definitions from Users API or defining new ones if specific to Etudiants
 *     Etudiant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the student
 *         nom:
 *           type: string
 *           description: Last name of the student
 *         prenom:
 *           type: string
 *           description: First name of the student
 *         date_naissance:
 *           type: string
 *           format: date
 *           description: Date of birth of the student
 *         genre:
 *           type: string
 *           enum: [Masculin, Féminin, Autre]
 *           description: Gender of the student
 *         nationalite:
 *           type: string
 *           description: Nationality of the student
 *         adresse:
 *           type: string
 *           description: Address of the student
 *         telephone:
 *           type: string
 *           description: Phone number of the student
 *         email:
 *           type: string
 *           format: email
 *           description: Email of the student
 *         classe_id:
 *           type: string
 *           description: ID of the class the student belongs to
 *         anneeScolaire:
 *           type: string
 *           description: Academic year of the student
 *         bourse_id:
 *           type: string
 *           description: Optional ID of the scholarship the student receives
 *         parentId:
 *           type: string
 *           description: Optional ID of the parent linked to the student
 *         
 *         paymentPlanId:
 *           type: string
 *           description: ID of the payment plan associated with the student
 *         paymentOverride:
 *           type: boolean
 *           description: Flag to indicate if payment status is manually overridden by accountant
 *         overdueNotificationsMutedUntil:
 *           type: string
 *           format: date-time
 *           description: Timestamp until when overdue notifications are muted
 *         exemptions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of exemptions for the student
 *         frais_payment:
 *           type: number
 *           description: Total amount of fees (tuition + registration) that the student must pay, with scholarship reduction applied
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the student record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the student record was last updated
 *     CreateEtudiantRequest:
 *       type: object
 *       required:
 *         - nom
 *         - prenom
 *         - date_naissance
 *         - genre
 *         - nationalite
 *         - classe_id
 *         - anneeScolaire
 *       properties:
 *         nom:
 *           type: string
 *         prenom:
 *           type: string
 *         date_naissance:
 *           type: string
 *           format: date
 *         genre:
 *           type: string
 *           enum: [Masculin, Féminin, Autre]
 *         nationalite:
 *           type: string
 *         adresse:
 *           type: string
 *         telephone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         classe_id:
 *           type: string
 *         anneeScolaire:
 *           type: string
 *         bourse_id:
 *           type: string
 *         parentId:
 *           type: string
 *         code_massar:
 *           type: string
 *         paymentPlanId:
 *           type: string
 *         paymentOverride:
 *           type: boolean
 *         overdueNotificationsMutedUntil:
 *           type: string
 *           format: date-time
 *     UpdateEtudiantRequest:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         prenom:
 *           type: string
 *         date_naissance:
 *           type: string
 *           format: date
 *         genre:
 *           type: string
 *           enum: [Masculin, Féminin, Autre]
 *         nationalite:
 *           type: string
 *         adresse:
 *           type: string
 *         telephone:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         classe_id:
 *           type: string
 *         anneeScolaire:
 *           type: string
 *         bourse_id:
 *           type: string
 *         parentId:
 *           type: string
 *         code_massar:
 *           type: string
 *         paymentPlanId:
 *           type: string
 *         paymentOverride:
 *           type: boolean
 *         overdueNotificationsMutedUntil:
 *           type: string
 *           format: date-time
 *         exemptions:
 *           type: array
 *           items:
 *             type: string
 *     EtudiantStats:
 *       type: object
 *       properties:
 *         totalEtudiants:
 *           type: number
 *         etudiantsByClasse:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         etudiantsByAnneeScolaire:
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
 *   name: Etudiants
 *   description: Student management operations
 */

/**
 * @swagger
 * /etudiants:
 *   post:
 *     summary: Create a new student
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEtudiantRequest'
 *     responses:
 *       201:
 *         description: Student created successfully
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
 *                   example: "Student created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Etudiant'
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
 *     summary: Get all students
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of students to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of students to skip
 *     responses:
 *       200:
 *         description: A list of students
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
 *                   example: "Students fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Etudiant'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, etudiantController.create.bind(etudiantController));
router.get('/', authenticate, etudiantController.getAll.bind(etudiantController));

/**
 * @swagger
 * /etudiants/search:
 *   get:
 *     summary: Search students by name or other criteria
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nom
 *         schema:
 *           type: string
 *         description: Name or part of the name of the student to search for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of students to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of students to skip
 *     responses:
 *       200:
 *         description: A list of matching students
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
 *                   example: "Students fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Etudiant'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', authenticate, etudiantController.search.bind(etudiantController));

/**
 * @swagger
 * /etudiants/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics
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
 *                   example: "Student statistics fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EtudiantStats'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticate, etudiantController.getStats.bind(etudiantController));

/**
 * @swagger
 * /etudiants/recalculate-fees:
 *   post:
 *     summary: Recalculate fees for all students
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fees recalculated successfully
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
 *                   example: "Recalcul terminé. 150 étudiants mis à jour, 0 erreurs."
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 150
 *                     errorCount:
 *                       type: number
 *                       example: 0
 *                     totalStudents:
 *                       type: number
 *                       example: 150
 *                     fraisGlobaux:
 *                       type: number
 *                       example: 60800
 *                     academicYear:
 *                       type: string
 *                       example: "2024-2025"
 *       403:
 *         description: Unauthorized
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
router.post('/recalculate-fees', authenticate, etudiantController.recalculateFees.bind(etudiantController));

/**
 * @swagger
 * /etudiants/classe/{classe_id}:
 *   get:
 *     summary: Get students by class
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classe_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the class to retrieve students from
 *     responses:
 *       200:
 *         description: A list of students filtered by class
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
 *                   example: "Students fetched successfully by class"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Etudiant'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/classe/:classe_id', authenticate, etudiantController.getByClasse.bind(etudiantController));

/**
 * @swagger
 * /etudiants/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student to retrieve
 *     responses:
 *       200:
 *         description: Student data
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
 *                   example: "Student fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Etudiant'
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
 *   put:
 *     summary: Update a student by ID
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEtudiantRequest'
 *     responses:
 *       200:
 *         description: Student updated successfully
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
 *                   example: "Student updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Etudiant'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *   delete:
 *     summary: Delete a student by ID
 *     tags: [Etudiants]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student to delete
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
router.get('/:id', authenticate, etudiantController.getById.bind(etudiantController));
router.put('/:id', authenticate, etudiantController.update.bind(etudiantController));
router.delete('/:id', authenticate, etudiantController.delete.bind(etudiantController));

// Routes du portail étudiant
router.use('/portal', studentPortalRoutes);

module.exports = router;