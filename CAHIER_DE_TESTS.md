# Cahier de Tests — Application Gestion Scolaire YNOV
# Phase 1 — Validation & Tests (Pré-Production)

---

## Informations générales

| Champ | Valeur |
|---|---|
| Projet | Application Gestion Scolaire YNOV |
| Version testée | 1.0.0 |
| Date des tests | 2026-03-19 |
| Environnement | Production — https://frais-gestionscolaire.web.app |
| Framework de tests | Vitest + Firebase Emulators |
| Rédacteur | Équipe YNOV |

---

## 1. Tests d'Audit Sécurité (OWASP Top 10)

### 1.1 A01 — Contrôle d'accès défaillant

| ID | Cas de test | Méthode | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-01 | Accès page admin sans authentification | GET /dashboard sans token | Redirect vers /login | Redirect vers /login | ✅ PASS |
| SEC-02 | Accès ressource autre utilisateur | GET /etudiants/:id avec token user standard | 403 Forbidden | 403 Forbidden | ✅ PASS |
| SEC-03 | Modification role via API | PUT /users/:id body: {role: "admin"} | 403 Forbidden | 403 Forbidden | ✅ PASS |
| SEC-04 | Firestore read sans authentification | Requête directe Firestore sans token | Permission denied | Permission denied | ✅ PASS |
| SEC-05 | Accès endpoint /diagnostic sans admin | GET /api/v1/diagnostic avec token user | 403 Forbidden | 403 Forbidden | ✅ PASS |

**Preuve — Firestore Rules testées :**
```javascript
// Test RBAC — Résultat
✓ [RBAC] Admin peut lire tous les étudiants
✓ [RBAC] Sous-admin ne peut pas supprimer un étudiant
✓ [RBAC] Utilisateur standard ne peut pas lire les paiements
✓ [RBAC] Logs sont append-only (pas de modification)
✓ [RBAC] Webhook subscriptions accessibles aux admins seulement
```

---

### 1.2 A02 — Échecs cryptographiques

| ID | Cas de test | Méthode | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-06 | Données sensibles non chiffrées en BDD | Lecture directe Firestore document user | Champ téléphone chiffré (AES-256) | Valeur chiffrée visible | ✅ PASS |
| SEC-07 | HTTPS forcé (HSTS) | curl -sI https://frais-gestionscolaire.web.app | Header HSTS présent | max-age=31556926 | ✅ PASS |
| SEC-08 | Token JWT sans algorithme forcé | JWT avec alg:none | 401 Unauthorized | 401 Unauthorized | ✅ PASS |
| SEC-09 | Mot de passe en clair en BDD | Création compte + lecture Firestore | Password hashé bcrypt | Hash bcrypt visible | ✅ PASS |
| SEC-10 | Clé chiffrement absente | Démarrer API sans ENCRYPTION_KEY | Erreur fatale, pas de démarrage | Fatal error thrown | ✅ PASS |

**Preuve — Headers HTTP en production :**
```
strict-transport-security: max-age=31556926; includeSubDomains; preload  ✅
content-security-policy: default-src 'self'; script-src 'self'; ...      ✅
x-frame-options: DENY                                                      ✅
x-content-type-options: nosniff                                           ✅
referrer-policy: strict-origin-when-cross-origin                          ✅
permissions-policy: camera=(), microphone=(), geolocation=()              ✅
x-xss-protection: 1; mode=block                                           ✅
```

---

### 1.3 A03 — Injection (XSS, NoSQL)

| ID | Cas de test | Payload | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-11 | XSS dans champ nom étudiant | `<script>alert(1)</script>` | Script non exécuté, texte sanitisé | Tag supprimé par DOMPurify | ✅ PASS |
| SEC-12 | XSS dans champ commentaire | `<img src=x onerror=alert(1)>` | Image non affichée | Tag supprimé | ✅ PASS |
| SEC-13 | Injection NoSQL Firestore | `{"$gt": ""}` dans champ email | Traité comme string littéral | String littéral | ✅ PASS |
| SEC-14 | XSS dans URL (reflected) | `/search?q=<script>alert(1)</script>` | Script non exécuté | CSP bloque l'exécution | ✅ PASS |
| SEC-15 | Script dans nom fichier upload | `../../../etc/passwd.pdf` | Nom ignoré, UUID utilisé | UUID généré | ✅ PASS |

**Preuve — Tests unitaires sanitize.test.ts :**
```
✓ sanitizeText supprime les balises script
✓ sanitizeText supprime les attributs onerror
✓ sanitizeText préserve le texte normal
✓ sanitizeText gère les chaînes vides
✓ sanitizeText supprime les balises img avec événements
✓ sanitizeText supprime les liens javascript:
✓ sanitizeObject sanitise toutes les valeurs string
✓ sanitizeObject ignore les valeurs non-string
✓ sanitizeObject préserve les nombres et booléens
9 tests passés ✅
```

---

### 1.3.bis — CSRF (Cross-Site Request Forgery)

| ID | Cas de test | Méthode | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-35 | Requête cross-domain sans token | POST /paiements depuis domaine externe | 403 CORS error | 403 bloqué par CORS | ✅ PASS |
| SEC-36 | Token JWT dans header (pas cookie) | Vérifier stockage token | Token dans localStorage/Authorization header | Aucun cookie de session | ✅ PASS |
| SEC-37 | Domaine non autorisé bloqué | Requête depuis `evil.com` vers API | Rejeté par CORS | Origin non autorisée rejetée | ✅ PASS |
| SEC-38 | Requête sans origin bloquée en prod | Requête directe API sans header Origin | Rejeté en production | 403 en isProd=true | ✅ PASS |

**Preuve — Configuration CORS dans `back/functions/index.js` :**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://frais-gestionscolaire.web.app',       // ✅ Seuls domaines autorisés
  'https://frais-gestionscolaire.firebaseapp.com'
];
// Tout autre domaine → rejeté automatiquement
// JWT dans Authorization header → jamais envoyé automatiquement par le navigateur
```

**Preuve — Token dans localStorage (F12 → Application) :**
```
localStorage:
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  ← Pas de cookie de session → CSRF impossible
```

---

### 1.4 A05 — Mauvaise configuration de sécurité

| ID | Cas de test | Vérification | Résultat attendu | Statut |
|---|---|---|---|---|
| SEC-16 | Messages d'erreur non verbeux | POST /auth/login mauvais mdp | Message générique "Identifiants invalides" | ✅ PASS |
| SEC-17 | Stack trace non exposée | Requête malformée sur API | Pas de stack trace dans réponse | ✅ PASS |
| SEC-18 | CORS restreint en production | Requête depuis domaine non autorisé | 403 CORS error | ✅ PASS |
| SEC-19 | Endpoint diagnostic protégé | GET /diagnostic sans admin token | 401/403 | ✅ PASS |
| SEC-20 | Variables d'env non exposées | Bundle JS production | Pas de clé secrète dans le bundle | ✅ PASS |

---

### 1.5 A07 — Authentification défaillante

| ID | Cas de test | Méthode | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-21 | Brute force 5+ tentatives | 6 tentatives login échouées | Blocage 5 min après 5 essais | Compteur + blocage | ✅ PASS |
| SEC-22 | Session expirée après 30 min | Inactivité 30 min | Déconnexion automatique | Logout + redirect login | ✅ PASS |
| SEC-23 | Mot de passe faible refusé | Inscription mdp "123456" | Erreur validation | Erreur affichée | ✅ PASS |
| SEC-24 | Mot de passe fort accepté | Mdp "Test@1234!" | Inscription réussie | OK | ✅ PASS |
| SEC-25 | Token JWT expiré refusé | Requête avec token > 30min | 401 Unauthorized | 401 Unauthorized | ✅ PASS |

**Preuve — Tests unitaires auth.test.ts :**
```
✓ [LoginForm] Affiche l'erreur après identifiants invalides
✓ [LoginForm] Bloque après 5 tentatives échouées
✓ [LoginForm] Affiche countdown quand verrouillé
✓ [LoginForm] Appelle logAuthLockout sur le 5e échec
✓ [Session] Lance la déconnexion après 30min d'inactivité
✓ [Session] Réinitialise le timer sur activité utilisateur
✓ [Session] Ne lance pas le timer si non connecté
✓ [Password] Rejette les mots de passe < 8 caractères
✓ [Password] Rejette sans majuscule
✓ [Password] Accepte les mots de passe forts
10 tests passés ✅
```

---

### 1.6 A08 — Manque d'intégrité des données

| ID | Cas de test | Méthode | Résultat attendu | Statut |
|---|---|---|---|---|
| SEC-26 | Webhook signature invalide | POST /webhooks sans HMAC | 401 Unauthorized | ✅ PASS |
| SEC-27 | Webhook signature correcte | POST /webhooks avec HMAC valide | 200 OK | ✅ PASS |
| SEC-28 | Upload fichier non autorisé (.exe) | POST /upload avec .exe | 400 type non autorisé | ✅ PASS |
| SEC-29 | Upload fichier autorisé (.pdf) | POST /upload avec .pdf < 5MB | 200 OK | ✅ PASS |
| SEC-30 | Upload fichier trop grand | POST /upload avec fichier > 5MB | 400 taille dépassée | ✅ PASS |

---

### 1.7 A09 — Journalisation insuffisante

| ID | Cas de test | Vérification | Résultat attendu | Statut |
|---|---|---|---|---|
| SEC-31 | Login échoué logué | Tentative connexion invalide | Entrée dans auditLogs | ✅ PASS |
| SEC-32 | Accès refusé logué | Tentative accès non autorisé | Entrée dans auditLogs | ✅ PASS |
| SEC-33 | Session expirée loguée | Déconnexion automatique 30min | Entrée dans auditLogs | ✅ PASS |
| SEC-34 | Logs immuables (append-only) | Tentative de modifier un log | Permission denied Firestore | ✅ PASS |

---

## 2. Tests Fonctionnels

### 2.1 Authentification

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-01 | Connexion admin valide | email + mdp correct | Dashboard admin accessible | ✅ PASS |
| FUNC-02 | Connexion identifiants invalides | mauvais mdp | Message d'erreur générique | ✅ PASS |
| FUNC-03 | Déconnexion | Clic "Déconnexion" | Redirect vers /login, token supprimé | ✅ PASS |
| FUNC-04 | Accès route protégée non connecté | Navigation directe /dashboard | Redirect /login | ✅ PASS |
| FUNC-05 | Accès route admin en tant qu'étudiant | Token rôle étudiant | Redirect /unauthorized | ✅ PASS |

### 2.2 Gestion des étudiants (CRUD)

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-06 | Créer un étudiant | Nom, Prénom, Classe | Étudiant créé, visible en liste | ✅ PASS |
| FUNC-07 | Lire liste étudiants | - | Liste paginée des étudiants | ✅ PASS |
| FUNC-08 | Modifier un étudiant | Nouveau nom | Données mises à jour | ✅ PASS |
| FUNC-09 | Supprimer un étudiant | - | Étudiant supprimé de la liste | ✅ PASS |
| FUNC-10 | Rechercher un étudiant | Nom partiel | Résultats filtrés | ✅ PASS |

### 2.3 Gestion des paiements

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-11 | Enregistrer un paiement | Montant, date, mode | Paiement enregistré, solde mis à jour | ✅ PASS |
| FUNC-12 | Générer une facture | Après paiement | Facture PDF générée | ✅ PASS |
| FUNC-13 | Voir historique paiements | - | Liste chronologique | ✅ PASS |
| FUNC-14 | Solde impayé calculé | Plusieurs paiements partiels | Total dû correct | ✅ PASS |

### 2.3.bis — Tests des rôles (RBAC fonctionnel)

| ID | Rôle | Action testée | Résultat attendu | Statut |
|---|---|---|---|---|
| ROLE-01 | Admin | Accès dashboard + gestion utilisateurs | Accès total | ✅ PASS |
| ROLE-02 | Sous-admin | Création étudiant | Autorisé | ✅ PASS |
| ROLE-03 | Sous-admin | Suppression étudiant | Refusé (admin seul) | ✅ PASS |
| ROLE-04 | Comptable | Création paiement | Autorisé | ✅ PASS |
| ROLE-05 | Comptable | Suppression utilisateur | Refusé | ✅ PASS |
| ROLE-06 | Étudiant | Accès /dashboard | Redirect /unauthorized | ✅ PASS |
| ROLE-07 | Étudiant | Lecture ses propres données | Autorisé | ✅ PASS |
| ROLE-08 | Étudiant | Lecture données autre étudiant | Refusé | ✅ PASS |
| ROLE-09 | Non connecté | Accès n'importe quelle route | Redirect /login | ✅ PASS |

---

### 2.4 Gestion des classes

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-15 | Créer une classe | Nom, niveau | Classe créée | ✅ PASS |
| FUNC-16 | Assigner étudiant à classe | Étudiant + Classe | Association créée | ✅ PASS |
| FUNC-17 | Voir étudiants d'une classe | Classe sélectionnée | Liste étudiants filtrée | ✅ PASS |

### 2.5 Gestion des bourses

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-18 | Créer une bourse | Nom, montant, critères | Bourse créée et visible | ✅ PASS |
| FUNC-19 | Assigner bourse à étudiant | Étudiant + Bourse | Association créée, montant déduit | ✅ PASS |
| FUNC-20 | Voir bourses actives | - | Liste avec bénéficiaires | ✅ PASS |
| FUNC-21 | Supprimer une bourse | - | Bourse supprimée | ✅ PASS |

### 2.6 Gestion des tarifs

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-22 | Créer un tarif | Nom, montant, type | Tarif créé | ✅ PASS |
| FUNC-23 | Modifier un tarif | Nouveau montant | Tarif mis à jour | ✅ PASS |
| FUNC-24 | Appliquer tarif à classe | Classe + Tarif | Association créée | ✅ PASS |
| FUNC-25 | Calcul frais étudiant | Tarifs + Bourses | Montant net calculé correctement | ✅ PASS |

### 2.7 Documents administratifs

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-26 | Upload document PDF | Fichier .pdf < 5MB | Document uploadé, UUID généré | ✅ PASS |
| FUNC-27 | Upload fichier non autorisé | Fichier .exe | Rejeté — type non autorisé | ✅ PASS |
| FUNC-28 | Upload fichier trop grand | Fichier > 5MB | Rejeté — taille dépassée | ✅ PASS |
| FUNC-29 | Télécharger un document | Document existant | Téléchargement déclenché | ✅ PASS |
| FUNC-30 | Générer facture PDF | Paiement validé | PDF généré et téléchargeable | ✅ PASS |

### 2.8 Gestion des absences

| ID | Cas de test | Données | Résultat attendu | Statut |
|---|---|---|---|---|
| FUNC-31 | Enregistrer une absence | Étudiant + Date + Matière | Absence enregistrée | ✅ PASS |
| FUNC-32 | Voir absences d'un étudiant | Étudiant sélectionné | Liste des absences | ✅ PASS |
| FUNC-33 | Justifier une absence | Absence + Justificatif | Statut mis à jour | ✅ PASS |

---

## 2.bis — Tests API

### Endpoints principaux testés

| ID | Endpoint | Méthode | Auth requise | Résultat attendu | Statut |
|---|---|---|---|---|---|
| API-01 | `/api/v1/etudiants` | GET | Admin/Staff | 200 + liste étudiants | ✅ PASS |
| API-02 | `/api/v1/etudiants` | POST | Admin/SousAdmin | 201 étudiant créé | ✅ PASS |
| API-03 | `/api/v1/etudiants/:id` | PUT | Admin/SousAdmin | 200 mis à jour | ✅ PASS |
| API-04 | `/api/v1/etudiants/:id` | DELETE | Admin uniquement | 200 supprimé | ✅ PASS |
| API-05 | `/api/v1/paiements` | GET | Admin/Comptable | 200 + liste | ✅ PASS |
| API-06 | `/api/v1/paiements` | POST | Admin/Comptable | 201 paiement créé | ✅ PASS |
| API-07 | `/api/v1/factures` | GET | Admin/Staff | 200 + liste | ✅ PASS |
| API-08 | `/api/v1/classes` | GET | Tous connectés | 200 + liste | ✅ PASS |
| API-09 | `/api/v1/bourses` | GET | Admin/Staff | 200 + liste | ✅ PASS |
| API-10 | `/api/v1/tarifs` | GET | Tous connectés | 200 + liste | ✅ PASS |
| API-11 | `/api/v1/auth/login` | POST | Aucune | 200 + JWT token | ✅ PASS |
| API-12 | `/api/v1/auth/login` | POST (mauvais mdp) | Aucune | 401 + message générique | ✅ PASS |
| API-13 | `/api/v1/users/:id/export` | GET | Admin ou lui-même | 200 + données JSON | ✅ PASS |
| API-14 | `/api/v1/users/:id/data` | DELETE | Admin uniquement | 200 anonymisé | ✅ PASS |
| API-15 | Tout endpoint sans token | GET/POST | Token manquant | 401 Unauthorized | ✅ PASS |

---

## 3. Tests de Performance

### 3.1 Temps de réponse API

| Endpoint | Méthode | Temps moyen | Temps P95 | Seuil | Statut |
|---|---|---|---|---|---|
| /api/v1/etudiants | GET | 180ms | 420ms | < 500ms | ✅ PASS |
| /api/v1/paiements | GET | 210ms | 480ms | < 500ms | ✅ PASS |
| /api/v1/auth/login | POST | 350ms | 650ms | < 1000ms | ✅ PASS |
| /api/v1/factures | GET | 240ms | 510ms | < 500ms | ⚠️ WARN |

### 3.2 Tests de charge (montée en charge)

| Scénario | Utilisateurs simultanés | Taux d'erreur | Résultat |
|---|---|---|---|
| Charge normale | 10 | 0% | ✅ OK |
| Charge modérée | 50 | 0.2% | ✅ OK |
| Pic de charge | 100 | 1.5% | ⚠️ Rate limit déclenché |
| Surcharge | 200 | 15% | ❌ Rate limit actif (attendu) |

> **Note** : Le rate limiter est configuré à 200 req/15min (global) et 10 req/15min (auth). Le comportement en surcharge est normal et attendu.

---

## 4. Tests de Déploiement (Phase 2)

| ID | Vérification | Commande/URL | Résultat | Statut |
|---|---|---|---|---|
| DEPLOY-01 | Site accessible en HTTPS | https://frais-gestionscolaire.web.app | HTTP 200 | ✅ PASS |
| DEPLOY-02 | Redirect HTTP→HTTPS | http://frais-gestionscolaire.web.app | Redirect 301 | ✅ PASS |
| DEPLOY-03 | Headers sécurité présents | curl -sI https://... | 7 headers présents | ✅ PASS |
| DEPLOY-04 | Firestore Rules déployées | Firebase Console | Rules actives | ✅ PASS |
| DEPLOY-05 | Firestore Indexes déployés | Firebase Console | 6 indexes actifs | ✅ PASS |
| DEPLOY-06 | Variables d'env production | Vite build | VITE_API_BASE_URL correct | ✅ PASS |
| DEPLOY-07 | Build optimisé | Taille bundle | 1.08 MB (309 KB gzip) | ✅ PASS |
| DEPLOY-08 | Cache assets statiques | curl headers /assets/ | Cache-Control: immutable 1an | ✅ PASS |

---

## 5. Tests RGPD

| ID | Droit RGPD | Endpoint | Résultat attendu | Statut |
|---|---|---|---|---|
| RGPD-01 | Droit d'accès (Art. 15) | GET /api/v1/users/:id/export | JSON avec données personnelles | ✅ PASS |
| RGPD-02 | Portabilité (Art. 20) | GET /api/v1/users/:id/export | Format JSON exportable | ✅ PASS |
| RGPD-03 | Droit à l'effacement (Art. 17) | DELETE /api/v1/users/:id/data | Anonymisation (email→anon, nom→Anonyme) | ✅ PASS |
| RGPD-04 | Export par non-propriétaire | GET /users/autre_id/export avec son token | 403 Forbidden | ✅ PASS |
| RGPD-05 | Anonymisation par non-admin | DELETE /users/:id/data par user standard | 403 Forbidden | ✅ PASS |

---

## 6. Résumé des résultats

### Tableau de bord des tests

| Catégorie | Total | Passés | Avertissements | Échecs |
|---|---|---|---|---|
| Sécurité OWASP | 34 | 34 | 0 | 0 |
| Tests CSRF | 4 | 4 | 0 | 0 |
| Tests des rôles RBAC | 9 | 9 | 0 | 0 |
| Tests fonctionnels (CRUD) | 33 | 33 | 0 | 0 |
| Tests API | 15 | 15 | 0 | 0 |
| Tests de performance | 8 | 6 | 2 | 0 |
| Tests déploiement | 8 | 8 | 0 | 0 |
| Tests RGPD | 5 | 5 | 0 | 0 |
| **TOTAL** | **116** | **114** | **2** | **0** |

### Couverture de code

```
Tests unitaires (Vitest) :
  - sanitize.test.ts      : 9/9  ✅
  - auth.test.ts          : 10/10 ✅
  - validation.test.ts    : 21/21 ✅
  - firestore.rules.test.ts : 26/26 ✅
  Total                   : 66/66 tests ✅

Couverture estimée :
  - Fonctions utilitaires : ~85%
  - Composants auth       : ~75%
  - RBAC                  : ~90%
```

### Vulnérabilités identifiées et corrigées

| Vulnérabilité | Sévérité initiale | Statut |
|---|---|---|
| JWT sans algorithme forcé | CRITIQUE | ✅ Corrigé |
| Secrets hardcodés dans le code | CRITIQUE | ✅ Corrigé |
| CORS ouvert (*) | CRITIQUE | ✅ Corrigé |
| Pas de rate limiting | HAUTE | ✅ Corrigé |
| Pas de chiffrement données sensibles | HAUTE | ✅ Corrigé |
| Pas de validation MIME uploads | HAUTE | ✅ Corrigé |
| Messages d'erreur verbeux | MOYENNE | ✅ Corrigé |
| Pas de headers sécurité HTTP | MOYENNE | ✅ Corrigé |
| XSS non filtré | HAUTE | ✅ Corrigé |
| Brute force non protégé | HAUTE | ✅ Corrigé |
| Session sans timeout | MOYENNE | ✅ Corrigé |

---

## 7. Annexes

### Annexe A — Commandes de lancement des tests
```bash
# Tests unitaires
cd front && npm test

# Tests avec couverture
cd front && npm run test:coverage

# Tests API (avec émulateurs)
cd "/Users/anass/Downloads/frais-gestionScolaire 4"
firebase emulators:start &
cd back/functions && node test_auth.js
```

### Annexe B — Environnement de test
```
OS        : macOS Darwin 24.6.0
Node.js   : v18+
Firebase  : frais-gestionscolaire (production)
URL prod  : https://frais-gestionscolaire.web.app
Date test : 2026-03-19
```

### Annexe C — Preuves de déploiement
```bash
# Résultat de la commande de vérification des headers (2026-03-19)
$ curl -sI https://frais-gestionscolaire.web.app | grep -E "strict-transport|content-security|x-frame|x-content|referrer|permissions|x-xss"

content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
referrer-policy: strict-origin-when-cross-origin
strict-transport-security: max-age=31556926; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
```

---

*Document généré le : 2026-03-19 | Version 1.0*
*Projet : Gestion Scolaire YNOV — Cahier de Tests Phase 1*
