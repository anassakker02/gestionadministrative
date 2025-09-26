/**
 * Middleware de monitoring des performances pour éviter les blocages
 */

/**
 * Middleware pour surveiller les temps de réponse des requêtes
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next function
 */
function performanceMonitor(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send pour capturer le temps de réponse
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log des performances
    console.log(`⏱️  ${req.method} ${req.path} - ${duration}ms - ${res.statusCode}`);
    
    // Alerte si la requête prend trop de temps
    if (duration > 10000) { // 10 secondes
      console.warn(`⚠️  Requête lente détectée: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    if (duration > 30000) { // 30 secondes
      console.error(`🚨 Requête très lente: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Appeler la fonction send originale
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Middleware pour limiter le temps d'exécution des fonctions
 * @param {number} maxDuration - Durée maximale en millisecondes
 * @returns {Function} - Middleware function
 */
function timeoutMiddleware(maxDuration = 30000) {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏰ Timeout de ${maxDuration}ms atteint pour ${req.method} ${req.path}`);
        res.status(408).json({
          status: false,
          message: 'Request timeout',
          error: 'TIMEOUT'
        });
      }
    }, maxDuration);
    
    // Nettoyer le timeout si la réponse est envoyée
    const originalSend = res.send;
    res.send = function(data) {
      clearTimeout(timeout);
      originalSend.call(this, data);
    };
    
    next();
  };
}

/**
 * Middleware pour surveiller l'utilisation mémoire
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function memoryMonitor(req, res, next) {
  const memBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const memAfter = process.memoryUsage();
    const memDiff = {
      rss: memAfter.rss - memBefore.rss,
      heapUsed: memAfter.heapUsed - memBefore.heapUsed,
      heapTotal: memAfter.heapTotal - memBefore.heapTotal,
      external: memAfter.external - memBefore.external
    };
    
    // Log si utilisation mémoire importante
    if (memDiff.heapUsed > 50 * 1024 * 1024) { // 50MB
      console.warn(`⚠️  Utilisation mémoire élevée: ${Math.round(memDiff.heapUsed / 1024 / 1024)}MB`);
    }
    
    console.log(`🧠 Mémoire: +${Math.round(memDiff.heapUsed / 1024)}KB pour ${req.method} ${req.path}`);
  });
  
  next();
}

/**
 * Middleware pour surveiller les connexions Firestore
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
function firestoreMonitor(req, res, next) {
  let firestoreQueries = 0;
  const startTime = Date.now();
  
  // Intercepter les appels Firestore (approximation)
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Firestore')) {
      firestoreQueries++;
    }
    originalConsoleLog.apply(console, args);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`🔥 Firestore: ${firestoreQueries} requêtes en ${duration}ms pour ${req.method} ${req.path}`);
    
    // Restaurer console.log
    console.log = originalConsoleLog;
    
    // Alerte si trop de requêtes
    if (firestoreQueries > 20) {
      console.warn(`⚠️  Beaucoup de requêtes Firestore: ${firestoreQueries}`);
    }
  });
  
  next();
}

module.exports = {
  performanceMonitor,
  timeoutMiddleware,
  memoryMonitor,
  firestoreMonitor
};
