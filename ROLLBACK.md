# Plan de Rollback — Application Gestion Scolaire YNOV
# Phase 3 — Post-Production

---

## 1. Vue d'ensemble

Ce document décrit les procédures de retour arrière (rollback) en cas d'incident critique en production.

| Composant | Méthode de rollback | Durée estimée |
|---|---|---|
| Firebase Hosting (React) | Version précédente via CLI | < 2 minutes |
| Cloud Functions (API) | Re-déploiement version précédente | 5-10 minutes |
| Firestore Rules | Re-déploiement fichier précédent | < 2 minutes |
| Firestore Data | Restauration backup | 15-30 minutes |
| Firebase Storage | Restauration gsutil | 10-20 minutes |

---

## 2. Rollback Firebase Hosting (Frontend React)

### 2.1 Via Firebase CLI (méthode recommandée)
```bash
# Lister les versions déployées
firebase hosting:versions:list --project frais-gestionscolaire

# Exemple de sortie :
# VERSION_ID   STATUS    CREATE_TIME           SIZE
# abc123def    ACTIVE    2024-01-15 10:30:00   1.2 MB
# xyz789ghi    FINALIZED 2024-01-14 09:00:00   1.1 MB  ← version stable

# Rollback vers une version précédente
firebase hosting:clone \
  frais-gestionscolaire:xyz789ghi \
  frais-gestionscolaire:live \
  --project frais-gestionscolaire
```

### 2.2 Via Firebase Console
1. Aller sur : https://console.firebase.google.com/project/frais-gestionscolaire/hosting
2. Cliquer sur **"Historique des déploiements"**
3. Identifier la dernière version stable
4. Cliquer sur **"Restaurer"**

### 2.3 Vérification post-rollback
```bash
# Vérifier que le site est opérationnel
curl -sI https://frais-gestionscolaire.web.app | grep "HTTP/"

# Vérifier les headers de sécurité
curl -sI https://frais-gestionscolaire.web.app | grep -E "strict-transport|x-frame"
```

---

## 3. Rollback Cloud Functions (Backend API)

### 3.1 Re-déploiement depuis Git
```bash
# Revenir à la version stable en Git
git log --oneline -10  # Identifier le commit stable

git checkout <commit-hash-stable> -- back/functions/

# Re-déployer les fonctions
cd "/Users/anass/Downloads/frais-gestionScolaire 4"
firebase deploy --only functions --project frais-gestionscolaire
```

### 3.2 Re-déploiement depuis tag Git
```bash
# Créer un tag à chaque déploiement stable (bonne pratique)
git tag -a v1.0.0-prod -m "Version stable production 2024-01-15"
git push origin v1.0.0-prod

# Rollback vers ce tag
git checkout v1.0.0-prod -- back/functions/
firebase deploy --only functions --project frais-gestionscolaire
```

### 3.3 Vérification post-rollback API
```bash
# Tester l'endpoint de santé
curl -s https://us-central1-frais-gestionscolaire.cloudfunctions.net/api/v1/health

# Vérifier les logs immédiatement après
firebase functions:log --lines 20 --project frais-gestionscolaire
```

---

## 4. Rollback Firestore Security Rules

### 4.1 Via CLI
```bash
# Les rules sont versionnées dans Git
git log --oneline -- firestore.rules

# Restaurer une version précédente
git show <commit-hash>:firestore.rules > firestore.rules.backup
git checkout <commit-hash> -- firestore.rules

# Re-déployer
firebase deploy --only firestore:rules --project frais-gestionscolaire
```

### 4.2 Vérification
```bash
# Vérifier que les rules sont bien déployées
firebase firestore:rules:get --project frais-gestionscolaire
```

---

## 5. Rollback Données Firestore

> ⚠️ **ATTENTION** : Cette opération est irréversible. Elle écrase les données actuelles.
> Toujours créer un backup AVANT de restaurer.

### 5.1 Créer un backup d'urgence avant rollback
```bash
# Backup immédiat avant toute restauration
gcloud firestore export \
  gs://frais-gestionscolaire.appspot.com/emergency-backup/$(date +%Y%m%d_%H%M%S) \
  --project frais-gestionscolaire
```

### 5.2 Lister les backups disponibles
```bash
gsutil ls gs://frais-gestionscolaire.appspot.com/backups/
```

### 5.3 Restaurer depuis un backup
```bash
# Restaurer le backup du 2024-01-14
gcloud firestore import \
  gs://frais-gestionscolaire.appspot.com/backups/20240114 \
  --project frais-gestionscolaire
```

### 5.4 Restauration partielle (une collection)
```bash
# Restaurer uniquement la collection "paiements"
gcloud firestore import \
  gs://frais-gestionscolaire.appspot.com/backups/20240114 \
  --collection-ids="paiements" \
  --project frais-gestionscolaire
```

---

## 6. Procédures d'urgence par scénario

### Scénario A : Site inaccessible (503/502)
```
1. Vérifier Firebase Status : https://status.firebase.google.com
2. Si Firebase OK → Rollback Hosting (section 2.1)
3. Vérifier les logs Cloud Functions
4. Si Cloud Functions KO → Rollback Functions (section 3.1)
5. Notifier les utilisateurs via email
```

### Scénario B : Régression fonctionnelle (bug critique)
```
1. Identifier le commit responsable : git bisect
2. git checkout <dernier-commit-stable> -- [fichiers concernés]
3. Rebuild et re-déployer :
   cd front && npm run build
   firebase deploy --only hosting --project frais-gestionscolaire
4. Vérifier en production
5. Créer un ticket de bug avec les détails
```

### Scénario C : Faille de sécurité détectée
```
1. IMMÉDIATEMENT : Bloquer les accès suspects dans Firestore Rules
   → Ajouter dans firestore.rules : allow read, write: if false;
   → firebase deploy --only firestore:rules --project frais-gestionscolaire
2. Analyser les logs d'audit (collection auditLogs)
3. Identifier les données compromises
4. Notifier les utilisateurs concernés (obligation RGPD 72h)
5. Corriger la faille
6. Redéployer avec les corrections
7. Restaurer les règles d'accès
```

### Scénario D : Corruption de données
```
1. Créer un backup d'urgence (section 5.1)
2. Identifier l'étendue de la corruption
3. Restaurer depuis le dernier backup sain (section 5.2-5.3)
4. Vérifier l'intégrité des données financières
5. Informer les utilisateurs si des données sont perdues
```

---

## 7. Commandes de rollback rapide (cheatsheet)

```bash
# ============================================================
# ROLLBACK COMPLET EN CAS D'URGENCE
# ============================================================

PROJECT="frais-gestionscolaire"
STABLE_VERSION="xyz789ghi"  # À mettre à jour après chaque déploiement stable

# 1. Rollback Hosting (2 min)
firebase hosting:clone $PROJECT:$STABLE_VERSION $PROJECT:live --project $PROJECT

# 2. Rollback Rules (1 min)
git checkout HEAD~1 -- firestore.rules storage.rules
firebase deploy --only firestore:rules,storage --project $PROJECT

# 3. Rollback Functions (5-10 min)
git checkout HEAD~1 -- back/functions/
firebase deploy --only functions --project $PROJECT

# 4. Vérification
curl -sI https://$PROJECT.web.app | head -5
firebase functions:log --lines 10 --project $PROJECT
```

---

## 8. Contacts d'urgence

| Rôle | Responsabilité | Action |
|---|---|---|
| Admin technique | Rollback technique | Exécuter les commandes de rollback |
| Admin Firebase | Accès console | Rollback via console si CLI KO |
| Responsable RGPD | Notification utilisateurs | Notifier en cas de fuite de données |

---

## 9. Post-Rollback — Actions obligatoires

Après chaque rollback, effectuer dans les **24 heures** :

- [ ] Documenter la cause du problème
- [ ] Créer un ticket d'incident (voir ITIL.md)
- [ ] Analyser les logs pour identifier l'origine
- [ ] Rédiger un post-mortem
- [ ] Mettre à jour les tests pour éviter la régression
- [ ] Informer les utilisateurs si impact visible
- [ ] Mettre à jour la version stable de référence (`STABLE_VERSION`)

---

*Document généré le : 2026-03-19 | Version 1.0*
*Projet : Gestion Scolaire YNOV — Phase 3 Post-Production*
