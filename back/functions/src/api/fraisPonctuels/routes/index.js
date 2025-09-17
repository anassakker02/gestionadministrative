const router = require('express').Router();
const fraisPonctuelController = require('../controllers');

/**
 * @swagger
 * components:
 *   schemas:
 *     FraisPonctuel:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the one-time fee
 *         nom:
 *           type: string
 *           description: Name of the one-time fee
 *         montant:
 *           type: number
 *           description: Amount of the one-time fee
 *         student_id:
 *           type: string
 *           nullable: true
 *           description: ID of the student associated with this fee (if applicable)
 *         facture_id:
 *           type: string
 *           nullable: true
 *           description: ID of the invoice associated with this fee (if applicable)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the one-time fee was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the one-time fee was last updated
 *     CreateFraisPonctuelRequest:
 *       type: object
 *       required:
 *         - nom
 *         - montant
 *       properties:
 *         nom:
 *           type: string
 *         montant:
 *           type: number
 *         student_id:
 *           type: string
 *         facture_id:
 *           type: string
 *     UpdateFraisPonctuelRequest:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         montant:
 *           type: number
 *         student_id:
 *           type: string
 *         facture_id:
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
 *   name: FraisPonctuels
 *   description: One-time fee management operations
 */

/**
 * @swagger
 * /fraisPonctuels:
 *   post:
 *     summary: Create a new one-time fee
 *     tags: [FraisPonctuels]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFraisPonctuelRequest'
 *     responses:
 *       201:
 *         description: One-time fee created successfully
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
 *                   example: "One-time fee created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FraisPonctuel'
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
 *     summary: Get all one-time fees
 *     tags: [FraisPonctuels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of one-time fees to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of one-time fees to skip
 *     responses:
 *       200:
 *         description: A list of one-time fees
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
 *                   example: "One-time fees fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FraisPonctuel'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', fraisPonctuelController.create.bind(fraisPonctuelController));
router.get('/', fraisPonctuelController.getAll.bind(fraisPonctuelController));

/**
 * @swagger
 * /fraisPonctuels/{id}:
 *   get:
 *     summary: Get a one-time fee by ID
 *     tags: [FraisPonctuels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the one-time fee to retrieve
 *     responses:
 *       200:
 *         description: One-time fee data
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
 *                   example: "One-time fee fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FraisPonctuel'
 *       404:
 *         description: One-time fee not found
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
 *     summary: Update a one-time fee by ID
 *     tags: [FraisPonctuels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the one-time fee to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFraisPonctuelRequest'
 *     responses:
 *       200:
 *         description: One-time fee updated successfully
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
 *                   example: "One-time fee updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/FraisPonctuel'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: One-time fee not found
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
 *     summary: Delete a one-time fee by ID
 *     tags: [FraisPonctuels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the one-time fee to delete
 *     responses:
 *       200:
 *         description: One-time fee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: One-time fee not found
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
router.get(
  '/:id',
  fraisPonctuelController.getById.bind(fraisPonctuelController)
);
router.put(
  '/:id',
  fraisPonctuelController.update.bind(fraisPonctuelController)
);
router.delete(
  '/:id',
  fraisPonctuelController.delete.bind(fraisPonctuelController)
);

module.exports = router;
