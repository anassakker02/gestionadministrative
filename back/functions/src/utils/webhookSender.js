const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/firebase');

const WEBHOOK_SECRET_HEADER = 'X-Webhook-Signature';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

const generateWebhookSignature = (payload, secret) => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
};

const sendWebhook = async (eventType, data) => {
    try {
        const webhookSubscriptionsRef = db.collection('webhookSubscriptions');
        const snapshot = await webhookSubscriptionsRef
            .where('isActive', '==', true)
            .where('events', 'array-contains', eventType)
            .get();

        if (snapshot.empty) {
            console.log(`No active webhook subscriptions for event type: ${eventType}`);
            return;
        }

        for (const doc of snapshot.docs) {
            const subscription = doc.data();
            const payload = { eventType, data, timestamp: new Date().toISOString() };
            const signature = generateWebhookSignature(payload, subscription.secret);

            for (let i = 0; i <= MAX_RETRIES; i++) {
                try {
                    await axios.post(subscription.url, payload, {
                        headers: {
                            'Content-Type': 'application/json',
                            [WEBHOOK_SECRET_HEADER]: signature
                        },
                        timeout: 5000 // 5 second timeout
                    });
                    console.log(`Webhook for event ${eventType} sent successfully to ${subscription.url}`);
                    break; // Exit retry loop on success
                } catch (error) {
                    console.error(`Attempt ${i + 1} failed to send webhook for event ${eventType} to ${subscription.url}:`, error.message);
                    if (i < MAX_RETRIES) {
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, i))); // Exponential backoff
                    } else {
                        console.error(`Max retries reached for webhook event ${eventType} to ${subscription.url}. Giving up.`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in sendWebhook utility:', error);
    }
};

module.exports = { sendWebhook };
