const router = require('express').Router();
const etudiantController = require('../controllers');

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
 *         exemptions:
 *           type: array
 *           items:
 *             type: string
 *           description: List of exemptions for the student
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
 *         exemptions:
 *           type: array
 *           items:
 *             type: string
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
router.post('/', etudiantController.create.bind(etudiantController));
router.get('/', etudiantController.getAll.bind(etudiantController));

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
router.get('/search', etudiantController.search.bind(etudiantController));

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
router.get('/stats', etudiantController.getStats.bind(etudiantController));

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
router.get('/classe/:classe_id', etudiantController.getByClasse.bind(etudiantController));

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
router.get('/:id', etudiantController.getById.bind(etudiantController));
router.put('/:id', etudiantController.update.bind(etudiantController));
router.delete('/:id', etudiantController.delete.bind(etudiantController));

module.exports = router;