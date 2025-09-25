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
];

server.use(
  cors({
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
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


// ✅ Routes (protected with JWT) - Lazy loading pour éviter les timeouts
let apiRouter;
let isApiLoaded = false;

// Fonction pour charger les routes de manière paresseuse
function loadApiRoutes() {
  if (!isApiLoaded) {
    try {
      apiRouter = require("./src/api");
      isApiLoaded = true;
      console.log("✅ API routes loaded successfully");
    } catch (error) {
      console.error("❌ Error loading API routes:", error);
      throw error;
    }
  }
  return apiRouter;
}

// Middleware pour charger les routes à la demande
server.use("/v1", authMiddleware, (req, res, next) => {
  try {
    const api = loadApiRoutes();
    api(req, res, next);
  } catch (error) {
    console.error("❌ Error in API middleware:", error);
    res.status(500).json({
      status: false,
      message: "Erreur interne du serveur"
    });
  }
});

// ✅ Export as Firebase Function
exports.api = onRequest(server);