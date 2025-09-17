const jwt = require('jsonwebtoken');
const db = require('../config/firebase');

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ status: false, message: "Accès refusé. Aucun token fourni." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to the request object
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: false, message: "Token expiré.", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ status: false, message: "Token invalide.", code: "INVALID_TOKEN" });
    }
};

const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ status: false, message: "Accès refusé. Rôle utilisateur non défini." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: false, message: "Accès refusé. Vous n'avez pas la permission nécessaire." });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
