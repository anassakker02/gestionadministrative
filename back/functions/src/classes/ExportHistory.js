const admin = require('firebase-admin');

class ExportHistory {
    constructor(data) {
        this.userId = data.userId;
        this.exportType = data.exportType; // e.g., 'csv', 'pdf', 'excel'
        this.fileName = data.fileName;
        this.filePath = data.filePath; // Path in Firebase Storage
        this.downloadUrl = data.downloadUrl || null; // Public download URL
        this.status = data.status || 'completed'; // e.g., 'pending', 'completed', 'failed'
        this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    }

    toFirestore() {
        return {
            userId: this.userId,
            exportType: this.exportType,
            fileName: this.fileName,
            filePath: this.filePath,
            downloadUrl: this.downloadUrl,
            status: this.status,
            createdAt: this.createdAt,
        };
    }
}

module.exports = ExportHistory;
