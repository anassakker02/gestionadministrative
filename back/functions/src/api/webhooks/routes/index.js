const router = require('express').Router();
const webhookController = require('../controllers');
const verifyWebhookSignature = require('../../../middlewares/verifyWebhookSignature'); // To be uncommented once auth middleware is ready

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook subscription management
 */

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a new webhook subscription
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - events
 *               - secret
 *             properties:
 *               url:
 *                 type: string
 *                 format: url
 *                 description: The URL to send webhook notifications to
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of event types to subscribe to (e.g., ["invoice.created", "payment.succeeded"])
 *               secret:
 *                 type: string
 *                 description: A secret key to sign webhook payloads, ensuring authenticity
 *     responses:
 *       201:
 *         description: Webhook subscription created successfully
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
 *                   example: "Webhook subscription created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *                     secret:
 *                       type: string
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
 *     summary: Get all active webhook subscriptions
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of webhook subscriptions
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
 *                   example: "Webhook subscriptions fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object # Consider creating a WebhookSubscription schema
 *                     properties:
 *                       id:
 *                         type: string
 *                       url:
 *                         type: string
 *                       events:
 *                         type: array
 *                         items:
 *                           type: string
 *                       secret:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', webhookController.create.bind(webhookController));
router.get('/', webhookController.getAll.bind(webhookController));

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Get a webhook subscription by ID
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the webhook subscription to retrieve
 *     responses:
 *       200:
 *         description: Webhook subscription data
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
 *                   example: "Webhook subscription fetched successfully"
 *                 data:
 *                   type: object # Consider creating a WebhookSubscription schema
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *                     secret:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Webhook subscription not found
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
 *   put:
 *     summary: Update a webhook subscription by ID
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the webhook subscription to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: url
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               secret:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Webhook subscription updated successfully
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
 *                   example: "Webhook subscription updated successfully"
 *                 data:
 *                   type: object # Consider creating a WebhookSubscription schema
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: string
 *                     secret:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Webhook subscription not found
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
 *   delete:
 *     summary: Delete a webhook subscription by ID (soft delete)
 *     tags: [Webhooks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the webhook subscription to delete
 *     responses:
 *       200:
 *         description: Webhook subscription soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Webhook subscription not found
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
router.get('/:id', webhookController.getById.bind(webhookController));
router.put('/:id', webhookController.update.bind(webhookController));
router.delete('/:id', webhookController.delete.bind(webhookController));

/**
 * @swagger
 * /webhooks/receive/{id}:
 *   post:
 *     summary: Receive and verify a webhook payload (example endpoint)
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the webhook subscription (used to retrieve the secret for verification)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: The type of event that occurred
 *               data:
 *                 type: object
 *                 description: The payload of the event
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of when the event occurred
 *     responses:
 *       200:
 *         description: Webhook received and verified successfully
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
 *                   example: "Webhook received and verified successfully"
 *                 eventType:
 *                   type: string
 *                   example: "invoice.created"
 *                 data:
 *                   type: object
 *                   example: { "invoiceId": "inv_123", "amount": 100 }
 *       401:
 *         description: Unauthorized - Webhook signature missing or invalid secret
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Invalid webhook signature
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
router.post('/receive/:id', verifyWebhookSignature, (req, res) => {
    // If we reach here, the signature is valid
    const { eventType, data } = req.body;
    console.log(`Received verified webhook for event: ${eventType} with data:`, data);
    res.status(200).json({ status: true, message: 'Webhook received and verified successfully', eventType, data });
});

module.exports = router;
