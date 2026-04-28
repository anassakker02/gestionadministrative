#!/usr/bin/env bash
# ============================================================
#  GÉNÉRATION D'ÉVÉNEMENTS pour le Dashboard /monitoring
#  Lance ce script APRÈS avoir démarré le backend
#  node --env-file=.env server_local.js
# ============================================================

API="http://localhost:5001/gestionadminastration/us-central1/api"

color_green()  { echo -e "\033[0;32m$*\033[0m"; }
color_red()    { echo -e "\033[0;31m$*\033[0m"; }
color_yellow() { echo -e "\033[0;33m$*\033[0m"; }
color_cyan()   { echo -e "\033[0;36m$*\033[0m"; }
sep() { echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; echo ""; }

echo ""
color_cyan "╔══════════════════════════════════════════════════════╗"
color_cyan "║   GÉNÉRATION D'ÉVÉNEMENTS — Dashboard /monitoring    ║"
color_cyan "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. WAF_BLOCK — Injections SQL (×3) ────────────────────
sep
color_red "🛡️  Génération WAF_BLOCK — SQL Injection (×3)"
for i in 1 2 3; do
  R=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API}/v1/etudiants?id=1%20OR%201=1--")
  [ "$R" = "403" ] && color_green "  SQLi $i → HTTP $R ✅ WAF_BLOCK loggué" \
                   || color_yellow "  SQLi $i → HTTP $R (backend démarré ?)"
  sleep 0.5
done

# ── 2. WAF_BLOCK — XSS (×3) ───────────────────────────────
echo ""
color_red "🛡️  Génération WAF_BLOCK — XSS (×3)"
for i in 1 2 3; do
  R=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API}/v1/etudiants?nom=%3Cscript%3Ealert(xss)%3C%2Fscript%3E")
  [ "$R" = "403" ] && color_green "  XSS $i → HTTP $R ✅ WAF_BLOCK loggué" \
                   || color_yellow "  XSS $i → HTTP $R"
  sleep 0.5
done

# ── 3. WAF_BLOCK — Path Traversal (×2) ────────────────────
echo ""
color_red "🛡️  Génération WAF_BLOCK — Path Traversal (×2)"
for i in 1 2; do
  R=$(curl -s -o /dev/null -w "%{http_code}" \
    "${API}/v1/etudiants?file=../../etc/passwd")
  [ "$R" = "403" ] && color_green "  Path $i → HTTP $R ✅ WAF_BLOCK loggué" \
                   || color_yellow "  Path $i → HTTP $R"
  sleep 0.5
done

# ── 4. WAF_BLOCK — Scanner suspect (×2) ───────────────────
echo ""
color_red "🛡️  Génération WAF_BLOCK — Scanner sqlmap (×2)"
for i in 1 2; do
  R=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: sqlmap/1.7.8#stable" \
    "${API}/v1/etudiants")
  [ "$R" = "403" ] && color_green "  Scanner $i → HTTP $R ✅ WAF_BLOCK loggué" \
                   || color_yellow "  Scanner $i → HTTP $R"
  sleep 0.5
done

# ── 5. AUTH_FAILURE + AUTH_LOCKOUT ────────────────────────
sep
color_red "🔐 Génération AUTH_FAILURE + AUTH_LOCKOUT (6 tentatives)"
for i in {1..6}; do
  R=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${API}/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@school.fr","password":"MAUVAIS_MDP"}')
  if [ "$R" = "429" ]; then
    color_red "  Tentative $i → HTTP $R ← AUTH_LOCKOUT ✅ loggué"
  elif [ "$R" = "401" ]; then
    color_yellow "  Tentative $i → HTTP $R ← AUTH_FAILURE ✅ loggué"
  else
    echo "  Tentative $i → HTTP $R"
  fi
  sleep 0.4
done

# ── 6. ACCESS_DENIED — routes protégées sans token ────────
sep
color_red "🚫 Génération ACCESS_DENIED — routes protégées (×3)"
for route in "/v1/users" "/v1/etudiants" "/v1/factures"; do
  R=$(curl -s -o /dev/null -w "%{http_code}" "${API}${route}")
  [ "$R" = "401" ] && color_green "  $route → HTTP $R ← ACCESS_DENIED loggué ✅" \
                   || color_yellow "  $route → HTTP $R"
  sleep 0.3
done

# ── 7. RGPD — DATA_EXPORT + DATA_ANONYMIZE (via Node.js) ──
sep
color_cyan "🔒 Génération événements RGPD (DATA_EXPORT + DATA_ANONYMIZE)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_SCRIPT="${SCRIPT_DIR}/back/functions/demo_rgpd_events.js"

if [ -f "$NODE_SCRIPT" ]; then
  cd "${SCRIPT_DIR}/back/functions" && node demo_rgpd_events.js
  if [ $? -eq 0 ]; then
    color_green "  RGPD ✅ 3 × DATA_EXPORT + 2 × DATA_ANONYMIZE loggués"
  else
    color_yellow "  RGPD ⚠️  Erreur lors de l'insertion (Firestore inaccessible ?)"
  fi
else
  color_yellow "  RGPD ⚠️  Script non trouvé : ${NODE_SCRIPT}"
fi

# ── Résumé ─────────────────────────────────────────────────
sep
color_cyan "✅ ÉVÉNEMENTS GÉNÉRÉS — Attendre 5s puis rafraîchir le dashboard"
echo ""
echo "  WAF_BLOCK      : ~10 événements (SQLi + XSS + Path + Scanner)"
echo "  AUTH_FAILURE   : ~5 événements"
echo "  AUTH_LOCKOUT   : ~1 événement (HTTP 429)"
echo "  ACCESS_DENIED  : ~3 événements"
echo "  DATA_EXPORT    : ~3 événements (RGPD Art.15)"
echo "  DATA_ANONYMIZE : ~2 événements (RGPD Art.17)"
echo ""
color_cyan "→ Ouvrir : http://localhost:8081/monitoring"
color_cyan "→ Cliquer 'Rafraîchir' ou attendre 60s (auto-refresh)"
echo ""
color_red "⚠️  Le score va BAISSER (normal — c'est le but de la démo !)"
echo "   Score démo attendu : ~40-60/100"
echo ""