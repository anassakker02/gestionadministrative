const crypto = require('crypto');
const db = require('../config/firebase');

const WEBHOOK_SECRET_HEADER = 'X-Webhook-Signature';

const verifyWebhookSignature = (req, res, next) => {
    const signature = req.get(WEBHOOK_SECRET_HEADER);
    const webhookId = req.params.id; // Assuming webhook ID is part of the URL for verification

    if (!signature) {
        return res.status(401).send('Webhook signature missing.');
    }

    // Retrieve the webhook secret from your database based on the webhookId or other identifier
    // For now, we'll use a placeholder. In a real application, you'd fetch this from `webhookSubscriptions` collection.
    // const expectedSecret = getSecretForWebhook(webhookId);
    const expectedSecret = process.env.WEBHOOK_GLOBAL_SECRET || 'supersecretkey'; // Placeholder

    if (!expectedSecret) {
        return res.status(401).send('Webhook secret not found.');
    }

    // Re-generate the signature with the expected secret and incoming payload
    const hmac = crypto.createHmac('sha256', expectedSecret);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === signature) {
        next();
    } else {
        res.status(403).send('Invalid webhook signature.');
    }
};

module.exports = verifyWebhookSignature;
