const express = require("express");
const cors = require("cors");
const { onRequest } = require("firebase-functions/v2/https");
const jwt = require("jsonwebtoken");

console.log('🚀 Démarrage du serveur simplifié...');

const server = express();

// Configuration CORS permissive pour le développement
server.use(cors({
  origin: true,
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));

server.use(express.json());

// Route de santé
server.get("/v1/health", (req, res) => {
  console.log('✅ Health check appelé');
  res.json({
    status: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Route de diagnostic
server.get("/v1/diagnostic", (req, res) => {
  console.log('✅ Diagnostic appelé');
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

// Route de test de connexion
server.get("/v1/test", (req, res) => {
  console.log('✅ Test endpoint appelé');
  res.json({
    status: true,
    message: "Test endpoint working",
    data: { 
      test: "success",
      timestamp: new Date().toISOString()
    }
  });
});

// Route de login simple pour test
server.post("/v1/auth/login", (req, res) => {
  console.log('🔐 Login appelé');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      status: false,
      message: "Email et mot de passe requis"
    });
  }
  
  // Login simple pour test (admin par défaut)
  if (email === "admin@gmail.com" && password === "password123") {
    const token = jwt.sign(
      { 
        id: "admin_user", 
        email: "admin@gmail.com", 
        role: "admin" 
      },
      "your_jwt_secret_key_here_make_it_long_and_secure",
      { expiresIn: "1h" }
    );
    
    return res.json({
      status: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: "admin_user",
          email: "admin@gmail.com",
          role: "admin"
        }
      }
    });
  }
  
  res.status(401).json({
    status: false,
    message: "Identifiants incorrects"
  });
});

// Route pour récupérer les utilisateurs (test)
server.get("/v1/users", (req, res) => {
  console.log('👥 Users endpoint appelé');
  res.json({
    status: true,
    data: [
      {
        id: "admin_user",
        email: "admin@gmail.com",
        role: "admin",
        isActive: true
      }
    ]
  });
});

// Middleware d'authentification simple
function simpleAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      status: false, 
      message: "Token requis" 
    });
  }

  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key_here_make_it_long_and_secure");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ 
      status: false, 
      message: "Token invalide" 
    });
  }
}

// Routes protégées
server.get("/v1/users/pending", simpleAuth, (req, res) => {
  console.log('👥 Pending users appelé');
  res.json({
    status: true,
    data: []
  });
});

// Export as Firebase Function
exports.api = onRequest(server);

console.log('✅ Serveur simplifié configuré');
console.log('🌐 Endpoints disponibles:');
console.log('   - GET  /v1/health');
console.log('   - GET  /v1/diagnostic');
console.log('   - GET  /v1/test');
console.log('   - POST /v1/auth/login');
console.log('   - GET  /v1/users');
console.log('   - GET  /v1/users/pending (protégé)');
console.log('\n💡 Pour tester:');
console.log('   firebase emulators:start --only functions');
console.log('   curl http://localhost:5001/gestionadminastration/us-central1/api/v1/health');
