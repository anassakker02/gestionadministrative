const express = require('express');
const router = express.Router();

router.get('/', (req,res)=> res.json({message:"Route Factures à implémenter"}));

module.exports = router;
