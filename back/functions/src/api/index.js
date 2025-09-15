const app = require("express")();
// const isAuthenticated = require('../middlewares/auth'); // adapte le chemin si besoin

const boursesHandler = require("./bourses/routes");
const classesHandler = require("./classes/routes");
const echeanciersHandler = require("./echeanciers/routes");
const etudiantsHandler = require("./etudiants/routes");
const facturesHandler = require("./factures/routes");
const fraisPonctuelsHandler = require("./fraisPonctuels/routes");
const paiementsHandler = require("./paiements/routes");
const activitesHandler = require("./activites/routes");
// const enseignantsHandler = require('./enseignants/routes');
// const matieresHandler = require('./matieres/routes');

const relancesHandler = require("./relances/routes");
const tarifsHandler = require("./tarifs/routes");
const usersHandler = require("./users/routes");
const authHandler = require("./auth/routes");
const dashboardHandler = require("./dashboard/routes");

app.use("/bourses", boursesHandler);
app.use("/classes", classesHandler);
app.use("/echeanciers", echeanciersHandler);
app.use("/etudiants", etudiantsHandler);
app.use("/factures", facturesHandler);
app.use("/fraisPonctuels", fraisPonctuelsHandler);
app.use("/paiements", paiementsHandler);
app.use("/activites", activitesHandler);
// app.use('/enseignants', enseignantsHandler);
// app.use('/matieres', matieresHandler);

app.use("/relances", relancesHandler);
app.use("/tarifs", tarifsHandler);
app.use("/users", usersHandler);
app.use("/auth", authHandler);
app.use("/dashboard", dashboardHandler);

module.exports = app;
