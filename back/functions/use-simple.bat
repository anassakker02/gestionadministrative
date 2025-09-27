@echo off
echo 🔄 Passage au mode simplifié...
echo.

echo 📝 Sauvegarde de l'index.js actuel...
if exist index.js (
    copy index.js index-complex.js >nul
    echo ✅ index.js sauvegardé comme index-complex.js
)

echo 📝 Copie de la version simplifiée...
if exist index-simple.js (
    copy index-simple.js index.js >nul
    echo ✅ Version simplifiée activée
) else (
    echo ❌ index-simple.js non trouvé
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage de l'émulateur en mode simplifié...
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo 🌐 Interface: http://localhost:4000
echo 🔧 API: http://localhost:5001
echo.

firebase emulators:start --only functions

echo.
echo 📴 Émulateur arrêté
pause
