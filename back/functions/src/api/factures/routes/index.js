/**
 * @swagger
 * components:
 *   schemas:
 *     Facture:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the invoice
 *         student_id:
 *           type: string
 *           description: ID of the student associated with the invoice
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: ID of the parent associated with the invoice (for family invoices)
 *         date_emission:
 *           type: string
 *           format: date-time
 *           description: Date of invoice emission
 *         montant_total:
 *           type: number
 *           format: float
 *           description: Total amount of the invoice
 *         montantPaye:
 *           type: number
 *           format: float
 *           description: Amount already paid for this invoice
 *         montantRestant:
 *           type: number
 *           format: float
 *           description: Remaining amount to be paid for this invoice
 *         statut:
 *           type: string
 *           enum: [payée, impayée, partielle, annulée, avoir, rectificative]
 *           description: Status of the invoice
 *         numero_facture:
 *           type: string
 *           description: Unique invoice number
 *         pdf_url:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL to the generated PDF invoice
 *         logoUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *           description: URL to the logo used in the invoice template
 *         legalMentions:
 *           type: string
 *           nullable: true
 *           description: Legal mentions to include in the invoice
 *         termsAndConditions:
 *           type: string
 *           nullable: true
 *           description: Terms and conditions to include in the invoice
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               total:
 *                 type: number
 *               studentId:
 *                 type: string
 *                 nullable: true
 *           description: Line items of the invoice
 *         originalFactureId:
 *           type: string
 *           nullable: true
 *           description: For credit notes or rectifying invoices, the ID of the original invoice
 *         reason:
 *           type: string
 *           nullable: true
 *           description: Reason for cancellation, credit note, or rectification
 *         currency:
 *           type: string
 *           description: Currency of the invoice (e.g., MAD, EUR, USD)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the invoice was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the invoice was last updated
 *     CreateFactureRequest:
 *       type: object
 *       required:
 *         - student_id
 *         - montant_total
 *         - statut
 *         - numero_facture
 *       properties:
 *         student_id:
 *           type: string
 *         parentId:
 *           type: string
 *         date_emission:
 *           type: string
 *           format: date-time
 *         montant_total:
 *           type: number
 *           format: float
 *         statut:
 *           type: string
 *           enum: [payée, impayée, partielle, annulée, avoir, rectificative]
 *         numero_facture:
 *           type: string
 *         pdf_url:
 *           type: string
 *           format: url
 *         logoUrl:
 *           type: string
 *           format: url
 *         legalMentions:
 *           type: string
 *         termsAndConditions:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               total:
 *                 type: number
 *               studentId:
 *                 type: string
 *         currency:
 *           type: string
 *         montantPaye:
 *           type: number
 *           format: float
 *     UpdateFactureRequest:
 *       type: object
 *       properties:
 *         student_id:
 *           type: string
 *         parentId:
 *           type: string
 *         date_emission:
 *           type: string
 *           format: date-time
 *         montant_total:
 *           type: number
 *           format: float
 *         statut:
 *           type: string
 *           enum: [payée, impayée, partielle, annulée, avoir, rectificative]
 *         numero_facture:
 *           type: string
 *         pdf_url:
 *           type: string
 *           format: url
 *         logoUrl:
 *           type: string
 *           format: url
 *         legalMentions:
 *           type: string
 *         termsAndConditions:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               total:
 *                 type: number
 *               studentId:
 *                 type: string
 *         currency:
 *           type: string
 *         montantPaye:
 *           type: number
 *           format: float
 *     CancelFactureRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for cancelling the invoice
 *     CreateAvoirRequest:
 *       type: object
 *       required:
 *         - originalFactureId
 *         - montant_total
 *         - reason
 *       properties:
 *         originalFactureId:
 *           type: string
 *           description: The ID of the original invoice for which the credit note is issued
 *         student_id:
 *           type: string
 *           description: The ID of the student for whom the credit note is issued
 *         montant_total:
 *           type: number
 *           format: float
 *           description: The total amount of the credit note (should be negative)
 *         reason:
 *           type: string
 *           description: Reason for issuing the credit note
 *         date_emission:
 *           type: string
 *           format: date-time
 *         numero_facture:
 *           type: string
 *         currency:
 *           type: string
 *     CreateRectificativeFactureRequest:
 *       type: object
 *       required:
 *         - originalFactureId
 *         - updates
 *       properties:
 *         originalFactureId:
 *           type: string
 *           description: The ID of the original invoice to rectify
 *         updates:
 *           type: object
 *           description: Fields to update in the rectifying invoice. All fields in UpdateFactureRequest are valid.
 *           allOf:
 *             - $ref: '#/components/schemas/UpdateFactureRequest'
 *         reason:
 *           type: string
 *           description: Reason for issuing the rectifying invoice
 *         numero_facture:
 *           type: string
 *     CreateFamilyInvoiceRequest:
 *       type: object
 *       required:
 *         - parentId
 *       properties:
 *         parentId:
 *           type: string
 *           description: The ID of the parent for whom the consolidated invoice is generated
 *         date_emission:
 *           type: string
 *           format: date-time
 *         logoUrl:
 *           type: string
 *           format: url
 *         legalMentions:
 *           type: string
 *         termsAndConditions:
 *           type: string
 *         currency:
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
 *   name: Factures
 *   description: Invoice management operations
 */

const router = require("express").Router();
const FactureController = require('../controllers');
const { authenticate, authorize } = require('../../../middlewares/auth');

/**
 * @swagger
 * /factures:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFactureRequest'
 *     responses:
 *       201:
 *         description: Invoice created successfully
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
 *                   example: "Invoice created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Facture'
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
 *     summary: Get all invoices
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: string
 *         description: Optional student ID to filter invoices by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [payée, impayée, partielle, annulée, avoir, rectificative]
 *         description: Optional invoice status to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of invoices to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of invoices to skip
 *     responses:
 *       200:
 *         description: A list of invoices
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
 *                   example: "Invoices fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facture'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', FactureController.create.bind(FactureController));
router.get('/', FactureController.getAll.bind(FactureController));

/**
 * @swagger
 * /factures/{id}:
 *   get:
 *     summary: Get an invoice by ID
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invoice to retrieve
 *     responses:
 *       200:
 *         description: Invoice data
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
 *                   example: "Invoice fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Facture'
 *       404:
 *         description: Invoice not found
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
 *     summary: Update an invoice by ID
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invoice to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFactureRequest'
 *     responses:
 *       200:
 *         description: Invoice updated successfully
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
 *                   example: "Invoice updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Facture'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invoice not found
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
 *     summary: Delete an invoice by ID
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invoice to delete
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Invoice not found
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
router.get('/:id', FactureController.getById.bind(FactureController));
router.put('/:id', FactureController.update.bind(FactureController));
router.delete('/:id', FactureController.delete.bind(FactureController));

/**
 * @swagger
 * /factures/student/{student_id}:
 *   get:
 *     summary: Get all invoices for a specific student
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the student to retrieve invoices for
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [payée, impayée, partielle, annulée, avoir, rectificative]
 *         description: Optional invoice status to filter by
 *     responses:
 *       200:
 *         description: A list of invoices for the student
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
 *                   example: "Invoices for student fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Facture'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/student/:student_id', FactureController.getByStudent.bind(FactureController));

/**
 * @swagger
 * /factures/{id}/cancel:
 *   patch:
 *     summary: Cancel an existing invoice
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the invoice to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelFactureRequest'
 *     responses:
 *       200:
 *         description: Invoice cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or invoice already cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Invoice not found
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
router.patch('/:id/cancel', FactureController.cancelFacture.bind(FactureController));

/**
 * @swagger
 * /factures/avoir:
 *   post:
 *     summary: Create a credit note (avoir)
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAvoirRequest'
 *     responses:
 *       201:
 *         description: Credit note created successfully
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
 */
router.post('/avoir', FactureController.createAvoir.bind(FactureController));

/**
 * @swagger
 * /factures/rectificative:
 *   post:
 *     summary: Create a rectifying invoice
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRectificativeFactureRequest'
 *     responses:
 *       201:
 *         description: Rectifying invoice created successfully
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
 *         description: Original invoice not found
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
router.post('/rectificative', FactureController.createRectificativeFacture.bind(FactureController));

/**
 * @swagger
 * /factures/family-invoice:
 *   post:
 *     summary: Create a consolidated invoice for a family
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFamilyInvoiceRequest'
 *     responses:
 *       201:
 *         description: Family invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input or no students found for parent
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
 */
router.post('/family-invoice', authenticate, authorize(['admin', 'comptable']), FactureController.createFamilyInvoice.bind(FactureController));

/**
 * @swagger
 * /factures/{id}/pdf:
 *   get:
 *     summary: Generate a PDF invoice for a given ID
 *     tags: [Factures]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the invoice to generate PDF for
 *     responses:
 *       200:
 *         description: PDF invoice generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/:id/pdf', authenticate, authorize(['admin', 'comptable', 'etudiant', 'family']), FactureController.generatePdfInvoice.bind(FactureController));

module.exports = router;
