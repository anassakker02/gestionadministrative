/**
 * @swagger
 * components:
 *   schemas:
 *     Relance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the reminder
 *         facture_id:
 *           type: string
 *           description: ID of the invoice associated with the reminder
 *         dateEnvoi:
 *           type: string
 *           format: date-time
 *           description: Date when the reminder was sent
 *         type:
 *           type: string
 *           enum: [email, sms, courrier]
 *           description: Type of reminder (email, SMS, mail)
 *         statutEnvoi:
 *           type: string
 *           enum: [envoyée, échec, en_attente]
 *           description: Status of the reminder sending
 *         efficacite:
 *           type: string
 *           enum: [pending, paid_after_reminder, no_response, disputed]
 *           default: pending
 *           description: Effectiveness of the reminder
 *         dateReponse:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of response to the reminder, if any
 *         messageContent:
 *           type: string
 *           description: The content of the reminder message (for email, SMS, or call notes)
 *         periodeCible:
 *           type: string
 *           description: Target period for the payment (e.g., 'Jan-2025')
 *         montantPeriodeDu:
 *           type: number
 *           format: float
 *           description: Amount due for the target period
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the reminder was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the reminder was last updated
 *     CreateRelanceRequest:
 *       type: object
 *       required:
 *         - facture_id
 *         - dateEnvoi
 *         - type
 *       properties:
 *         facture_id:
 *           type: string
 *           description: ID of the invoice associated with the reminder
 *         dateEnvoi:
 *           type: string
 *           format: date-time
 *           description: Date when the reminder was sent
 *         type:
 *           type: string
 *           enum: [email, sms, courrier]
 *           description: Type of reminder (email, SMS, mail)
 *         statutEnvoi:
 *           type: string
 *           enum: [envoyée, échec, en_attente]
 *           description: Status of the reminder sending
 *         efficacite:
 *           type: string
 *           enum: [pending, paid_after_reminder, no_response, disputed]
 *           default: pending
 *           description: Effectiveness of the reminder
 *         dateReponse:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of response to the reminder, if any
 *         periodeCible:
 *           type: string
 *           description: Target period for the payment (e.g., 'Jan-2025')
 *         montantPeriodeDu:
 *           type: number
 *           format: float
 *           description: Amount due for the target period
 *         messageContent:
 *           type: string
 *           description: The content of the reminder message (for email, SMS, or call notes)
 *     UpdateRelanceRequest:
 *       type: object
 *       properties:
 *         facture_id:
 *           type: string
 *           description: ID of the invoice associated with the reminder
 *         dateEnvoi:
 *           type: string
 *           format: date-time
 *           description: Date when the reminder was sent
 *         type:
 *           type: string
 *           enum: [email, sms, courrier]
 *           description: Type of reminder (email, SMS, mail)
 *         statutEnvoi:
 *           type: string
 *           enum: [envoyée, échec, en_attente]
 *           description: Status of the reminder sending
 *         efficacite:
 *           type: string
 *           enum: [pending, paid_after_reminder, no_response, disputed]
 *           description: Effectiveness of the reminder
 *         dateReponse:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of response to the reminder, if any
 *         periodeCible:
 *           type: string
 *           description: Target period for the payment (e.g., 'Jan-2025')
 *         montantPeriodeDu:
 *           type: number
 *           format: float
 *           description: Amount due for the target period
 *         messageContent:
 *           type: string
 *           description: The content of the reminder message (for email, SMS, or call notes)
 *     UpdateRelanceEffectivenessRequest:
 *       type: object
 *       required:
 *         - efficacite
 *       properties:
 *         efficacite:
 *           type: string
 *           enum: [pending, paid_after_reminder, no_response, disputed]
 *           description: New effectiveness status of the reminder
 *         dateReponse:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date of response to the reminder, if applicable
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
 *   name: Relances
 *   description: Reminder management operations
 */

/**
 * @swagger
 * /relances:
 *   post:
 *     summary: Create a new reminder
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRelanceRequest'
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
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
 *     summary: Get all reminders
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facture_id
 *         schema:
 *           type: string
 *         description: Optional invoice ID to filter reminders by
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, sms, courrier]
 *         description: Optional reminder type to filter by
 *       - in: query
 *         name: statutEnvoi
 *         schema:
 *           type: string
 *           enum: [envoyée, échec, en_attente]
 *         description: Optional sending status to filter by
 *       - in: query
 *         name: efficacite
 *         schema:
 *           type: string
 *           enum: [pending, paid_after_reminder, no_response, disputed]
 *         description: Optional effectiveness status to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of reminders to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of reminders to skip
 *     responses:
 *       200:
 *         description: A list of reminders
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
 *                   example: "Reminders fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Relance'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const router = require('express').Router();
const relancesController = require('../controllers');

// CRUD complet des relances
router.post('/', relancesController.create.bind(relancesController));
router.get('/', relancesController.getAll.bind(relancesController));

/**
 * @swagger
 * /relances/{id}:
 *   get:
 *     summary: Get a reminder by ID
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reminder to retrieve
 *     responses:
 *       200:
 *         description: Reminder data
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
 *                   example: "Reminder fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Relance'
 *       404:
 *         description: Reminder not found
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
 *     summary: Update a reminder by ID
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reminder to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelanceRequest'
 *     responses:
 *       200:
 *         description: Reminder updated successfully
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
 *                   example: "Reminder updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Relance'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reminder not found
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
 *     summary: Delete a reminder by ID
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reminder to delete
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Reminder not found
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
router.get('/:id', relancesController.getById.bind(relancesController));
router.put('/:id', relancesController.update.bind(relancesController));
router.delete('/:id', relancesController.delete.bind(relancesController));

/**
 * @swagger
 * /relances/{id}/effectiveness:
 *   patch:
 *     summary: Update the effectiveness of a reminder
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reminder to update effectiveness for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelanceEffectivenessRequest'
 *     responses:
 *       200:
 *         description: Reminder effectiveness updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reminder not found
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
router.patch('/:id/effectiveness', relancesController.updateRelanceEffectiveness.bind(relancesController));

/**
 * @swagger
 * /relances/send-email:
 *   post:
 *     summary: Send a reminder email
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - relanceId
 *               - to
 *               - subject
 *               - messageContent
 *             properties:
 *               relanceId:
 *                 type: string
 *                 description: ID of the reminder to send the email for
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *               subject:
 *                 type: string
 *                 description: Subject of the email
 *               messageContent:
 *                 type: string
 *                 description: HTML content of the email message
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reminder not found
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
router.post('/send-email', relancesController.sendEmailReminder.bind(relancesController));

/**
 * @swagger
 * /relances/send-message:
 *   post:
 *     summary: Send a reminder message (e.g., SMS)
 *     tags: [Relances]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - relanceId
 *               - messageContent
 *             properties:
 *               relanceId:
 *                 type: string
 *                 description: ID of the reminder to send the message for
 *               messageContent:
 *                 type: string
 *                 description: Content of the message
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reminder not found
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
router.post('/send-message', relancesController.sendMessageReminder.bind(relancesController));

module.exports = router;
