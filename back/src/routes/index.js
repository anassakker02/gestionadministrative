const express = require('express');
const router = express.Router();

// Exemple de route GET
router.get('/', (req, res) => {
  res.json({ message: 'API Backend fonctionne !' });
});

// Exemple de route POST
router.post('/test', (req, res) => {
  const data = req.body;
  res.json({ message: 'Données reçues', data });
});

module.exports = router;

