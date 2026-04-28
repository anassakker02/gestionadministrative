# Phase 4 — Gouvernance ITIL
# Application Gestion Scolaire YNOV

---

## 1. Introduction

Ce document définit les processus de gouvernance ITIL (Information Technology Infrastructure Library) pour la gestion de l'application de Gestion Scolaire YNOV en production.

**Processus couverts :**
- Gestion des incidents
- Gestion des changements
- Gestion des mises en production
- Documentation des risques

---

## 2. Gestion des Incidents

### 2.1 Classification des incidents

| Priorité | Critères | Délai de réponse | Délai de résolution |
|---|---|---|---|
| **P1 — Critique** | App inaccessible, perte de données, faille sécurité | 15 minutes | 2 heures |
| **P2 — Majeur** | Fonctionnalité principale KO (paiements, factures) | 1 heure | 8 heures |
| **P3 — Mineur** | Fonctionnalité secondaire dégradée | 4 heures | 48 heures |
| **P4 — Information** | Anomalie cosmétique, amélioration | 1 jour | Prochain sprint |

### 2.2 Processus de gestion d'un incident

```
DÉTECTION
    │
    ▼
QUALIFICATION ──── P1/P2 ────▶ ESCALADE IMMÉDIATE (admin technique)
    │                                    │
    │ P3/P4                              ▼
    ▼                           ROLLBACK si nécessaire
TICKET D'INCIDENT                       │
    │                                   ▼
    ▼                           CORRECTION EN URGENCE
INVESTIGATION                           │
    │                                   ▼
    ▼                           DÉPLOIEMENT HOTFIX
RÉSOLUTION                              │
    │                                   ▼
    ▼                           POST-MORTEM (24h)
CLÔTURE
```

### 2.3 Template de ticket d'incident

```markdown
## INCIDENT — [ID: INC-YYYYMMDD-XXX]

**Date/Heure détection :**
**Priorité :** P1 / P2 / P3 / P4
**Détecté par :** [Monitoring automatique / Utilisateur / Admin]
**Composant affecté :** [Hosting / Functions / Firestore / Auth]

### Description
[Description claire du problème observé]

### Impact
- Utilisateurs affectés : [Tous / Admins / Etudiants / X personnes]
- Fonctionnalités KO : [Liste]
- Données affectées : [Oui/Non — préciser si oui]

### Chronologie
- HH:MM — Détection
- HH:MM — Début investigation
- HH:MM — Cause identifiée
- HH:MM — Correction déployée
- HH:MM — Vérification OK
- HH:MM — Clôture

### Cause racine
[Root cause analysis]

### Solution appliquée
[Description technique de la correction]

### Actions préventives
[Mesures pour éviter la récurrence]

### Statut : OUVERT / EN COURS / RÉSOLU / CLÔTURÉ
```

### 2.4 Incidents types et procédures

#### INC-TYPE-001 : Authentification impossible
```
Symptôme  : Les utilisateurs ne peuvent pas se connecter
Cause probable : JWT_SECRET expiré ou Cloud Functions down
Procédure :
  1. Vérifier firebase functions:log --project frais-gestionscolaire
  2. Si Functions down → Rollback (ROLLBACK.md section 3)
  3. Si JWT → Regénérer le secret via Secret Manager
  4. Re-déployer les functions
Priorité  : P1
```

#### INC-TYPE-002 : Paiements non enregistrés
```
Symptôme  : Les paiements échouent ou disparaissent
Cause probable : Règles Firestore trop restrictives ou erreur API
Procédure :
  1. Vérifier les logs Firestore dans Firebase Console
  2. Tester l'API : POST /api/v1/paiements avec token admin
  3. Vérifier les règles Firestore pour la collection paiements
  4. Si données corrompues → Restauration backup (ROLLBACK.md section 5)
Priorité  : P1
```

#### INC-TYPE-003 : Page blanche / erreur 404
```
Symptôme  : L'application affiche une page blanche
Cause probable : Build échoué ou mauvaise configuration Hosting
Procédure :
  1. Vérifier que front/dist/index.html existe
  2. Vérifier firebase.json (rewrites vers /index.html)
  3. Rollback Hosting vers version stable
Priorité  : P2
```

---

## 3. Gestion des Changements

### 3.1 Types de changements

| Type | Description | Approbation requise | Délai |
|---|---|---|---|
| **Standard** | Changement récurrent, faible risque (typo, CSS) | Aucune | Immédiat |
| **Normal** | Nouvelle fonctionnalité, modification API | Admin technique | 2 jours |
| **Urgent** | Correction de faille sécurité, hotfix P1 | Admin technique (verbal) | Immédiat |
| **Majeur** | Migration BDD, changement architecture | Validation complète | 1 semaine |

### 3.2 Processus RFC (Request For Change)

```
DEMANDE DE CHANGEMENT (RFC)
        │
        ▼
ANALYSE D'IMPACT ──────────────────────────────────────┐
  - Impact fonctionnel                                   │
  - Impact sécurité                                      │
  - Impact performances                                  │
  - Risque de régression                                 │
        │                                               │
        ▼                                               │
PLAN DE TEST                                       REJET RFC
  - Tests unitaires                                     │
  - Tests d'intégration                                 │
  - Tests de non-régression                             │
        │
        ▼
DÉPLOIEMENT EN STAGING (émulateurs Firebase)
        │
        ▼
VALIDATION QA
        │
        ▼
DÉPLOIEMENT PRODUCTION (fenêtre de maintenance)
        │
        ▼
SURVEILLANCE POST-DÉPLOIEMENT (30 min)
        │
        ▼
CLÔTURE RFC
```

### 3.3 Template RFC

```markdown
## RFC — [ID: RFC-YYYYMMDD-XXX]

**Date demande :**
**Demandeur :**
**Type :** Standard / Normal / Urgent / Majeur
**Priorité :** Faible / Moyenne / Haute

### Description du changement
[Quoi changer et pourquoi]

### Fichiers modifiés
- [ ] back/functions/...
- [ ] front/src/...
- [ ] firestore.rules
- [ ] firebase.json

### Analyse d'impact
- Risque régressions : Faible / Moyen / Élevé
- Downtime prévu : Aucun / Xs / Xmin
- Rollback possible : Oui / Non

### Plan de test
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Test manuel sur émulateurs

### Fenêtre de déploiement
Date/Heure proposée : [Hors heures de pointe — ex: 22h-23h]

### Statut : SOUMIS / APPROUVÉ / EN COURS / DÉPLOYÉ / CLÔTURÉ
```

---

## 4. Gestion des Mises en Production

### 4.1 Processus de déploiement

```
PRÉPARATION
  1. Vérifier que les tests passent : npm test
  2. Vérifier npm audit (0 critical)
  3. Créer un tag Git : git tag -a v1.X.X -m "Release v1.X.X"
  4. Notifier les utilisateurs si downtime prévu

DÉPLOIEMENT
  5. Lancer : ./deploy.sh
  6. Surveiller les logs en temps réel
  7. Vérifier les endpoints critiques

POST-DÉPLOIEMENT (30 min de surveillance)
  8. Taux d'erreur < 1%
  9. Latence normale (< 500ms)
  10. Tests de smoke (connexion, paiement test)
  11. Mettre à jour STABLE_VERSION dans ROLLBACK.md
```

### 4.2 Fenêtres de déploiement autorisées

| Environnement | Jours autorisés | Horaires | Remarque |
|---|---|---|---|
| Production | Lundi-Vendredi | 21h00 - 23h00 | Hors heures de cours |
| Production | Week-end | 10h00 - 18h00 | Avec surveillance |
| Urgence (P1) | Tout moment | Tout moment | Avec approbation verbale |

### 4.3 Checklist pré-déploiement

```
AVANT DE DÉPLOYER — VÉRIFICATIONS OBLIGATOIRES

[ ] 1. Tests unitaires : npm test (tous passent)
[ ] 2. Build production réussi : npm run build
[ ] 3. npm audit : 0 vulnérabilités critiques/hautes
[ ] 4. Variables d'environnement : .env.production à jour
[ ] 5. Secrets Firebase : JWT_SECRET, ENCRYPTION_KEY définis
[ ] 6. Firestore Rules : vérifiées et testées
[ ] 7. Tag Git créé : git tag -a vX.X.X
[ ] 8. RFC approuvée (si changement normal/majeur)
[ ] 9. Backup Firestore récent (< 24h)
[ ] 10. Équipe notifiée du déploiement
```

### 4.4 Checklist post-déploiement

```
APRÈS DÉPLOIEMENT — VÉRIFICATIONS (30 min)

[ ] 1. Site accessible : curl -sI https://frais-gestionscolaire.web.app
[ ] 2. Headers sécurité présents (HSTS, CSP, X-Frame...)
[ ] 3. Connexion admin fonctionnelle
[ ] 4. API répond : /api/v1/health → 200
[ ] 5. Taux erreur < 1% (Firebase Console > Functions)
[ ] 6. Latence < 500ms
[ ] 7. Logs propres (pas d'erreurs inattendues)
[ ] 8. Mettre à jour STABLE_VERSION dans ROLLBACK.md
[ ] 9. Clôturer la RFC
```

---

## 5. Documentation des Risques

### 5.1 Registre des risques

| ID | Risque | Probabilité | Impact | Score | Mitigation |
|---|---|---|---|---|---|
| R01 | Fuite de données personnelles (RGPD) | Faible | Critique | 🔴 Élevé | Chiffrement AES-256, RBAC strict, audit logs |
| R02 | Attaque brute force sur authentification | Moyenne | Majeur | 🟠 Moyen | Rate limiting, blocage 5 tentatives, CAPTCHA |
| R03 | Injection NoSQL dans Firestore | Faible | Critique | 🔴 Élevé | Validation entrées, Security Rules, pas de dynamic queries |
| R04 | XSS dans formulaires React | Faible | Majeur | 🟠 Moyen | DOMPurify, CSP strict, validation côté serveur |
| R05 | Dépassement quota Firebase (plan Spark) | Moyenne | Majeur | 🟠 Moyen | Monitoring quotas, alertes à 80%, upgrade Blaze |
| R06 | Indisponibilité Firebase (panne Google) | Très faible | Critique | 🟡 Faible | SLA 99.95%, plan de continuité, mode offline |
| R07 | Compromission JWT_SECRET | Très faible | Critique | 🟡 Faible | Rotation clés, Secret Manager, HTTPS obligatoire |
| R08 | Upload de malware via fichiers | Faible | Majeur | 🟠 Moyen | MIME whitelist, taille max 5MB, scan virus |
| R09 | Régression après déploiement | Moyenne | Mineur | 🟢 Faible | Tests automatisés, rollback < 2min |
| R10 | Perte de données financières | Très faible | Critique | 🟡 Faible | Backup quotidien, rétention 10 ans (obligation légale) |

### 5.2 Matrice des risques

```
IMPACT
  │
Critique │  R07  │  R01  │  R03  │
         │       │  R06  │  R10  │
  Majeur │  R04  │  R02  │  R08  │
         │  R09  │  R05  │       │
  Mineur │       │       │       │
         └───────┴───────┴───────┴── PROBABILITÉ
           Faible  Moyen   Élevé
```

### 5.3 Plan de traitement des risques critiques

#### R01 — Fuite de données personnelles
```
Contrôles en place :
  - Chiffrement AES-256-CBC des données sensibles (téléphone, adresse)
  - RBAC Firestore (Security Rules strictes)
  - HTTPS obligatoire (HSTS max-age=1an)
  - Audit logs de tous les accès

En cas de fuite :
  1. Bloquer immédiatement les accès (firestore.rules : if false)
  2. Analyser l'étendue (auditLogs)
  3. Notifier les personnes concernées sous 72h (RGPD Art. 33)
  4. Déclarer à la CNIL si nécessaire
  5. Corriger la faille
  6. Rapport post-incident
```

#### R03 — Injection NoSQL
```
Contrôles en place :
  - Aucune query dynamique construite depuis l'input utilisateur
  - Validation et sanitisation DOMPurify côté frontend
  - Firestore Security Rules bloquent les accès non autorisés
  - Pas d'accès direct Firestore depuis le frontend (tout passe par l'API)

Indicateurs d'attaque :
  - Requêtes avec caractères spéciaux ($gt, $ne, $where)
  - Volumétrie anormale de requêtes depuis une IP
```

#### R07 — Compromission JWT_SECRET
```
Contrôles en place :
  - Stocké dans Firebase Secret Manager (pas dans le code)
  - Jamais loggué ni exposé dans les réponses API
  - Algorithme HS256 forcé (rejet des tokens "alg:none")
  - Expiration courte : 30 minutes

Procédure de rotation d'urgence :
  1. Générer un nouveau secret :
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  2. Mettre à jour le secret :
     echo "NOUVEAU_SECRET" | firebase functions:secrets:set JWT_SECRET --project frais-gestionscolaire
  3. Re-déployer les functions (invalide tous les tokens existants)
  4. Les utilisateurs devront se reconnecter
```

---

## 6. Processus Agile — Scrum

### 6.1 Définition des sprints

| Sprint | Durée | Contenu principal |
|---|---|---|
| Sprint 1 | 1 semaine | Audit sécurité + corrections OWASP |
| Sprint 2 | 1 semaine | Tests unitaires + déploiement |
| Sprint 3 | 1 semaine | Monitoring + documentation |
| Sprint 4 | 1 semaine | ITIL + préparation soutenance |

### 6.2 Définition of Done (DoD)

Un ticket est **DONE** uniquement si :
- [ ] Code implémenté et revu
- [ ] Tests unitaires écrits et passants
- [ ] Pas de vulnérabilité critique (npm audit)
- [ ] Documentation mise à jour si nécessaire
- [ ] Déployé en production et vérifié
- [ ] RFC clôturée

---

## 7. Indicateurs de performance (KPIs)

| KPI | Cible | Mesure |
|---|---|---|
| Disponibilité mensuelle | > 99.5% | Firebase Console > Hosting |
| MTTR (Mean Time To Repair) | < 2h pour P1 | Tickets d'incidents |
| Taux de déploiements réussis | > 95% | Historique déploiements |
| Incidents P1 par mois | 0 | Registre incidents |
| Couverture de tests | > 70% | npm run test:coverage |
| Vulnérabilités critiques open | 0 | npm audit |

---

*Document généré le : 2026-03-19 | Version 1.0*
*Projet : Gestion Scolaire YNOV — Phase 4 Gouvernance ITIL*
