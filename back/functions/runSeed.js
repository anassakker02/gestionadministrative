#!/usr/bin/env node

/**
 * Script pour exécuter le seed des données Firestore
 * Usage: node runSeed.js
 */

const { seedFirestore } = require('./src/utils/seedData');

async function main() {
  console.log('🚀 Démarrage du seed Firestore...');
  console.log('⚠️  ATTENTION: Ce script va vider et recréer toutes les données !');
  
  try {
    await seedFirestore();
    console.log('✅ Seed terminé avec succès !');
    console.log('📊 Données créées (version ultra simplifiée):');
    console.log('   - 1 compte admin ACTIF (admin@gmail.com / password123)');
    console.log('   - 3 comptes étudiants ACTIFS');
    console.log('   - AUCUNE autre table (classes, paiements, factures, etc.)');
    console.log('');
    console.log('🎯 Testez maintenant:');
    console.log('   - Connexion: admin@gmail.com / password123');
    console.log('   - Page des plans de paiement: /payment-plans');
    console.log('   - Tous les comptes sont ACTIFS (isActive: true)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Vérifier si on est dans le bon répertoire
if (!require('fs').existsSync('./src/utils/seedData.js')) {
  console.error('❌ Erreur: Exécutez ce script depuis le répertoire back/functions/');
  process.exit(1);
}

main();
