const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gestion Scolaire API',
      version: '1.0.0',
      description:
        'API pour la gestion des frais de scolarité, des étudiants, des factures, etc.',
    },
    servers: [
      {
        url: 'http://localhost:5001/gestionadminastration/europe-west1/api',
        description: 'Local development server (Firebase Functions Emulator)',
      },
      // You can add production server URLs here
    ],
    components: {
      schemas: {
        DashboardStats: {
          type: 'object',
          properties: {
            totalStudents: {
              type: 'integer',
              description: 'Total number of students',
            },
            pendingPayments: {
              type: 'string',
              description: 'Total pending payments amount',
            },
            monthlyRevenue: {
              type: 'string',
              description: 'Total monthly revenue',
            },
            unpaidInvoices: {
              type: 'string',
              description: 'Number of unpaid invoices',
            },
            totalPayments: {
              type: 'string',
              description: 'Total payments received',
            },
            totalInvoices: {
              type: 'string',
              description: 'Total number of invoices',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: "An error occurred",
            },
            error: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },
        ExportHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the export history record',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user who initiated the export',
            },
            exportType: {
              type: 'string',
              enum: ['csv', 'pdf', 'excel'],
              description: 'The type of the exported file',
            },
            fileName: {
              type: 'string',
              description: 'The name of the exported file',
            },
            filePath: {
              type: 'string',
              description: 'The path to the file in Firebase Storage',
            },
            downloadUrl: {
              type: 'string',
              format: 'url',
              description: 'The public download URL for the file',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'The status of the export operation',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The timestamp when the export record was created',
            },
          },
        },
        CustomReport: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the custom report',
            },
            name: {
              type: 'string',
              description: 'The name of the custom report',
            },
            filters: {
              type: 'object',
              description: 'JSON object representing the filters applied to the report',
            },
            columns: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of column names included in the report',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The timestamp when the report was created',
            },
            generatedBy: {
              type: 'string',
              description: 'The user who generated the report',
            },
          },
          required: ['name', 'filters', 'columns'],
        },
        BackupHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the backup history record',
            },
            userId: {
              type: 'string',
              description: 'The ID of the user who initiated the backup',
            },
            backupType: {
              type: 'string',
              enum: ['manual', 'scheduled'],
              description: 'The type of backup (manual or scheduled)',
            },
            collections: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of Firestore collection names included in the backup',
            },
            storagePath: {
              type: 'string',
              description: 'The base path in Firebase Storage where backup files are stored',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'The status of the backup operation',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'The timestamp when the backup record was created',
            },
            details: {
              type: 'object',
              description: 'Additional details about the backup, e.g., status per collection or error messages',
            },
          },
        },
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/api/**/*.js', './src/models/**/*.js', './src/classes/**/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
