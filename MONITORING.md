# Monitoring de Sécurité — Application Gestion Scolaire YNOV
# Phase 3 — Post-Production & Monitoring

**Projet** : Application web de gestion administrative et des frais scolaires — YNOV Campus
**Auteurs** : Amine BAHOU / Anass Akker
**Date** : Avril 2026 | Version 2.0
**Référentiels** : OWASP Top 10 (2021) · RGPD (UE 2016/679) · CDC §3.3

---

## 1. Architecture Globale de Monitoring

```
Application React (Hosting)
        │
        ▼
Cloud Functions (API)  ──▶  auditLogs Firestore  ──▶  Dashboard /monitoring
        │                          │
        ▼                          ▼
  Firestore (BDD)         Google Cloud Logging
        │                          │
        ▼                          ▼
Firebase Storage         Wazuh SIEM (Infrastructure)
                                   │
                                   ▼
                          Wazuh Dashboard (https://localhost)
```

---

## 2. Monitoring Applicatif — auditLogs Firestore

### 2.1 Les 9 types d'événements journalisés

| Événement | Déclencheur | CDC §3.3 | Niveau |
|---|---|---|---|
| `AUTH_SUCCESS` | Connexion réussie | Accès sécurisé | INFO |
| `AUTH_FAILURE` | Mauvais mot de passe | Accès sécurisé | WARNING |
| `AUTH_LOCKOUT` | Blocage après 5 échecs | Accès sécurisé | CRITIQUE |
| `LOGOUT` | Déconnexion explicite | Accès sécurisé | INFO |
| `SESSION_EXPIRED` | Timeout inactivité 30 min | Accès sécurisé | INFO |
| `ACCESS_DENIED` | Accès avec rôle insuffisant | RBAC | WARNING |
| `DATA_EXPORT` | Export RGPD Art.15 | RGPD | INFO |
| `DATA_ANONYMIZE` | Anonymisation Art.17 | RGPD | WARNING |
| `WAF_BLOCK` | Attaque bloquée par le WAF | WAF | CRITIQUE |

### 2.2 Structure d'un document auditLogs

```javascript
{
  userId:    "uid_utilisateur_ou_null",
  action:    "AUTH_FAILURE",
  timestamp: FieldValue.serverTimestamp(),
  metadata: {
    email:   "user@domain.com",
    ip:      "x.x.x.x",
    path:    "/api/v1/etudiants",
    role:    "admin",
    reason:  "Invalid credentials"
  }
}
```

### 2.3 Garanties d'intégrité — Firestore Rules

```
match /auditLogs/{logId} {
  allow create: if request.auth != null;        // append-only
  allow read:   if request.auth.token.role == 'admin';
  allow update: if false;                       // IMMUABLE
  allow delete: if false;                       // IMMUABLE
}
```

### 2.4 Requêtes d'analyse des incidents

```javascript
// 10 derniers accès refusés
db.collection('auditLogs')
  .where('action', '==', 'ACCESS_DENIED')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()

// Toutes les attaques WAF des dernières 24h
db.collection('auditLogs')
  .where('action', '==', 'WAF_BLOCK')
  .where('timestamp', '>=', since24h)
  .get()
```

---

## 3. WAF — Pare-feu Applicatif (waf.js)

### 3.1 Attaques détectées et bloquées

| Type d'attaque | Patterns détectés | OWASP |
|---|---|---|
| Injection SQL | SELECT, UNION, DROP, OR 1=1, SLEEP() | A03:2021 |
| XSS | `<script>`, onerror=, javascript:, eval() | A03:2021 |
| Path Traversal | ../../, %2e%2e/, %252e | A01:2021 |
| Command Injection | ; cat, $(whoami), pipe bash | A03:2021 |
| Agents suspects | sqlmap, nikto, nmap, dirbuster, masscan | A05:2021 |

### 3.2 Journalisation de chaque blocage

```javascript
await db.collection('auditLogs').add({
  action:   'WAF_BLOCK',
  timestamp: new Date(),
  metadata: {
    ip:        req.ip,
    path:      req.originalUrl,
    method:    req.method,
    reason:    'SQL_INJECTION',
    pattern:   '...',
    userAgent: req.headers['user-agent']
  }
});
```

---

## 4. Score de Sécurité /100

Calculé automatiquement à partir des auditLogs des 24 dernières heures :

```javascript
let score = 100;
if (authFailures > 5)  score -= Math.min(20, authFailures);   // -20 max
if (lockouts > 0)      score -= Math.min(15, lockouts * 5);   // -15 max
if (accessDenied > 3)  score -= Math.min(15, accessDenied*2); // -15 max
if (wafBlocks > 0)     score -= Math.min(20, wafBlocks * 4);  // -20 max
score = Math.max(0, score);
```

| Score | Couleur | Signification |
|---|---|---|
| 80-100 | Vert | Situation normale |
| 60-79 | Orange | Activité suspecte |
| 0-59 | Rouge | Attaque en cours |

---

## 5. Dashboard /monitoring — Tableau de bord SIEM

### 5.1 Fonctionnalités

- Score de sécurité /100 en temps réel
- Statut API Firebase (En ligne / Hors ligne)
- Alertes animées si seuils dépassés
- Rafraîchissement automatique toutes les 60 secondes
- Accès réservé aux administrateurs uniquement

### 5.2 Seuils d'alerte automatiques

| Alerte | Condition | Niveau |
|---|---|---|
| Brute Force | > 20 AUTH_FAILURE / 24h | CRITIQUE |
| Nombreux blocages | > 5 AUTH_LOCKOUT / 24h | CRITIQUE |
| Escalade privilèges | > 10 ACCESS_DENIED / 24h | HAUTE |
| Attaque WAF | > 10 WAF_BLOCK / 24h | CRITIQUE |

### 5.3 Les 3 onglets du dashboard

| Onglet | Contenu | CDC §3.3 |
|---|---|---|
| Dashboard | Accès sécurisé · RGPD · RBAC · Journalisation + Score /100 | Complet |
| WAF | Compteurs, répartition par type, 10 dernières attaques | OWASP A03/A05 |
| SIEM | Journal 20 événements : IP · email · rôle · chemin · horodatage | Journalisation |

---

## 6. Scanner DAST Automatisé (security_scan.js)

### 6.1 Commande d'exécution

```bash
node back/functions/scripts/security_scan.js http://localhost:5001/.../api
```

### 6.2 12 Tests automatisés OWASP Top 10

| Test | Vérification | Résultat attendu |
|---|---|---|
| T01 | API accessible et opérationnelle | HTTP 200 |
| T02 | Headers HTTP sécurité (HSTS, X-Frame...) | Headers présents |
| T03 | Auth requise sur endpoints protégés | HTTP 401 |
| T04 | Rate limiting déclenché | HTTP 429 |
| T05 | WAF bloque injection SQL | HTTP 403 |
| T06 | WAF bloque XSS | HTTP 403 |
| T07 | WAF bloque Path Traversal | HTTP 403 |
| T08 | WAF bloque agents suspects (sqlmap...) | HTTP 403 |
| T09 | Payload > 10kb rejeté | HTTP 413 |
| T10 | Privilege escalation bloquée | Rôle forcé 'etudiant' |
| T11 | /monitoring réservé admins | HTTP 401/403 |
| T12 | CORS refuse origines non autorisées | Header absent |

---

## 7. Logs Firebase — Analyse Infrastructure

### 7.1 Accès aux logs

```bash
# Logs Cloud Functions en temps réel
firebase functions:log --project frais-gestionscolaire

# Logs des 50 dernières entrées
firebase functions:log --lines 50 --project frais-gestionscolaire

# Logs Google Cloud (plus détaillé)
gcloud logging read "resource.type=cloud_function AND resource.labels.project_id=frais-gestionscolaire" \
  --limit 100 \
  --format="table(timestamp,severity,textPayload)"
```

### 7.2 Niveaux de logs applicatifs

| Niveau | Utilisation | Exemple |
|---|---|---|
| `INFO` | Opérations normales | Connexion réussie, paiement enregistré |
| `WARNING` | Anomalies non bloquantes | Tentative de connexion échouée |
| `ERROR` | Erreurs applicatives | Échec d'écriture Firestore |
| `CRITICAL` | Incidents graves | Clé secrète manquante, intrusion |

### 7.3 Requêtes de logs utiles (Google Cloud Console)

```
# Toutes les erreurs des dernières 24h
resource.type="cloud_function"
severity>=ERROR

# Tentatives de connexion échouées
resource.type="cloud_function"
textPayload:"AUTH_FAILURE"

# Accès refusés (403)
resource.type="cloud_function"
httpRequest.status=403

# Rate limiting déclenché
resource.type="cloud_function"
httpRequest.status=429
```

---

## 8. Métriques clés à surveiller

### 8.1 Performance API

| Métrique | Seuil Normal | Seuil Alerte | Action |
|---|---|---|---|
| Latence P95 | < 500ms | > 2000ms | Optimiser requêtes Firestore |
| Taux d'erreur 5xx | < 0.1% | > 1% | Vérifier logs + rollback |
| Taux d'erreur 4xx | < 5% | > 15% | Vérifier authentification |
| Invocations/min | < 100 | > 500 | Vérifier rate limiter |

### 8.2 Base de données Firestore

| Métrique | Seuil Normal | Seuil Alerte |
|---|---|---|
| Lectures/jour | < 50 000 | > 40 000 (quota Spark) |
| Écritures/jour | < 20 000 | > 18 000 |
| Taille BDD | < 1 GB | > 800 MB |

### 8.3 Sécurité

| Métrique | Seuil Alerte | Action |
|---|---|---|
| Connexions échouées > 5/5min/IP | Déclenché | Vérifier brute force |
| Accès refusés Firestore Rules | > 50/h | Audit accès |
| Tokens JWT invalides | > 10/h | Rotation des clés |
| Upload fichiers rejetés | > 5/h | Vérifier tentatives injection |

---

## 9. Monitoring SIEM Infrastructure — Wazuh

### 9.1 Présentation

Wazuh est un SIEM (Security Information and Event Management) open source déployé en complément du monitoring applicatif. Il surveille l'infrastructure serveur en temps réel et corrèle les événements de sécurité.

```
Application Web (React)
        │
        ▼
API Backend (Node.js)  ──▶  auditLogs Firestore  ──▶  Dashboard /monitoring
        │
        ▼
Serveur Linux / Docker
        │
        ▼
Wazuh Agent  ──▶  Wazuh Manager  ──▶  Wazuh Dashboard (https://localhost)
```

### 9.2 Installation via Docker

```bash
git clone -b v4.7.4 https://github.com/wazuh/wazuh-docker.git
cd wazuh-docker/single-node
docker compose -f generate-indexer-certs.yml run --rm generator
docker compose up -d
```

**Accès dashboard :** `https://localhost` — Login : `admin` / `SecretPassword`

### 9.3 Événements détectés automatiquement

| Type d'événement | Niveau | Description |
|---|---|---|
| CIS Benchmark | 7 | Audit configuration serveur Ubuntu |
| Permissions fichiers | 3-7 | `/etc/shadow`, `/etc/passwd`, `/etc/gshadow` |
| Auth failure | 5-12 | Échecs de connexion SSH |
| Integrity monitoring | Variable | Modifications fichiers système |

> **213 événements détectés en moins de 24h** sans configuration supplémentaire.

### 9.4 Modules Wazuh utilisés

| Module | CDC §3.3 | Ce qu'il surveille |
|---|---|---|
| **Security Events** | Journalisation | Tous les événements en temps réel |
| **MITRE ATT&CK** | Journalisation | Classification internationale des attaques |
| **GDPR** | RGPD | Conformité Art.15/17 — accès données personnelles |
| **Integrity Monitoring** | Journalisation | Modifications fichiers système |
| **Vulnerabilities** | Accès sécurisé | CVE détectées sur le serveur |

### 9.5 Complémentarité avec le monitoring applicatif

| Couche | Outil | Ce que ça surveille |
|---|---|---|
| **Applicative** | `auditLogs` Firestore + `/monitoring` | Auth · RBAC · RGPD · WAF |
| **Infrastructure** | Wazuh SIEM | Serveur · Fichiers · CVE · CIS Benchmark |

---

## 10. Plan de Continuité de Service

### 10.1 Disponibilité cible (SLA)

| Service | Objectif | Firebase SLA |
|---|---|---|
| Hosting (React) | 99.9% | 99.95% garanti |
| Firestore | 99.9% | 99.999% garanti |
| Cloud Functions | 99.5% | 99.9% garanti |

### 10.2 Stratégie de sauvegarde

| Données | Fréquence | Méthode | Rétention |
|---|---|---|---|
| Firestore (paiements, factures) | Quotidien | Firebase Export automatique | 30 jours |
| Firebase Storage (documents) | Hebdomadaire | gsutil rsync | 3 mois |
| Configuration (rules, indexes) | À chaque déploiement | Git repository | Indéfini |

```bash
# Export manuel Firestore
gcloud firestore export gs://frais-gestionscolaire.appspot.com/backups/$(date +%Y%m%d) \
  --project frais-gestionscolaire

# Restaurer un backup
gcloud firestore import gs://frais-gestionscolaire.appspot.com/backups/20260401 \
  --project frais-gestionscolaire
```

---

## 11. Checklist de Monitoring Hebdomadaire

- [ ] Vérifier le taux d'erreur des Cloud Functions (< 1%)
- [ ] Analyser les logs d'authentification (tentatives échouées)
- [ ] Contrôler la consommation Firestore vs quotas
- [ ] Vérifier les sauvegardes (dernière sauvegarde < 24h)
- [ ] Contrôler les alertes actives/résolues dans Wazuh
- [ ] Vérifier l'espace Storage utilisé
- [ ] Auditer les nouveaux accès administrateurs
- [ ] Revoir les logs `auditLogs` pour anomalies
- [ ] Vérifier le score de sécurité /100 sur `/monitoring`
- [ ] Consulter les 213+ événements Wazuh Security Events

---

## 12. Synthèse — CDC §3.3 couvert à 100%

| Exigence CDC §3.3 | Monitoring Applicatif | Monitoring Wazuh | Statut |
|---|---|---|---|
| **RGPD conforme** | DATA_EXPORT · DATA_ANONYMIZE · AES-256 · Art.15/16/17/33 | Module GDPR Wazuh | ✅ |
| **Gestion des accès par rôle** | ACCESS_DENIED loggué · RBAC · ProtectedRoute · Firestore Rules | Security Events | ✅ |
| **Journalisation des actions** | 9 événements auditLogs Firestore immuables · SIEM dashboard | 213+ événements Wazuh | ✅ |

### Phrase clé pour la soutenance

> *"Le monitoring de sécurité couvre intégralement le CDC §3.3 sur deux niveaux complémentaires : un monitoring applicatif développé dans le code (WAF, 9 types d'audit logs immuables Firestore, dashboard SIEM /monitoring avec score /100, scanner DAST 12 tests OWASP) et un monitoring infrastructure avec Wazuh SIEM (213 événements détectés, modules MITRE ATT&CK, GDPR, CIS Benchmark). Ensemble, ils assurent une défense en profondeur conforme RGPD."*

---

*Document généré le : 2026-04-01 | Version 2.0*
*Projet : Gestion Scolaire YNOV — Phase 3 Post-Production*
*Auteurs : Amine BAHOU / Anass Akker — PFE Bachelor Cybersécurité / Cyberdéfense YNOV Campus*
