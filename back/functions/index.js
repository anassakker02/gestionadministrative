const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { onRequest } = require("firebase-functions/v2/https");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const { performanceMonitor, timeoutMiddleware } = require("./src/middlewares/performance");
const { wafMiddleware } = require("./src/middlewares/waf");

const server = express();
server.use(express.json({ limit: "1mb" }));
server.use(bodyParser.urlencoded({ extended: true, limit: "1mb" }));
server.use(helmet());
server.use(performanceMonitor);
server.use(timeoutMiddleware(28000));
server.use(wafMiddleware);

// ✅ Allowed origins (CORS)
const allowedOrigins = [
  // Production Firebase Hosting
  "https://frais-gestionscolaire.web.app",
  "https://frais-gestionscolaire.firebaseapp.com",
  // Développement local
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  // Ports alternatifs pour Vite
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // Ports Vite par défaut
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

// ─── CORS — strict en production, permissif uniquement en développement ───────
const isProd = process.env.NODE_ENV === "production";
server.use(
  cors({
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: function (origin, callback) {
      // En production : uniquement les origines explicitement autorisées
      if (isProd) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
        return;
      }
      // En développement : origines locales autorisées (liste explicite)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Limite globale : 200 req/15 min par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: "Trop de requêtes. Réessayez plus tard." },
});

// Limite stricte sur les endpoints d'authentification : 10 req/15 min par IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
  skipSuccessfulRequests: true,
  handler: async (req, res) => {
    try {
      const db = require("./src/config/firebase");
      await db.collection("auditLogs").add({
        action: "AUTH_LOCKOUT",
        timestamp: new Date(),
        metadata: {
          ip: req.ip || req.connection?.remoteAddress || null,
          email: req.body?.email || null,
          path: req.originalUrl,
        },
      });
    } catch (e) { /* silencieux */ }
    res.status(429).json({ status: false, message: "Trop de tentatives. Réessayez dans 15 minutes." });
  },
});

server.use(globalLimiter);
server.use("/v1/auth/login", authLimiter);
server.use("/v1/auth/register", authLimiter);



// ✅ JWT authentication middleware pour l'application de gestion scolaire
function authMiddleware(req, res, next) {
  // Routes publiques (pas d'authentification requise)
  const publicRoutes = [
    "/v1/auth/login",
    "/v1/auth/register", 
    "/v1/auth/forgot-password",
    "/v1/auth/reset-password",
    "/v1/auth/refresh-token"
  ];

  // Si c'est une route publique, passer directement
  if (publicRoutes.includes(req.originalUrl)) {
    return next();
  }

  // ✅ Require JWT pour toutes les autres routes
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Log ACCESS_DENIED en Firestore (asynchrone, ne bloque pas la réponse)
    try {
      const db = require("./src/config/firebase");
      db.collection("auditLogs").add({
        action: "ACCESS_DENIED",
        timestamp: new Date(),
        metadata: {
          ip: req.ip || req.connection?.remoteAddress || null,
          path: req.originalUrl,
          reason: "NO_TOKEN",
        },
      }).catch(() => {});
    } catch (e) { /* silencieux */ }
    return res.status(401).json({
      status: false,
      message: "Accès refusé. Aucun token fourni."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Log ACCESS_DENIED pour token invalide/expiré
    try {
      const db = require("./src/config/firebase");
      db.collection("auditLogs").add({
        action: "ACCESS_DENIED",
        timestamp: new Date(),
        metadata: {
          ip: req.ip || req.connection?.remoteAddress || null,
          path: req.originalUrl,
          reason: err.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
        },
      }).catch(() => {});
    } catch (e) { /* silencieux */ }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: false,
        message: "Token expiré.",
        code: "TOKEN_EXPIRED"
      });
    }
    return res.status(403).json({
      status: false,
      message: "Token invalide.",
      code: "INVALID_TOKEN"
    });
  }
}


// ✅ Routes de santé (sans authentification)
server.get("/v1/health", (req, res) => {
  res.json({
    status: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: Math.round(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB"
    }
  });
});

// ✅ Monitoring sécurité — admin uniquement
server.get("/v1/monitoring/security", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ status: false, message: "Non autorisé." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (decoded.role !== "admin") return res.status(403).json({ status: false, message: "Accès refusé." });
  } catch {
    return res.status(401).json({ status: false, message: "Token invalide." });
  }

  try {
    const db = require("./src/config/firebase");
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since1h  = new Date(now.getTime() - 60 * 60 * 1000);

    const logsSnap = await db.collection("auditLogs")
      .where("timestamp", ">=", since24h)
      .orderBy("timestamp", "desc")
      .limit(200)
      .get();

    const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const count = (type) => logs.filter(l => l.action === type || l.type === type).length;
    const since1hLogs = logs.filter(l => {
      const ts = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
      return ts >= since1h;
    });

    // ── Compteurs WAF ──────────────────────────────────────────────────────────
    const wafLogs = logs.filter(l => (l.action || l.type) === "WAF_BLOCK");
    const wafByType = {};
    wafLogs.forEach(l => {
      const reason = l.metadata?.reason || "UNKNOWN";
      wafByType[reason] = (wafByType[reason] || 0) + 1;
    });

    // ── Score de sécurité (0-100) ──────────────────────────────────────────────
    const authFailures  = count("auth_failure")  + count("AUTH_FAILURE")  + count("USER_LOGIN_FAILURE");
    const lockouts      = count("auth_lockout")  + count("AUTH_LOCKOUT");
    const accessDenied  = count("access_denied") + count("ACCESS_DENIED") + count("ACCESS_DENIED_RBAC");
    const wafBlocks     = wafLogs.length;
    let securityScore = 100;
    if (authFailures > 5)   securityScore -= Math.min(20, authFailures);
    if (lockouts > 0)        securityScore -= Math.min(15, lockouts * 5);
    if (accessDenied > 3)   securityScore -= Math.min(15, accessDenied * 2);
    if (wafBlocks > 0)       securityScore -= Math.min(20, wafBlocks * 4);
    securityScore = Math.max(0, securityScore);

    res.json({
      status: true,
      data: {
        period: "24h",
        generatedAt: now.toISOString(),
        securityScore,
        summary: {
          auth_success:   count("auth_success")   + count("AUTH_SUCCESS")  + count("USER_LOGIN_SUCCESS"),
          auth_failure:   authFailures,
          auth_lockout:   lockouts,
          access_denied:  accessDenied,
          session_expired:count("session_expired")+ count("SESSION_EXPIRED"),
          logout:         count("logout")         + count("LOGOUT"),
          data_export:    count("data_export")    + count("DATA_EXPORT"),
          data_anonymize: count("data_anonymize") + count("DATA_ANONYMIZE"),
          waf_block:      wafBlocks,
        },
        waf: {
          total:   wafBlocks,
          byType:  wafByType,
          last1h:  since1hLogs.filter(l => (l.action || l.type) === "WAF_BLOCK").length,
          blocked: wafLogs.slice(0, 10).map(l => ({
            reason:    l.metadata?.reason    || "UNKNOWN",
            path:      l.metadata?.path      || null,
            ip:        l.metadata?.ip        || null,
            userAgent: l.metadata?.userAgent || null,
            timestamp: l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : l.timestamp,
          })),
        },
        last1h: {
          auth_failure:  since1hLogs.filter(l => l.action === "auth_failure"  || l.action === "AUTH_FAILURE" || l.action === "USER_LOGIN_FAILURE").length,
          auth_lockout:  since1hLogs.filter(l => l.action === "auth_lockout"  || l.action === "AUTH_LOCKOUT").length,
          access_denied: since1hLogs.filter(l => l.action === "access_denied" || l.action === "ACCESS_DENIED").length,
        },
        alerts: {
          bruteForce:      authFailures > 20,
          accessEscalation:accessDenied > 10,
          manyLockouts:    lockouts     > 5,
          wafAttack:       wafBlocks    > 10,
        },
        recentEvents: logs.slice(0, 20).map(l => ({
          action:    l.action || l.type,
          email:     l.metadata?.email || l.email || null,
          path:      l.metadata?.path  || l.path  || null,
          role:      l.metadata?.role  || l.role  || null,
          ip:        l.metadata?.ip    || null,
          reason:    l.metadata?.reason || null,
          timestamp: l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : l.timestamp,
        })),
      }
    });
  } catch (err) {
    console.error("Monitoring error:", err.message);
    res.status(500).json({ status: false, message: "Erreur monitoring." });
  }
});

// /v1/diagnostic — réservé aux admins authentifiés uniquement
server.get("/v1/diagnostic", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ status: false, message: "Non autorisé." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ status: false, message: "Accès refusé." });
    }
  } catch {
    return res.status(401).json({ status: false, message: "Token invalide." });
  }
  res.json({
    status: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: Math.round(process.uptime()),
  });
});

// ✅ Routes (protected with JWT) - Chargement direct pour éviter les timeouts
server.use("/v1", authMiddleware, (req, res, next) => {
  try {
    // Charger les routes directement sans lazy loading
    const api = require("./src/api");
    api(req, res, next);
  } catch (error) {
    console.error("❌ Error in API middleware:", error && error.message ? error.message : error);
    res.status(500).json({
      status: false,
      message: "Erreur interne du serveur"
      // Ne pas exposer error.message ni stack trace en production
    });
  }
});

// ✅ Export as Firebase Function — avec secrets et configuration de région
const { defineSecret } = require("firebase-functions/params");

const jwtSecret = defineSecret("JWT_SECRET");
const jwtKeySecret = defineSecret("JWT_KEY_SECRET");
const encryptionKey = defineSecret("ENCRYPTION_KEY");
const webhookSecret = defineSecret("WEBHOOK_GLOBAL_SECRET");
const emailSecret = defineSecret("EMAIL");
const emailPasswordSecret = defineSecret("EMAIL_PASSWORD");

exports.api = onRequest(
  {
    region: "us-central1",
    secrets: [jwtSecret, jwtKeySecret, encryptionKey, webhookSecret, emailSecret, emailPasswordSecret],
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: false, // Géré manuellement par le middleware CORS ci-dessus
  },
  server
);