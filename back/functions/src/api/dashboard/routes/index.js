/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalStudents:
 *           type: integer
 *           description: Total number of students
 *         totalRevenue:
 *           type: number
 *           format: float
 *           description: Total revenue generated
 *         totalPayments:
 *           type: number
 *           format: float
 *           description: Total amount of payments received
 *         totalInvoices:
 *           type: integer
 *           description: Total number of invoices issued
 *         unpaidInvoicesCount:
 *           type: integer
 *           description: Number of unpaid invoices
 *         unpaidInvoicesAmount:
 *           type: number
 *           format: float
 *           description: Total amount of unpaid invoices
 *         recentActivities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               user:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *           description: A list of recent activities in the system
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
 *   name: Dashboard
 *   description: Dashboard and reporting operations
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
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
 *                   example: "Dashboard statistics fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DashboardStats'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /dashboard/export/students/csv:
 *   get:
 *     summary: Export student data to CSV
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file generated and downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const router = require('express').Router();
const dashboardController = require('../controllers');
const { authenticate, authorize } = require('../../../middlewares/auth');

router.get('/', dashboardController.getDashboardStats.bind(dashboardController));
router.get('/export/students/csv', authenticate, authorize(['admin', 'comptable']), dashboardController.exportStudentsCsv.bind(dashboardController));
router.get('/export/students/excel', authenticate, authorize(['admin', 'comptable']), dashboardController.exportStudentsExcel.bind(dashboardController));

/**
 * @swagger
 * /dashboard/exports/history:
 *   get:
 *     summary: Retrieve a list of all archived exports
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of export history records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExportHistory'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/exports/history', authenticate, authorize(['admin', 'comptable']), dashboardController.getExportHistory.bind(dashboardController));

/**
 * @swagger
 * /dashboard/exports/{id}/download:
 *   get:
 *     summary: Download an archived export file
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the export history record
 *     responses:
 *       200:
 *         description: Downloadable export file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/exports/:id/download', authenticate, authorize(['admin', 'comptable', 'etudiant', 'family']), dashboardController.downloadExport.bind(dashboardController));

module.exports = router;
