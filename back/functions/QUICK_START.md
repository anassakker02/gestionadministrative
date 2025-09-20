# Quick Start - Système de Rôles Hiérarchiques

## 🚀 Démarrage Rapide

### 1. Setup Initial

```bash
# Se placer dans le dossier functions
cd back/functions

# Installer les dépendances (si pas déjà fait)
npm install

# Démarrer l'émulateur Firebase
firebase emulators:start
```

### 2. Initialiser les Seeds

```bash
# Option 1: Seed complet avec nettoyage (recommandé)
node seedRoleSystem.js --clear

# Option 2: Via npm script
npm run seed:roles:clean

# Option 3: Seed sans nettoyage
node seedRoleSystem.js
```

### 3. Valider l'Installation

```bash
# Vérifier que tout est correctement créé
node validateSeeds.js
```

### 4. Test de Connexion

#### 🔧 Backend (port 5000)

```bash
# Test login admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecole.com","password":"password123"}'

# Test récupération utilisateurs en attente
curl -X GET http://localhost:5000/users/pending \
  -H "Authorization: Bearer <token_from_login>"
```

#### 🎨 Frontend (port 8080)

```bash
# Se placer dans le dossier front
cd front

# Démarrer le serveur dev
npm run dev

# Ouvrir http://localhost:8080
```

## 🎯 Scénarios de Test

### Scénario 1: Connexion Admin

1. Aller sur http://localhost:8080
2. Se connecter avec `admin@ecole.com` / `password123`
3. Vérifier l'accès au dashboard admin
4. Observer les statistiques et utilisateurs en attente

### Scénario 2: Création Sous-Admin

1. Connecté en tant qu'admin
2. Utiliser le formulaire "Créer Sous-Admin"
3. Remplir: nom, prénom, email, mot de passe
4. Vérifier la création et les permissions

### Scénario 3: Assignation de Rôles

1. Connecté en tant qu'admin ou sous-admin
2. Sélectionner un rôle dans le dropdown
3. Assigner à `pending1@ecole.com` ou `pending2@ecole.com`
4. Vérifier la création automatique de l'entité

### Scénario 4: Test Permissions

1. Se connecter avec `enseignant1@ecole.com`
2. Vérifier l'accès aux fonctionnalités enseignant
3. Tester les restrictions (pas d'accès admin)

## 📋 Comptes de Test Disponibles

| Rôle            | Email                 | Fonctionnalités                                          |
| --------------- | --------------------- | -------------------------------------------------------- |
| 👑 Admin        | admin@ecole.com       | Dashboard admin, création sous-admins, assignation rôles |
| 👨‍💼 Sous-admin 1 | subadmin1@ecole.com   | Dashboard admin (restreint), assignation rôles           |
| 👨‍💼 Sous-admin 2 | subadmin2@ecole.com   | Dashboard admin (restreint), assignation rôles           |
| 👨‍🏫 Enseignant 1 | enseignant1@ecole.com | Fonctionnalités enseignant                               |
| 👨‍🏫 Enseignant 2 | enseignant2@ecole.com | Fonctionnalités enseignant                               |
| 👪 Parent       | parent1@ecole.com     | Suivi enfants, paiements                                 |
| 🎓 Étudiant     | etudiant1@ecole.com   | Consultation frais, paiements                            |
| ⏳ En attente 1 | pending1@ecole.com    | Attend assignation de rôle                               |
| ⏳ En attente 2 | pending2@ecole.com    | Attend assignation de rôle                               |

**Mot de passe pour tous:** `password123`

## 🔍 Vérifications Firestore

### Via l'interface émulateur (http://localhost:4000)

- `users`: 9+ utilisateurs avec hiérarchie
- `enseignants`: 2 enseignants avec user_id
- `parents`: 1+ parents avec user_id
- `etudiants`: 5+ étudiants, 1 avec user_id
- `admin_activities`: Traçabilité des actions

### Via console

```bash
# Compter les utilisateurs par rôle
node -e "
const admin = require('firebase-admin');
admin.initializeApp({projectId: 'demo-project'});
const db = admin.firestore();
db.collection('users').get().then(snap => {
  const users = snap.docs.map(doc => doc.data());
  console.log('Admin:', users.filter(u => u.role === 'admin').length);
  console.log('Sous-admins:', users.filter(u => u.role === 'sub-admin').length);
  console.log('En attente:', users.filter(u => u.role === null).length);
  process.exit(0);
});
"
```

## 🛠️ Debugging Courant

### Seeds ne fonctionnent pas

```bash
# Vérifier que l'émulateur tourne
firebase emulators:start

# Nettoyer et refaire les seeds
node seedRoleSystem.js --clear
```

### Erreur de connexion frontend

- Vérifier que le backend est sur le port 5000
- Vérifier les headers CORS dans index.js
- Contrôler les tokens JWT

### Permissions incorrectes

- Vérifier AuthContext.tsx pour les permissions
- Contrôler les rôles en base de données
- Valider les méthodes User.js côté backend

## 📊 Métriques Attendues

Après seeds réussis:

- ✅ 1 admin principal
- ✅ 2 sous-admins
- ✅ 2 utilisateurs en attente
- ✅ 4+ utilisateurs avec rôles assignés
- ✅ 2+ entités enseignants
- ✅ 1+ entité parent
- ✅ 5+ entités étudiants
- ✅ 4+ activités d'administration
- ✅ 5+ classes, bourses, factures

## 🎉 Prêt à Tester !

Le système de rôles hiérarchiques est maintenant configuré et prêt pour les tests. Suivez les scénarios ci-dessus pour valider toutes les fonctionnalités ! 🚀
