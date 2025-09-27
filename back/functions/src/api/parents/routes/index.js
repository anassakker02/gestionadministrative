const router = require('express').Router();
const ParentController = require('../controllers');

/**
 * @swagger
 * components:
 *   schemas:
 *     Parent:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the parent
 *         nom:
 *           type: string
 *           description: Last name of the parent
 *         prenom:
 *           type: string
 *           description: First name of the parent
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the parent
 *         telephone:
 *           type: string
 *           description: Phone number of the parent
 *         adresse:
 *           type: string
 *           description: Address of the parent
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the parent record was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the parent record was last updated
 *     CreateParentRequest:
 *       type: object
 *       required:
 *         - nom
 *         - prenom
 *         - email
 *         - telephone
 *         - adresse
 *       properties:
 *         nom:
 *           type: string
 *         prenom:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         telephone:
 *           type: string
 *         adresse:
 *           type: string
 *     UpdateParentRequest:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         prenom:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         telephone:
 *           type: string
 *         adresse:
 *           type: string
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
 *   name: Parents
 *   description: Parent management operations
 */

/**
 * @swagger
 * /parents:
 *   post:
 *     summary: Create a new parent
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParentRequest'
 *     responses:
 *       201:
 *         description: Parent created successfully
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
 *                   example: "Parent created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
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
 *     summary: Get all parents
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of parents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of parents to skip
 *     responses:
 *       200:
 *         description: A list of parents
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
 *                   example: "Parents fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Parent'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', ParentController.create.bind(ParentController));
router.get('/', ParentController.getAll.bind(ParentController));

/**
 * @swagger
 * /parents/{id}:
 *   get:
 *     summary: Get a parent by ID
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent to retrieve
 *     responses:
 *       200:
 *         description: Parent data
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
 *                   example: "Parent fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
 *       404:
 *         description: Parent not found
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
 *     summary: Update a parent by ID
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParentRequest'
 *     responses:
 *       200:
 *         description: Parent updated successfully
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
 *                   example: "Parent updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Parent not found
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
 *     summary: Delete a parent by ID
 *     tags: [Parents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent to delete
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Parent not found
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
router.get('/:id', ParentController.getById.bind(ParentController));
router.put('/:id', ParentController.update.bind(ParentController));
router.delete('/:id', ParentController.delete.bind(ParentController));

// Routes de liaison parent-étudiant
router.post('/:id/link-student', ParentController.linkStudent.bind(ParentController));
router.get('/:id/student', ParentController.getParentStudent.bind(ParentController));
router.delete('/:id/unlink-student', ParentController.unlinkStudent.bind(ParentController));

module.exports = router;
