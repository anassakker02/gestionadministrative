const app = require('express')();
// const isAuthenticated = require('../middlewares/auth'); // adapte le chemin si besoin

const boursesHandler = require('./bourses/routes');
const classesHandler = require('./classes/routes');
const echeanciersHandler = require('./echeanciers/routes');
const etudiantsHandler = require('./etudiants/routes');
const facturesHandler = require('./factures/routes');
const fraisPonctuelsHandler = require('./fraisPonctuels/routes');

const relancesHandler = require('./relances/routes');
const tarifsHandler = require('./tarifs/routes');
const usersHandler = require('./users/routes');
const authHandler = require('./auth/routes');


app.use('/bourses', boursesHandler);
app.use('/classes', classesHandler);
app.use('/echeanciers', echeanciersHandler);
app.use('/etudiants', etudiantsHandler);
app.use('/factures', facturesHandler);
app.use('/fraisPonctuels', fraisPonctuelsHandler);

app.use('/relances', relancesHandler);
app.use('/tarifs', tarifsHandler);
app.use('/users', usersHandler);
app.use('/auth', authHandler);


module.exports = app;
