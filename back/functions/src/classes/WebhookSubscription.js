const admin = require('firebase-admin');
const db = require('../config/firebase');

class WebhookSubscription {
    constructor(data) {
        this.id = data.id;
        this.url = data.url;
        this.events = data.events || []; // Array of event types (e.g., 'invoice.created', 'payment.succeeded')
        this.secret = data.secret; // Secret for signature verification
        this.isActive = data.isActive === undefined ? true : data.isActive;
        this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
        this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
    }

    toFirestore() {
        return {
            url: this.url,
            events: this.events,
            secret: this.secret,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = WebhookSubscription;
