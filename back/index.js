const express = require('express'); 
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");
require("dotenv").config();

// Middlewares
app.use(bodyParser.json());
app.use(express.json());

// Routes import
const routes = require('./src/routes/index');

// Cors
app.use(cors({
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  origin: "*",  // remplace "*" par l'URL de ton frontend pour la prod
}));

// Helmet pour sécurité HTTP
app.use(helmet());

// Dossier static (si tu veux servir des fichiers statiques)
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api', routes);

// Route par défaut si aucune route n'est trouvée
app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée" });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

