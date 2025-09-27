const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { onRequest } = require("firebase-functions/v2/https");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");

const server = express();
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(helmet());

// ✅ Allowed origins (CORS)
const allowedOrigins = [
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

server.use(
  cors({
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    origin: function (origin, callback) {
      // En développement, accepter toutes les origines locales
      if (!origin || 
          allowedOrigins.includes(origin) ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('0.0.0.0')) {
        console.log(`✅ CORS autorisé pour: ${origin || 'no origin'}`);
        callback(null, true);
      } else {
        console.log(`❌ CORS refusé pour: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    optionsSuccessStatus: 200
  })
);



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
    version: "1.0.0"
  });
});

server.get("/v1/diagnostic", (req, res) => {
  res.json({
    status: true,
    message: "Diagnostic complet",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ✅ Routes (protected with JWT) - Chargement direct pour éviter les timeouts
server.use("/v1", authMiddleware, (req, res, next) => {
  try {
    // Charger les routes directement sans lazy loading
    const api = require("./src/api");
    api(req, res, next);
  } catch (error) {
    console.error("❌ Error in API middleware:", error);
    res.status(500).json({
      status: false,
      message: "Erreur interne du serveur",
      error: error.message
    });
  }
});

// ✅ Export as Firebase Function
exports.api = onRequest(server);