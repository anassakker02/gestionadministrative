@echo off
echo 🚀 Démarrage rapide en mode simplifié...
echo.

echo 🔧 Configuration de l'environnement...
if not exist .env (
    echo 📝 Création du fichier .env...
    echo # Configuration Firebase > .env
    echo FIREBASE_PROJECT_ID=gestionadminastration >> .env
    echo JWT_SECRET="your_jwt_secret_key_here_make_it_long_and_secure" >> .env
    echo ENCRYPTION_KEY="a_very_secure_32_byte_secret_key!" >> .env
    echo FRONTEND_URL=http://localhost:5173 >> .env
    echo ✅ Fichier .env créé
) else (
    echo ✅ Fichier .env existe déjà
)

echo.
echo 📦 Vérification des dépendances...
if not exist node_modules (
    echo 📦 Installation des dépendances...
    npm install
) else (
    echo ✅ Dépendances installées
)

echo.
echo 🔄 Activation du mode simplifié...
if exist index.js (
    copy index.js index-complex.js >nul
    echo ✅ Version complexe sauvegardée
)

if exist index-simple.js (
    copy index-simple.js index.js >nul
    echo ✅ Mode simplifié activé
) else (
    echo ❌ index-simple.js non trouvé
    pause
    exit /b 1
)

echo.
echo 🧪 Test de l'émulateur...
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo 🌐 Interface: http://localhost:4000
echo 🔧 API: http://localhost:5001
echo 📋 Test: http://localhost:5001/gestionadminastration/us-central1/api/v1/health
echo.

firebase emulators:start --only functions

echo.
echo 📴 Émulateur arrêté
pause
