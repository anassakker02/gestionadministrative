const express = require('express');
const router = express.Router();

router.get('/', (req,res)=> res.json({message:"Route Étudiants à implémenter"}));

module.exports = router;
