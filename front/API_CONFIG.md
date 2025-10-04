# Configuration API

## Développement (Émulateur Firebase)

Le frontend utilise le proxy Vite configuré dans `vite.config.ts` :

```typescript
proxy: {
  "^/gestionadminastration/.*": {
    target: "http://127.0.0.1:5001",
    changeOrigin: true,
    secure: false,
    ws: true,
  },
}
```

### URL de base utilisée
- **Développement** : `/gestionadminastration/us-central1/api/v1`
- **Production** : `VITE_API_BASE_URL` (variable d'environnement)

## Comment ça fonctionne

1. **Frontend** fait une requête vers `/gestionadminastration/us-central1/api/v1/auth/login`
2. **Proxy Vite** intercepte cette requête et la redirige vers `http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/auth/login`
3. **Émulateur Firebase** reçoit la requête et la traite

## Vérification

Pour vérifier que tout fonctionne :

1. Démarrer l'émulateur Firebase :
   ```bash
   cd back/functions
   firebase emulators:start --only functions
   ```

2. Démarrer le frontend :
   ```bash
   cd front
   npm run dev
   ```

3. Tester la connexion dans la console du navigateur :
   ```javascript
   fetch('/gestionadminastration/us-central1/api/v1/health')
     .then(r => r.json())
     .then(console.log)
   ```
