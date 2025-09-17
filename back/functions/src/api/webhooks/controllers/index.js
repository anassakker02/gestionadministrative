const admin = require('firebase-admin');
const db = require('../../../config/firebase');
const WebhookSubscription = require('../../../classes/WebhookSubscription');
const AuditLog = require('../../../classes/AuditLog');

class WebhookController {
    constructor() {
        this.collection = db.collection('webhookSubscriptions');
    }

    async create(req, res) {
        try {
            const { url, events, secret } = req.body;

            if (!url || !events || !Array.isArray(events) || events.length === 0) {
                return res.status(400).send({ status: false, message: 'URL and events are required.' });
            }

            const newSubscriptionRef = this.collection.doc();
            const newSubscription = new WebhookSubscription({ id: newSubscriptionRef.id, url, events, secret });
            await newSubscriptionRef.set(newSubscription.toFirestore());

            await AuditLog.log(req.user.id, 'create', 'WebhookSubscription', newSubscriptionRef.id, 'Webhook subscription created', { url, events });

            res.status(201).send({ status: true, message: 'Webhook subscription created successfully', data: { id: newSubscriptionRef.id, ...newSubscription.toFirestore() } });
        } catch (error) {
            console.error('Error creating webhook subscription:', error);
            res.status(500).send({ status: false, message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const snapshot = await this.collection.where('isActive', '==', true).get();
            const subscriptions = snapshot.docs.map(doc => new WebhookSubscription({ id: doc.id, ...doc.data() }));
            res.status(200).send({ status: true, message: 'Webhook subscriptions fetched successfully', data: subscriptions });
        } catch (error) {
            console.error('Error fetching webhook subscriptions:', error);
            res.status(500).send({ status: false, message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const doc = await this.collection.doc(id).get();

            if (!doc.exists || !doc.data().isActive) {
                return res.status(404).send({ status: false, message: 'Webhook subscription not found.' });
            }

            res.status(200).send({ status: true, message: 'Webhook subscription fetched successfully', data: new WebhookSubscription({ id: doc.id, ...doc.data() }) });
        } catch (error) {
            console.error('Error fetching webhook subscription by ID:', error);
            res.status(500).send({ status: false, message: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { url, events, secret, isActive } = req.body;

            const docRef = this.collection.doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).send({ status: false, message: 'Webhook subscription not found.' });
            }

            const updates = {};
            if (url !== undefined) updates.url = url;
            if (events !== undefined && Array.isArray(events)) updates.events = events;
            if (secret !== undefined) updates.secret = secret;
            if (isActive !== undefined) updates.isActive = isActive;
            updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

            await docRef.update(updates);

            await AuditLog.log(req.user.id, 'update', 'WebhookSubscription', id, 'Webhook subscription updated', updates);

            res.status(200).send({ status: true, message: 'Webhook subscription updated successfully', data: { id, ...updates } });
        } catch (error) {
            console.error('Error updating webhook subscription:', error);
            res.status(500).send({ status: false, message: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const docRef = this.collection.doc(id);
            const doc = await docRef.get();

            if (!doc.exists) {
                return res.status(404).send({ status: false, message: 'Webhook subscription not found.' });
            }
            
            // Soft delete
            await docRef.update({ isActive: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

            await AuditLog.log(req.user.id, 'delete', 'WebhookSubscription', id, 'Webhook subscription soft-deleted');

            res.status(200).send({ status: true, message: 'Webhook subscription soft-deleted successfully' });
        } catch (error) {
            console.error('Error deleting webhook subscription:', error);
            res.status(500).send({ status: false, message: error.message });
        }
    }
}

module.exports = new WebhookController();
