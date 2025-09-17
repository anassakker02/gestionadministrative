/**
 * @swagger
 * components:
 *   schemas:
 *     Classe:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the class
 *         nom:
 *           type: string
 *           description: Name of the class (e.g., "L1 Informatique")
 *         niveau:
 *           type: string
 *           description: Level of the class (e.g., "Licence 1", "Master 1")
 *         capacite:
 *           type: number
 *           description: Maximum capacity of the class
 *         description:
 *           type: string
 *           description: Optional description of the class
 *         annee_scolaire:
 *           type: string
 *           description: Academic year (e.g., "2024-2025")
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the class was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the class was last updated
 *     CreateClasseRequest:
 *       type: object
 *       required:
 *         - nom
 *         - niveau
 *         - capacite
 *         - annee_scolaire
 *       properties:
 *         nom:
 *           type: string
 *         niveau:
 *           type: string
 *         capacite:
 *           type: number
 *         description:
 *           type: string
 *         annee_scolaire:
 *           type: string
 *     UpdateClasseRequest:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         niveau:
 *           type: string
 *         capacite:
 *           type: number
 *         description:
 *           type: string
 *         annee_scolaire:
 *           type: string
 *     ClasseStats:
 *       type: object
 *       properties:
 *         totalClasses:
 *           type: number
 *         classesByNiveau:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         classesByAnneeScolaire:
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
 *   name: Classes
 *   description: Class management operations
 */

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClasseRequest'
 *     responses:
 *       201:
 *         description: Class created successfully
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
 *                   example: "Class created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Classe'
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
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of classes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of classes to skip
 *     responses:
 *       200:
 *         description: A list of classes
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
 *                   example: "Classes fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classe'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const router = require('express').Router();
const classeController = require('../controllers');

// CRUD complet des classes
router.post('/', classeController.create.bind(classeController));
router.get('/', classeController.getAll.bind(classeController));

/**
 * @swagger
 * /classes/search:
 *   get:
 *     summary: Search classes by name
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nom
 *         schema:
 *           type: string
 *         description: Name or part of the name of the class to search for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of classes to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of classes to skip
 *     responses:
 *       200:
 *         description: A list of matching classes
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
 *                   example: "Classes fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classe'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', classeController.search.bind(classeController));

/**
 * @swagger
 * /classes/stats:
 *   get:
 *     summary: Get class statistics
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics
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
 *                   example: "Class statistics fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ClasseStats'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', classeController.getStats.bind(classeController));

/**
 * @swagger
 * /classes/niveau/{niveau}:
 *   get:
 *     summary: Get classes by niveau
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: niveau
 *         required: true
 *         schema:
 *           type: string
 *         description: Niveau of the classes to retrieve
 *     responses:
 *       200:
 *         description: A list of classes filtered by niveau
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
 *                   example: "Classes fetched successfully by niveau"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classe'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/niveau/:niveau', classeController.getByNiveau.bind(classeController));

/**
 * @swagger
 * /classes/annee/{annee_scolaire}:
 *   get:
 *     summary: Get classes by academic year
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: annee_scolaire
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic year of the classes to retrieve
 *     responses:
 *       200:
 *         description: A list of classes filtered by academic year
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
 *                   example: "Classes fetched successfully by academic year"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Classe'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/annee/:annee_scolaire', classeController.getByAnnee.bind(classeController));

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a class by ID
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the class to retrieve
 *     responses:
 *       200:
 *         description: Class data
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
 *                   example: "Class fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Classe'
 *       404:
 *         description: Class not found
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
 *     summary: Update a class by ID
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the class to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClasseRequest'
 *     responses:
 *       200:
 *         description: Class updated successfully
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
 *                   example: "Class updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Classe'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Class not found
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
 *     summary: Delete a class by ID
 *     tags: [Classes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the class to delete
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Class not found
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
router.get('/:id', classeController.getById.bind(classeController));
router.put('/:id', classeController.update.bind(classeController));
router.delete('/:id', classeController.delete.bind(classeController));

module.exports = router;