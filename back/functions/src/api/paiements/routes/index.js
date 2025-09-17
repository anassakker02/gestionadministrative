/**
 * @swagger
 * components:
 *   schemas:
 *     Paiement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the payment
 *         facture_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of invoices associated with this payment
 *         student_id:
 *           type: string
 *           description: ID of the student making the payment
 *         date_paiement:
 *           type: string
 *           format: date-time
 *           description: Date of the payment
 *         montantPaye:
 *           type: number
 *           format: float
 *           description: Amount paid in this transaction
 *         mode:
 *           type: string
 *           description: Payment method (e.g., Virement, Carte Bancaire, Espèces, Chèque)
 *         justificatif_url:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL to the payment proof document
 *         disputeStatus:
 *           type: string
 *           enum: [none, pending, resolved, rejected]
 *           default: none
 *           description: Status of any dispute related to this payment
 *         disputeReason:
 *           type: string
 *           nullable: true
 *           description: Reason for the payment dispute
 *         refundStatus:
 *           type: string
 *           enum: [none, pending, completed, failed]
 *           default: none
 *           description: Status of any refund related to this payment
 *         refundReason:
 *           type: string
 *           nullable: true
 *           description: Reason for the refund
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the payment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the payment was last updated
 *     CreatePaiementRequest:
 *       type: object
 *       required:
 *         - student_id
 *         - montantPaye
 *         - mode
 *       properties:
 *         facture_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of invoices this payment applies to
 *         student_id:
 *           type: string
 *           description: ID of the student making the payment
 *         date_paiement:
 *           type: string
 *           format: date-time
 *           description: Date of the payment
 *         montantPaye:
 *           type: number
 *           format: float
 *           description: Amount paid in this transaction
 *         mode:
 *           type: string
 *           description: Payment method (e.g., Virement, Carte Bancaire, Espèces, Chèque)
 *         justificatif_url:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL to the payment proof document
 *     UpdatePaiementRequest:
 *       type: object
 *       properties:
 *         facture_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs of invoices this payment applies to
 *         student_id:
 *           type: string
 *           description: ID of the student making the payment
 *         date_paiement:
 *           type: string
 *           format: date-time
 *           description: Date of the payment
 *         montantPaye:
 *           type: number
 *           format: float
 *           description: Amount paid in this transaction
 *         mode:
 *           type: string
 *           description: Payment method (e.g., Virement, Carte Bancaire, Espèces, Chèque)
 *         justificatif_url:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL to the payment proof document
 *         disputeStatus:
 *           type: string
 *           enum: [none, pending, resolved, rejected]
 *         disputeReason:
 *           type: string
 *           nullable: true
 *         refundStatus:
 *           type: string
 *           enum: [none, pending, completed, failed]
 *         refundReason:
 *           type: string
 *           nullable: true
 *     InitiateDisputeRequest:
 *       type: object
 *       required:
 *         - disputeReason
 *       properties:
 *         disputeReason:
 *           type: string
 *           description: The reason for initiating the dispute
 *     ResolveDisputeRequest:
 *       type: object
 *       required:
 *         - disputeStatus
 *       properties:
 *         disputeStatus:
 *           type: string
 *           enum: [resolved, rejected]
 *           description: The new status of the dispute (resolved or rejected)
 *         resolutionDetails:
 *           type: string
 *           nullable: true
 *           description: Details about how the dispute was resolved
 *     InitiateRefundRequest:
 *       type: object
 *       required:
 *         - refundReason
 *       properties:
 *         refundReason:
 *           type: string
 *           description: The reason for initiating the refund
 *         refundAmount:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Optional. The amount to refund. If not provided, the full payment amount will be refunded.
 *     CompleteRefundRequest:
 *       type: object
 *       required:
 *         - refundStatus
 *       properties:
 *         refundStatus:
 *           type: string
 *           enum: [completed, failed]
 *           description: The new status of the refund (completed or failed)
 *         completionDetails:
 *           type: string
 *           nullable: true
 *           description: Details about the refund completion or failure
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
 *   name: Paiements
 *   description: Payment management operations
 */

const router = require('express').Router();
const paiementController = require('../controllers');

/**
 * @swagger
 * /paiements:
 *   post:
 *     summary: Create a new payment
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaiementRequest'
 *     responses:
 *       201:
 *         description: Payment created successfully
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
 *                   example: "Payment created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Paiement'
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
 *
 *   get:
 *     summary: Get all payments
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *         description: Optional student ID to filter payments by
 *       - in: query
 *         name: facture_id
 *         schema:
 *           type: string
 *         description: Optional invoice ID to filter payments by
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *         description: Optional payment mode to filter by
 *       - in: query
 *         name: disputeStatus
 *         schema:
 *           type: string
 *           enum: [none, pending, resolved, rejected]
 *         description: Optional dispute status to filter by
 *       - in: query
 *         name: refundStatus
 *         schema:
 *           type: string
 *           enum: [none, pending, completed, failed]
 *         description: Optional refund status to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of payments to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of payments to skip
 *     responses:
 *       200:
 *         description: A list of payments
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
 *                   example: "Payments fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Paiement'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', paiementController.create.bind(paiementController));
router.get('/', paiementController.getAll.bind(paiementController));

/**
 * @swagger
 * /paiements/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to retrieve
 *     responses:
 *       200:
 *         description: Payment data
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
 *                   example: "Payment fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Paiement'
 *       404:
 *         description: Payment not found
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
 *     summary: Update a payment by ID
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaiementRequest'
 *     responses:
 *       200:
 *         description: Payment updated successfully
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
 *                   example: "Payment updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Paiement'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment not found
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
 *     summary: Delete a payment by ID
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to delete
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Payment not found
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
router.get('/:id', paiementController.getById.bind(paiementController));
router.put('/:id', paiementController.update.bind(paiementController));
router.delete('/:id', paiementController.delete.bind(paiementController));

/**
 * @swagger
 * /paiements/{id}/dispute/initiate:
 *   patch:
 *     summary: Initiate a dispute for a payment
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to initiate a dispute for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateDisputeRequest'
 *     responses:
 *       200:
 *         description: Dispute initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment not found
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
 * /paiements/{id}/dispute/resolve:
 *   patch:
 *     summary: Resolve a dispute for a payment
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment with the dispute to resolve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveDisputeRequest'
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or dispute not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment or dispute not found
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
router.patch('/:id/dispute/initiate', paiementController.initiateDispute.bind(paiementController));
router.patch('/:id/dispute/resolve', paiementController.resolveDispute.bind(paiementController));

/**
 * @swagger
 * /paiements/{id}/refund/initiate:
 *   patch:
 *     summary: Initiate a refund for a payment
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to initiate a refund for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiateRefundRequest'
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment not found
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
 * /paiements/{id}/refund/complete:
 *   patch:
 *     summary: Complete or fail a refund for a payment
 *     tags: [Paiements]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment with the refund to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CompleteRefundRequest'
 *     responses:
 *       200:
 *         description: Refund completed/failed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or refund not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payment or refund not found
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
router.patch('/:id/refund/initiate', paiementController.initiateRefund.bind(paiementController));
router.patch('/:id/refund/complete', paiementController.completeRefund.bind(paiementController));

module.exports = router;