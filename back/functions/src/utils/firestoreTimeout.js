/**
 * Utilitaires pour gérer les timeouts Firestore et éviter les blocages
 */

/**
 * Wrapper pour les requêtes Firestore avec timeout
 * @param {Promise} firestorePromise - La promesse Firestore
 * @param {number} timeoutMs - Timeout en millisecondes (défaut: 10000)
 * @returns {Promise} - Promesse avec timeout
 */
function withTimeout(firestorePromise, timeoutMs = 10000) {
  return Promise.race([
    firestorePromise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Firestore query timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Wrapper pour les requêtes Firestore avec retry et timeout
 * @param {Function} queryFunction - Fonction qui retourne une promesse Firestore
 * @param {Object} options - Options de configuration
 * @returns {Promise} - Promesse avec retry et timeout
 */
async function withRetryAndTimeout(queryFunction, options = {}) {
  const {
    maxRetries = 3,
    timeoutMs = 10000,
    retryDelayMs = 1000,
    backoffMultiplier = 2
  } = options;

  let lastError;
  let delay = retryDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt}/${maxRetries} pour la requête Firestore`);
      
      const result = await withTimeout(queryFunction(), timeoutMs);
      console.log(`✅ Requête Firestore réussie (tentative ${attempt})`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Tentative ${attempt} échouée:`, error.message);
      
      if (attempt === maxRetries) {
        console.error(`💥 Toutes les tentatives échouées après ${maxRetries} essais`);
        throw new Error(`Firestore query failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Attendre avant la prochaine tentative
      console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }
  
  throw lastError;
}

/**
 * Wrapper pour les opérations batch avec timeout
 * @param {Function} batchFunction - Fonction qui retourne une promesse de batch
 * @param {number} timeoutMs - Timeout en millisecondes
 * @returns {Promise} - Promesse avec timeout
 */
function withBatchTimeout(batchFunction, timeoutMs = 15000) {
  return withTimeout(batchFunction(), timeoutMs);
}

/**
 * Vérifier la santé de la connexion Firestore
 * @returns {Promise<boolean>} - true si la connexion est saine
 */
async function checkFirestoreHealth() {
  try {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    
    // Test simple avec timeout court
    await withTimeout(
      db.collection('_health_check').limit(1).get(),
      5000
    );
    
    console.log('✅ Firestore connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection is unhealthy:', error.message);
    return false;
  }
}

module.exports = {
  withTimeout,
  withRetryAndTimeout,
  withBatchTimeout,
  checkFirestoreHealth
};
