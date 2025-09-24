const router = require('express').Router();
const paymentPlanController = require('../controllers');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the payment plan
 *         name:
 *           type: string
 *           description: Name of the payment plan (e.g., "Standard Monthly", "Annual in 3 Installments")
 *         anneeScolaire:
 *           type: string
 *           description: Academic year for which the plan is valid (e.g., "2024-2025")
 *         installments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               percentage:
 *                 type: number
 *                 description: Percentage of the total amount due for this installment
 *                 format: float
 *               dueDateOffsetMonths:
 *                 type: number
 *                 description: Number of months offset from the start of the academic year for the due date
 *               description:
 *                 type: string
 *                 description: Description of the installment (e.g., "1st Installment", "Mid-year Payment")
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the payment plan was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the payment plan was last updated
 *     CreatePaymentPlanRequest:
 *       type: object
 *       required:
 *         - name
 *         - anneeScolaire
 *         - installments
 *       properties:
 *         name:
 *           type: string
 *         anneeScolaire:
 *           type: string
 *         installments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               percentage:
 *                 type: number
 *               dueDateOffsetMonths:
 *                 type: number
 *               description:
 *                 type: string
 *     UpdatePaymentPlanRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         anneeScolaire:
 *           type: string
 *         installments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               percentage:
 *                 type: number
 *               dueDateOffsetMonths:
 *                 type: number
 *               description:
 *                 type: string
 */

/**
 * @swagger
 * tags:
 *   name: PaymentPlans
 *   description: Payment plan management operations
 */

/**
 * @swagger
 * /payment-plans:
 *   post:
 *     summary: Create a new payment plan
 *     tags: [PaymentPlans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentPlanRequest'
 *     responses:
 *       201:
 *         description: Payment plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentPlan'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all payment plans
 *     tags: [PaymentPlans]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of payment plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentPlan'
 *       500:
 *         description: Server error
 */
router.post('/', paymentPlanController.create.bind(paymentPlanController));
router.get('/', paymentPlanController.getAll.bind(paymentPlanController));

/**
 * @swagger
 * /payment-plans/{id}:
 *   get:
 *     summary: Get a payment plan by ID
 *     tags: [PaymentPlans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment plan to retrieve
 *     responses:
 *       200:
 *         description: Payment plan data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentPlan'
 *       404:
 *         description: Payment plan not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a payment plan by ID
 *     tags: [PaymentPlans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment plan to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentPlanRequest'
 *     responses:
 *       200:
 *         description: Payment plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentPlan'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Payment plan not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a payment plan by ID
 *     tags: [PaymentPlans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment plan to delete
 *     responses:
 *       204:
 *         description: Payment plan deleted successfully
 *       404:
 *         description: Payment plan not found
 *       500:
 *         description: Server error
 */
router.get('/:id', paymentPlanController.getById.bind(paymentPlanController));
router.put('/:id', paymentPlanController.update.bind(paymentPlanController));
router.delete('/:id', paymentPlanController.delete.bind(paymentPlanController));

module.exports = router;
