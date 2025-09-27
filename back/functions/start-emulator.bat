@echo off
echo 🚀 Démarrage de l'émulateur Firebase...
echo.

REM Vérifier si Firebase CLI est installé
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI non installé
    echo 💡 Installez avec: npm install -g firebase-tools
    pause
    exit /b 1
)

echo ✅ Firebase CLI détecté
echo.

REM Vérifier si le port 5001 est utilisé
netstat -an | findstr :5001 >nul
if %errorlevel% equ 0 (
    echo ⚠️  Le port 5001 est déjà utilisé
    echo 💡 Arrêtez l'émulateur existant ou changez le port
    echo.
    echo Voulez-vous continuer quand même? (y/N)
    set /p choice=
    if /i not "%choice%"=="y" (
        echo Arrêt du script
        pause
        exit /b 1
    )
)

echo 📡 Démarrage de l'émulateur Firebase Functions...
echo 🌐 Interface: http://localhost:4000
echo 🔧 API: http://localhost:5001
echo.

REM Démarrer l'émulateur
firebase emulators:start --only functions

echo.
echo 📴 Émulateur arrêté
pause
