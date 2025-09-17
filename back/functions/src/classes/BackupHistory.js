const admin = require('firebase-admin');

class BackupHistory {
    constructor(data) {
        this.userId = data.userId; // User who initiated the backup
        this.backupType = data.backupType; // e.g., 'manual', 'scheduled'
        this.collections = data.collections; // Array of collection names backed up
        this.storagePath = data.storagePath; // Base path in Firebase Storage for this backup
        this.status = data.status || 'pending'; // 'pending', 'completed', 'failed'
        this.timestamp = data.timestamp || admin.firestore.FieldValue.serverTimestamp();
        this.details = data.details || {}; // Additional details, e.g., error messages
    }

    toFirestore() {
        return {
            userId: this.userId,
            backupType: this.backupType,
            collections: this.collections,
            storagePath: this.storagePath,
            status: this.status,
            timestamp: this.timestamp,
            details: this.details,
        };
    }
}

module.exports = BackupHistory;
