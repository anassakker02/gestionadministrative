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
    const expectedSecret = process.env.WEBHOOK_GLOBAL_SECRET;

    if (!expectedSecret) {
        console.error("[SECURITY] WEBHOOK_GLOBAL_SECRET manquant dans les variables d'environnement.");
        return res.status(500).json({ status: false, message: "Configuration serveur incorrecte." });
    }

    // Re-generate the signature with the expected secret and incoming payload
    const hmac = crypto.createHmac('sha256', expectedSecret);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    // Comparaison en temps constant — évite les timing attacks
    try {
        const sigBuffer = Buffer.from(signature, "hex");
        const genBuffer = Buffer.from(generatedSignature, "hex");
        if (sigBuffer.length === genBuffer.length && crypto.timingSafeEqual(sigBuffer, genBuffer)) {
            next();
        } else {
            res.status(403).json({ status: false, message: "Signature webhook invalide." });
        }
    } catch {
        res.status(403).json({ status: false, message: "Signature webhook invalide." });
    }
};

module.exports = verifyWebhookSignature;
