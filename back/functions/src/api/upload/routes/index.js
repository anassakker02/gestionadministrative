/**
 * @swagger
 * components:
 *   schemas:
 *     UploadSuccessResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "File uploaded successfully"
 *         data:
 *           type: object
 *           properties:
 *             fileUrl:
 *               type: string
 *               format: url
 *               example: "https://firebasestorage.googleapis.com/v0/b/your-bucket.appspot.com/o/path%2Fto%2Fyour%2Ffile.jpg?alt=media"
 *             fileName:
 *               type: string
 *               example: "your-file.jpg"
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
 *   name: Upload
 *   description: File upload operations
 */

const router = require('express').Router();
const UploadController = require('../controllers');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /upload/single:
 *   post:
 *     summary: Upload a single file
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadSuccessResponse'
 *       400:
 *         description: Invalid request or no file provided
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
router.post('/single', upload.single('file'), UploadController.uploadSingleFile.bind(UploadController));

module.exports = router;
