#!/usr/bin/env bash
# ============================================================
#  DEMO SOUTENANCE — PFE Cybersécurité YNOV 2026
#  Anass Akker / Amine BAHOU
#  Usage : bash demo_soutenance.sh [etape]
#  Ex    : bash demo_soutenance.sh 1   → lance l'étape 1
#          bash demo_soutenance.sh all → lance tout en séquence
# ============================================================

BASE="/Users/anass/Downloads/frais-gestionScolaire 4"
API="http://localhost:5001/gestionadminastration/us-central1/api"

color_red()    { echo -e "\033[0;31m$*\033[0m"; }
color_green()  { echo -e "\033[0;32m$*\033[0m"; }
color_yellow() { echo -e "\033[0;33m$*\033[0m"; }
color_cyan()   { echo -e "\033[0;36m$*\033[0m"; }
color_purple() { echo -e "\033[0;35m$*\033[0m"; }
sep()          { echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; echo ""; }

# ────────────────────────────────────────────────────────────
etape_0() {
  color_red "🔴 ÉTAPE 0 — DÉMARRAGE"
  sep
  echo "▶ Terminal 1 — Backend (node server_local.js)"
  echo "   cd \"$BASE/back/functions\""
  echo "   node server_local.js"
  echo "   → Attendu : Express running on http://localhost:5001"
  sep
  echo "▶ Terminal 2 — Frontend (npm run dev)"
  echo "   cd \"$BASE/front\""
  echo "   npm run dev"
  echo "   → Attendu : Local: http://localhost:8081/"
  sep
  echo "▶ Terminal 3 — Wazuh Docker"
  echo "   ln -sf \"$BASE/front/wazuh-docker/single-node\" /tmp/wazuh-node"
  echo "   cd /tmp/wazuh-node"
  echo "   docker compose up -d"
  echo "   docker compose ps"
  echo "   → Ouvrir : https://localhost  |  admin / SecretPassword"
}

# ────────────────────────────────────────────────────────────
etape_1() {
  color_red "🛡️  ÉTAPE 1 — WAF — Injection SQL bloquée (OWASP A03)"
  sep
  echo "Test SQLi en cours..."
  RESP=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API}/etudiants?id=1%20OR%201=1")
  if [ "$RESP" = "403" ]; then
    color_green "✅ Réponse HTTP: $RESP — WAF bloque l'injection SQL"
  else
    color_yellow "⚠️  Réponse HTTP: $RESP (attendu 403 — backend démarré ?)"
  fi
  sep
  color_cyan "À dire au jury :"
  echo "  'Le WAF intercepte la requête AVANT qu'elle touche la BDD.'"
  echo "  'HTTP 403 + WAF_BLOCK loggué dans Firestore auditLogs.'"
}

# ────────────────────────────────────────────────────────────
etape_2() {
  color_red "🛡️  ÉTAPE 2 — WAF — XSS bloqué (OWASP A03)"
  sep
  echo "Test XSS en cours..."
  RESP=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API}/etudiants?nom=%3Cscript%3Ealert(1)%3C/script%3E")
  if [ "$RESP" = "403" ]; then
    color_green "✅ Réponse HTTP: $RESP — WAF bloque le XSS"
  else
    color_yellow "⚠️  Réponse HTTP: $RESP (attendu 403)"
  fi
  sep
  color_cyan "À dire au jury :"
  echo "  'La balise <script> est bloquée immédiatement. OWASP A03.'"
}

# ────────────────────────────────────────────────────────────
etape_3() {
  color_red "🔐 ÉTAPE 3 — Brute Force → Lockout (OWASP A07)"
  sep
  echo "6 tentatives de connexion avec mauvais mot de passe..."
  echo ""
  for i in {1..6}; do
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "${API}/auth/login" \
      -H 'Content-Type: application/json' \
      -d '{"email":"admin@school.fr","password":"WRONG"}')
    if [ "$RESP" = "429" ]; then
      color_red "  Tentative $i → HTTP $RESP ← AUTH_LOCKOUT ✅"
    elif [ "$RESP" = "401" ]; then
      color_yellow "  Tentative $i → HTTP $RESP (échec normal)"
    else
      echo "  Tentative $i → HTTP $RESP"
    fi
    sleep 0.3
  done
  sep
  color_cyan "À dire au jury :"
  echo "  'Après 5 échecs, le compte est verrouillé 15 minutes.'"
  echo "  'AUTH_LOCKOUT loggué dans Firestore avec IP + timestamp.'"
}

# ────────────────────────────────────────────────────────────
etape_4() {
  color_red "🔍 ÉTAPE 4 — Scanner DAST automatique (12 tests OWASP)"
  sep
  cd "$BASE/back/functions" && node scripts/security_scan.js
  sep
  color_cyan "À dire au jury :"
  echo "  'Ce script automatise tous les tests OWASP Top 10.'"
  echo "  '11/12 réussis, 1 warning CORS non critique → score 92/100.'"
}

# ────────────────────────────────────────────────────────────
etape_5() {
  color_red "🔒 ÉTAPE 5 — Chiffrement AES-256-CBC"
  sep
  echo "Démonstration chiffrement/déchiffrement en direct..."
  echo ""
  cd "$BASE/back/functions" && node -e "
const enc = require('./src/utils/encryption');
const original = 'donnee-sensible-RGPD';
const chiffre  = enc.encrypt(original);
const dechiffre = enc.decrypt(chiffre);
console.log('Original  :', original);
console.log('Chiffré   :', chiffre);
console.log('Déchiffré :', dechiffre);
console.log('IV unique :', chiffre.split(':')[0]);
console.log('Égaux ?   :', original === dechiffre ? '✅ OUI' : '❌ NON');
"
  sep
  color_cyan "À dire au jury :"
  echo "  'Chaque chiffrement génère un IV aléatoire différent.'"
  echo "  'Format : iv_hex:ciphertext_hex stocké dans Firestore.'"
  echo "  'Sans la clé ENCRYPTION_KEY → déchiffrement impossible.'"
}

# ────────────────────────────────────────────────────────────
etape_6() {
  color_red "🔑 ÉTAPE 6 — Headers Sécurité HTTP (Helmet.js)"
  sep
  echo "Vérification des headers de sécurité..."
  echo ""
  curl -s -I "${API}/auth/login" 2>/dev/null | grep -iE \
    "strict-transport|x-frame|x-content-type|content-security|x-dns" \
    | while read line; do color_green "  ✅ $line"; done
  sep
  color_cyan "À dire au jury :"
  echo "  'HSTS force HTTPS pendant 1 an.'"
  echo "  'X-Frame: DENY = protection anti-clickjacking.'"
  echo "  'CSP default-src self = pas de scripts externes.'"
}

# ────────────────────────────────────────────────────────────
etape_7() {
  color_red "📊 ÉTAPE 7 — Dashboard /monitoring (Score 100/100)"
  sep
  echo "Ouverture du dashboard monitoring dans le navigateur..."
  open "http://localhost:8081/monitoring" 2>/dev/null || \
    echo "  → Ouvrir manuellement : http://localhost:8081/monitoring"
  sep
  color_cyan "Points à montrer au jury :"
  echo "  1. Score 100/100 en haut à droite"
  echo "  2. Onglet 'WAF' → 0 attaques (ou montrer les WAF_BLOCK)"
  echo "  3. Onglet 'SIEM Logs' → 20 derniers événements Firestore"
  echo "  4. Alertes auto : >20 auth failures → CRITIQUE"
}

# ────────────────────────────────────────────────────────────
etape_8() {
  color_purple "🟣 ÉTAPE 8 — Wazuh SIEM Dashboard"
  sep
  echo "Ouverture du dashboard Wazuh..."
  open "https://localhost" 2>/dev/null || \
    echo "  → Ouvrir manuellement : https://localhost"
  sep
  color_cyan "Login : admin / SecretPassword"
  echo ""
  color_cyan "Points à montrer au jury :"
  echo "  1. Agents → main-machine → Active ✅"
  echo "  2. Security Events → 436 420 events"
  echo "  3. File Integrity → Rule 550 Level 7 → root 89.44%"
  echo "  4. MITRE ATT&CK → T1565.001 dominant (~95%)"
  echo "  5. Policy Monitoring → Rootcheck → 4 anomalies"
  echo "  6. Vulnerabilities → 17 CVE → CVE-2019-5736 CVSS3=8.6"
}

# ────────────────────────────────────────────────────────────
etape_9() {
  color_purple "🧬 ÉTAPE 9 — FIM — Déclencher alerte Rule 550 Level 7"
  sep
  color_yellow "⚠️  Cette commande modifie /etc/hosts (besoin sudo)"
  echo ""
  echo "Commande à exécuter :"
  color_red "  sudo bash -c \"echo '# wazuh-test-$(date +%s)' >> /private/etc/hosts\""
  echo ""
  echo "Puis dans Wazuh :"
  echo "  → Security Events → Rule 550 → Integrity checksum changed"
  echo "  → T1565.001 Stored Data Manipulation"
  sep
  read -p "Exécuter maintenant ? (o/N) : " confirm
  if [[ "$confirm" =~ ^[oO]$ ]]; then
    sudo bash -c "echo '# wazuh-test-$(date +%s)' >> /private/etc/hosts"
    color_green "✅ Fichier modifié — Vérifier Wazuh dans 30 secondes"
  else
    echo "Commande non exécutée."
  fi
  sep
  color_cyan "À dire au jury :"
  echo "  'Wazuh détecte instantanément toute modification de fichier système.'"
  echo "  'Rootkit ou backdoor = détection immédiate Rule 550 Level 7.'"
}

# ────────────────────────────────────────────────────────────
etape_10() {
  color_purple "🇪🇺 ÉTAPE 10 — RGPD — Traçabilité Art.5 & Art.32"
  sep
  echo "1. Ouvrir un onglet privé → mauvais mot de passe"
  open -a "Brave Browser" --args --incognito "http://localhost:8081/login" \
    2>/dev/null || open "http://localhost:8081/login" 2>/dev/null || \
    echo "   → Ouvrir manuellement : http://localhost:8081/login"
  echo ""
  echo "2. Entrer un mauvais mot de passe → AUTH_FAILURE loggué"
  echo ""
  echo "3. Revenir sur le dashboard monitoring :"
  echo "   → Onglet SIEM Logs → Rafraîchir"
  echo "   → AUTH_FAILURE visible : email + IP + timestamp"
  sep
  color_cyan "À dire au jury :"
  echo "  'Chaque échec est tracé avec horodatage serverTimestamp().'"
  echo "  'Logs infalsifiables : allow update/delete: if false en Firestore.'"
  echo "  'Conformité RGPD Art.5 (intégrité) + Art.32 (sécurité traitement).'"
}

# ────────────────────────────────────────────────────────────
show_help() {
  echo ""
  color_cyan "╔════════════════════════════════════════════════╗"
  color_cyan "║   DEMO SOUTENANCE — PFE Cybersécurité 2026    ║"
  color_cyan "╚════════════════════════════════════════════════╝"
  echo ""
  echo "  bash demo_soutenance.sh 0    → Démarrage (Backend+Front+Wazuh)"
  echo "  bash demo_soutenance.sh 1    → WAF SQLi bloquée"
  echo "  bash demo_soutenance.sh 2    → WAF XSS bloqué"
  echo "  bash demo_soutenance.sh 3    → Brute Force → Lockout"
  echo "  bash demo_soutenance.sh 4    → Scanner DAST 12 tests"
  echo "  bash demo_soutenance.sh 5    → Chiffrement AES-256-CBC"
  echo "  bash demo_soutenance.sh 6    → Headers Sécurité HTTP"
  echo "  bash demo_soutenance.sh 7    → Dashboard /monitoring"
  echo "  bash demo_soutenance.sh 8    → Wazuh SIEM Dashboard"
  echo "  bash demo_soutenance.sh 9    → FIM Rule 550 (déclencher alerte)"
  echo "  bash demo_soutenance.sh 10   → RGPD Traçabilité"
  echo "  bash demo_soutenance.sh all  → Toutes les étapes"
  echo ""
}

# ────────────────────────────────────────────────────────────
run_all() {
  for i in 0 1 2 3 4 5 6 7 8 9 10; do
    "etape_$i"
    sep
    read -p "Appuyer sur [Entrée] pour continuer..." _
    clear
  done
}

# ────────────────────────────────────────────────────────────
case "${1:-help}" in
  0)   etape_0  ;;
  1)   etape_1  ;;
  2)   etape_2  ;;
  3)   etape_3  ;;
  4)   etape_4  ;;
  5)   etape_5  ;;
  6)   etape_6  ;;
  7)   etape_7  ;;
  8)   etape_8  ;;
  9)   etape_9  ;;
  10)  etape_10 ;;
  all) run_all  ;;
  *)   show_help ;;
esac
