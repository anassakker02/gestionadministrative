// Script pour forcer le rechargement de la configuration
console.log('🔄 Forçage du rechargement de la configuration...');

// Vider le cache du navigateur
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
    console.log('✅ Cache vidé');
  });
}

// Recharger la page
console.log('🔄 Rechargement de la page...');
window.location.reload();
