const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { onRequest } = require("firebase-functions/v2/https");

const server = express();
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Middleware global CORS pour toutes les routes
server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:8080");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
server.use(require("helmet")());

// ROUTES
const api = require("./src/api");
server.use("/v1", api);

exports.api = onRequest(server);
