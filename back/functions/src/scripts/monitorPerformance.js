/**
 * Script de monitoring des performances en temps réel
 * Usage: node src/scripts/monitorPerformance.js
 */

const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gestionadminastration'
  });
}

const db = admin.firestore();

/**
 * Surveiller les performances de l'émulateur
 */
async function monitorPerformance() {
  console.log('🔍 Démarrage du monitoring des performances...');
  
  let requestCount = 0;
  let errorCount = 0;
  let totalResponseTime = 0;
  
  // Statistiques par minute
  const stats = {
    requests: 0,
    errors: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    firestoreQueries: 0
  };
  
  // Fonction pour afficher les statistiques
  function displayStats() {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log('\n📊 === STATISTIQUES DE PERFORMANCE ===');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📈 Requêtes/min: ${stats.requests}`);
    console.log(`❌ Erreurs/min: ${stats.errors}`);
    console.log(`⏱️  Temps de réponse moyen: ${stats.avgResponseTime}ms`);
    console.log(`🧠 Mémoire utilisée: ${memMB}MB`);
    console.log(`🔥 Requêtes Firestore/min: ${stats.firestoreQueries}`);
    console.log(`🔄 Uptime: ${Math.round(process.uptime())}s`);
    console.log('=====================================\n');
    
    // Reset stats
    stats.requests = 0;
    stats.errors = 0;
    stats.avgResponseTime = 0;
    stats.firestoreQueries = 0;
  }
  
  // Afficher les stats toutes les minutes
  setInterval(displayStats, 60000);
  
  // Test de connectivité Firestore
  async function testFirestoreConnection() {
    try {
      const startTime = Date.now();
      await db.collection('_health_check').limit(1).get();
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Firestore: ${responseTime}ms`);
      stats.firestoreQueries++;
      
      if (responseTime > 5000) {
        console.warn(`⚠️  Firestore lent: ${responseTime}ms`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur Firestore: ${error.message}`);
      stats.errors++;
    }
  }
  
  // Test de connectivité toutes les 30 secondes
  setInterval(testFirestoreConnection, 30000);
  
  // Surveillance de la mémoire
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memMB > 200) { // 200MB
      console.warn(`⚠️  Utilisation mémoire élevée: ${memMB}MB`);
    }
    
    if (memMB > 500) { // 500MB
      console.error(`🚨 Utilisation mémoire critique: ${memMB}MB`);
    }
  }, 10000);
  
  // Surveillance des erreurs non capturées
  process.on('uncaughtException', (error) => {
    console.error('💥 Erreur non capturée:', error);
    stats.errors++;
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promesse rejetée non gérée:', reason);
    stats.errors++;
  });
  
  console.log('✅ Monitoring démarré. Appuyez sur Ctrl+C pour arrêter.');
}

// Démarrer le monitoring
if (require.main === module) {
  monitorPerformance().catch(console.error);
}

module.exports = { monitorPerformance };
