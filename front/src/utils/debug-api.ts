// Script de debug pour vérifier la configuration API
export const debugAPI = () => {
  console.log('🔍 Debug de la configuration API...\n');
  
  // Vérifier l'URL de base
  const baseURL = import.meta.env.VITE_API_BASE_URL || "/gestionadminastration/us-central1/api/v1";
  console.log('📡 URL de base:', baseURL);
  
  // Vérifier les variables d'environnement
  console.log('🌍 Variables d\'environnement:');
  console.log('  - VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('  - NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('  - MODE:', import.meta.env.MODE);
  
  // Test de l'URL de base
  console.log('\n🧪 Test de l\'URL de base...');
  console.log('URL complète pour /auth/login:', baseURL + '/auth/login');
  
  // Vérifier si c'est une URL relative ou absolue
  if (baseURL.startsWith('http')) {
    console.log('⚠️  URL absolue détectée - le proxy Vite ne fonctionnera pas');
  } else {
    console.log('✅ URL relative détectée - le proxy Vite devrait fonctionner');
  }
  
  return {
    baseURL,
    isRelative: !baseURL.startsWith('http'),
    env: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    }
  };
};

// Fonction pour tester la requête
export const testRequest = async (url: string) => {
  console.log(`🧪 Test de requête vers: ${url}`);
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('✅ Succès:', data);
    return { success: true, data };
  } catch (error) {
    console.log('❌ Erreur:', error);
    return { success: false, error };
  }
};

// Fonction pour tester le proxy
export const testProxy = async () => {
  console.log('🔍 Test du proxy Vite...\n');
  
  const tests = [
    '/gestionadminastration/us-central1/api/v1/health',
    'http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/health',
    'http://localhost:5001/gestionadminastration/us-central1/api/v1/health'
  ];
  
  for (const testUrl of tests) {
    console.log(`🧪 Test: ${testUrl}`);
    const result = await testRequest(testUrl);
    if (result.success) {
      console.log('✅ Ce test fonctionne!');
      return { success: true, workingUrl: testUrl };
    }
  }
  
  console.log('❌ Aucun test n\'a fonctionné');
  return { success: false };
};

// Fonction globale pour le debug
(window as any).debugAPI = debugAPI;
(window as any).testRequest = testRequest;
(window as any).testProxy = testProxy;
