/**
 * Serveur local de développement — bypass Firebase emulators
 * Tourne sur port 5001 pour correspondre au proxy Vite
 * Usage: node server_local.js
 */
require("dotenv").config();

const http = require("http");

// Import l'Express app depuis index.js SANS les exports Firebase
// On patch process.env avant de charger
process.env.FUNCTIONS_EMULATOR = "true";

// Mock firebase-functions pour éviter les defineSecret
const Module = require("module");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "firebase-functions/v2/https") {
    return {
      onRequest: (config, handler) => handler,
    };
  }
  if (request === "firebase-functions/params") {
    return {
      defineSecret: (name) => ({ value: () => process.env[name] || "" }),
    };
  }
  return originalLoad.apply(this, arguments);
};

const app = require("./index.js");
const server = app.api || app;

const PORT = 5001;
const PROJECT = "gestionadminastration";
const REGION = "us-central1";

// Firebase emulator URL format: /PROJECT/REGION/api
const httpServer = http.createServer((req, res) => {
  const prefix = `/${PROJECT}/${REGION}/api`;
  if (req.url.startsWith(prefix)) {
    req.url = req.url.slice(prefix.length) || "/";
  }
  server(req, res);
});

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`\n✅ Serveur local démarré sur http://127.0.0.1:${PORT}`);
  console.log(`   Endpoint: http://127.0.0.1:${PORT}/${PROJECT}/${REGION}/api`);
  console.log(`   Logs Wazuh: /tmp/app-logs/security.log\n`);
});
