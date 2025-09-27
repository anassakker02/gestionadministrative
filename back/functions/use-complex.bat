@echo off
echo 🔄 Retour au mode complexe...
echo.

echo 📝 Restauration de l'index.js complexe...
if exist index-complex.js (
    copy index-complex.js index.js >nul
    echo ✅ Version complexe restaurée
) else (
    echo ❌ index-complex.js non trouvé
    echo 💡 Vous devez d'abord utiliser use-simple.bat
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage de l'émulateur en mode complexe...
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo 🌐 Interface: http://localhost:4000
echo 🔧 API: http://localhost:5001
echo.

firebase emulators:start --only functions

echo.
echo 📴 Émulateur arrêté
pause
