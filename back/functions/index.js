const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { onRequest } = require("firebase-functions/v2/https");
const helmet = require("helmet");

const server = express();
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(helmet());

// ✅ Allowed origins (CORS)
const allowedOrigins = ["http://localhost:8080", "http://127.0.0.1:8080"];

// CORS options: allow credentials and handle preflight globally
const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl) or from allowed dev origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

server.use(cors(corsOptions));
// Ensure preflight requests receive proper CORS headers
server.options("*", cors(corsOptions));

// Defensive CORS headers to ensure Access-Control-Allow-Credentials is always present
// server.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (origin && allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//     res.header("Vary", "Origin");
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.header("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
//     if (req.method === "OPTIONS") {
//       return res.sendStatus(204);
//     }
//   }
//   next();
// });

// ROUTES
const api = require("./src/api");
server.use("/v1", api);

exports.api = onRequest(server);
