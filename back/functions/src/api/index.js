const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../swagger');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");

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

const app = express();

app.use(cors({ origin: ["http://localhost:8080", "http://127.0.0.1:8080"], credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/bourses", boursesHandler);
app.use("/classes", classesHandler);
app.use("/echeanciers", echeanciersHandler);
app.use("/etudiants", etudiantsHandler);
app.use("/factures", facturesHandler);
app.use("/fraisPonctuels", fraisPonctuelsHandler);
app.use("/paiements", paiementsHandler);
app.use("/activites", activitesHandler);
app.use("/relances", relancesHandler);
app.use("/tarifs", tarifsHandler);
app.use("/users", usersHandler);
app.use("/auth", authHandler);
app.use("/dashboard", dashboardHandler);
app.use("/parents", parentsHandler);
app.use("/upload", uploadHandler);
app.use("/webhooks", webhooksHandler);
app.use("/backup", backupHandler);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app;
