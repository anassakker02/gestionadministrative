const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../../swagger");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const { authenticate, authorize } = require("../middlewares/auth");

const boursesHandler = require("./bourses/routes");
const classesHandler = require("./classes/routes");
const echeanciersHandler = require("./echeanciers/routes");
const etudiantsHandler = require("./etudiants/routes");
const facturesHandler = require("./factures/routes");
const fraisPonctuelsHandler = require("./fraisPonctuels/routes");
const paiementsHandler = require("./paiements/routes");
const activitesHandler = require("./activites/routes");
const relancesHandler = require("./relances/routes");
const tarifsHandler = require("./tarifs/routes");
const usersHandler = require("./users/routes");
const authHandler = require("./auth/routes");
const dashboardHandler = require("./dashboard/routes");
const parentsHandler = require("./parents/routes");
const uploadHandler = require("./upload/routes");
const webhooksHandler = require("./webhooks/routes");
const backupHandler = require("./backup/routes");
const paymentPlansHandler = require("./payment_plans/routes");

const app = express();

// Aligner la config CORS interne sur celle du serveur racine (autoriser 8080/8081/5173 et IPs privées en dev)
const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const privateIpRegex = /^http:\/\/(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./;
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // autoriser les requêtes sans origin
    if (allowedOrigins.includes(origin) || privateIpRegex.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/bourses", authenticate, authorize(["admin"]), boursesHandler);
app.use("/classes", authenticate, authorize(["admin"]), classesHandler);
app.use("/echeanciers", authenticate, authorize(["admin"]), echeanciersHandler);
app.use(
  "/etudiants",
  authenticate,
  authorize(["admin", "sous-admin"]),
  etudiantsHandler
);
app.use(
  "/factures",
  authenticate,
  authorize(["admin", "comptable", "etudiant", "parent"]),
  facturesHandler
);
app.use(
  "/fraisPonctuels",
  authenticate,
  authorize(["admin"]),
  fraisPonctuelsHandler
);
app.use(
  "/paiements",
  authenticate,
  authorize(["admin", "comptable", "etudiant", "parent"]),
  paiementsHandler
);
app.use("/activites", authenticate, authorize(["admin"]), activitesHandler);
app.use("/relances", authenticate, authorize(["admin"]), relancesHandler);
app.use(
  "/tarifs",
  authenticate,
  authorize(["admin", "comptable"]),
  tarifsHandler
);
app.use("/users", authenticate, authorize(["admin"]), usersHandler);

app.use("/auth", authHandler);
app.use("/dashboard", authenticate, authorize(["admin"]), dashboardHandler);
app.use(
  "/parents",
  authenticate,
  authorize(["admin", "sous-admin"]),
  parentsHandler
);
app.use("/upload", authenticate, authorize(["admin"]), uploadHandler);
app.use("/webhooks", authenticate, authorize(["admin"]), webhooksHandler);
app.use("/backup", authenticate, authorize(["admin"]), backupHandler);
app.use("/payment-plans", authenticate, authorize(["admin"]), paymentPlansHandler);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
