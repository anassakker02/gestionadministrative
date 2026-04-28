#!/bin/bash
# ============================================================
# SCRIPT DE DÉPLOIEMENT FIREBASE — Phase 2
# Application Gestion Scolaire YNOV
# ============================================================
# Usage : chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e  # Arrêter en cas d'erreur

PROJECT_ID="frais-gestionscolaire"
REGION="us-central1"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║     DÉPLOIEMENT FIREBASE — Gestion Scolaire YNOV     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── ÉTAPE 0 : Vérifications préalables ─────────────────────────────────────
echo "▶ [0/7] Vérification des prérequis..."

command -v firebase >/dev/null 2>&1 || { echo "❌ Firebase CLI non installé. Lancez : npm install -g firebase-tools"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js non installé."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm non installé."; exit 1; }

echo "✅ Prérequis OK (Firebase CLI $(firebase --version))"

# ─── ÉTAPE 1 : Vérification connexion Firebase ───────────────────────────────
echo ""
echo "▶ [1/7] Vérification connexion Firebase..."
firebase projects:list --project $PROJECT_ID 2>&1 | grep -q "$PROJECT_ID" && echo "✅ Connecté au projet : $PROJECT_ID" || {
  echo "❌ Non connecté. Lancez : firebase login"
  exit 1
}

# ─── ÉTAPE 2 : Définir les secrets de production ─────────────────────────────
echo ""
echo "▶ [2/7] Configuration des secrets de production..."
echo "   (Copiez-collez les valeurs ci-dessous quand demandé)"
echo ""

echo "→ Définition de JWT_SECRET..."
echo "04ced7c9d60144f1aa9e9f28e1b8d9962bdcda8d633c2d0d84e9ccf75fa163d5e7ead9d58bf78f07c6fb48c4c4b578b7add9046080fa63fc66bfffe02bff4e90" | firebase functions:secrets:set JWT_SECRET --project $PROJECT_ID

echo "→ Définition de JWT_KEY_SECRET..."
echo "f30db33291b1bfd847a0dfb48990f4cfb420e2cb7befb22f74943ca83de7cd8079db68929d356af5925fd8bc01f9a8cdc4b9113923ad51bdc69a512d1669427a" | firebase functions:secrets:set JWT_KEY_SECRET --project $PROJECT_ID

echo "→ Définition de ENCRYPTION_KEY..."
echo "c845cee1a8883d32117af0e72dc1ffa432a598e04efa63a60f3af174d62dd272" | firebase functions:secrets:set ENCRYPTION_KEY --project $PROJECT_ID

echo "→ Définition de WEBHOOK_GLOBAL_SECRET..."
echo "907c86316b2b39789ab3e8954cdeb7cff2fdf08d30809665fb7290e6102316a6" | firebase functions:secrets:set WEBHOOK_GLOBAL_SECRET --project $PROJECT_ID

echo ""
echo "⚠️  EMAIL et EMAIL_PASSWORD doivent être définis manuellement :"
echo "   firebase functions:secrets:set EMAIL"
echo "   firebase functions:secrets:set EMAIL_PASSWORD"
echo ""
read -p "   Appuyez sur ENTRÉE pour continuer (ou Ctrl+C pour le faire maintenant)..."

echo "✅ Secrets configurés"

# ─── ÉTAPE 3 : Installation des dépendances backend ──────────────────────────
echo ""
echo "▶ [3/7] Installation des dépendances backend..."
cd back/functions
npm install --production
cd ../..
echo "✅ Dépendances backend installées"

# ─── ÉTAPE 4 : Build React production ────────────────────────────────────────
echo ""
echo "▶ [4/7] Build React (mode production)..."
cd front
npm install
npm run build:prod 2>/dev/null || npm run build
cd ..

# Vérifier que le dossier dist existe
if [ ! -d "front/dist" ]; then
  echo "❌ Build échoué : dossier front/dist introuvable"
  exit 1
fi
echo "✅ Build React terminé → front/dist/ ($(du -sh front/dist | cut -f1))"

# ─── ÉTAPE 5 : Déploiement Firebase Rules ────────────────────────────────────
echo ""
echo "▶ [5/7] Déploiement des règles Firestore + Storage..."
firebase deploy --only firestore:rules,firestore:indexes,storage --project $PROJECT_ID
echo "✅ Règles Firestore et Storage déployées"

# ─── ÉTAPE 6 : Déploiement des Cloud Functions ───────────────────────────────
echo ""
echo "▶ [6/7] Déploiement des Cloud Functions..."
firebase deploy --only functions --project $PROJECT_ID
echo "✅ Cloud Functions déployées"

# ─── ÉTAPE 7 : Déploiement du Hosting ────────────────────────────────────────
echo ""
echo "▶ [7/7] Déploiement Firebase Hosting (React)..."
firebase deploy --only hosting --project $PROJECT_ID
echo "✅ Hosting déployé"

# ─── Résumé ──────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ DÉPLOIEMENT TERMINÉ                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  🌐 App :  https://$PROJECT_ID.web.app    ║"
echo "║  ⚡ API :  https://$REGION-$PROJECT_ID.cloudfunctions.net/api/v1  ║"
echo "║  📊 Console : https://console.firebase.google.com       ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "▶ Vérification des headers de sécurité..."
curl -sI "https://$PROJECT_ID.web.app" 2>/dev/null | grep -E "strict-transport|content-security|x-frame|x-content-type" || echo "   (Headers vérifiables depuis le navigateur)"
echo ""
echo "🎉 Phase 2 complète — Application en production !"
