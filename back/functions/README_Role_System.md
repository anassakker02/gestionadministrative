# Système de Rôles Hiérarchiques - Seeds et Documentation

## 🎯 Vue d'ensemble

Ce système implémente une hiérarchie de rôles complète pour la gestion scolaire avec :

- **Admin principal** : Contrôle total, création de sous-admins
- **Sous-admins** : Gestion des utilisateurs, assignation de rôles (créés par l'admin)
- **Utilisateurs en attente** : S'inscrivent sans rôle, attendent l'assignation
- **Rôles fonctionnels** : Enseignant, Parent, Étudiant avec entités correspondantes

## 🗄️ Structure des Collections

### `users` (Collection principale)

```javascript
{
  email: string,
  password: string (hashed),
  nom: string,
  prenom: string,
  role: 'admin' | 'sub-admin' | 'enseignant' | 'parent' | 'etudiant' | null,
  isActive: boolean,
  telephone: string,
  adresse: string,
  created_by: string | null,        // ID de l'admin créateur (pour sous-admins)
  assigned_by: string | null,       // ID de qui a assigné le rôle
  role_assigned_at: Date | null,    // Date d'assignation du rôle
  emailNotifications: boolean,
  smsNotifications: boolean,
  createdAt: Date
}
```

### `enseignants` (Entités spécialisées)

```javascript
{
  user_id: string,                  // Référence vers users
  nom: string,
  prenom: string,
  email: string,
  telephone: string,
  adresse: string,
  specialite: string,
  statut: 'actif' | 'inactif',
  experience_annees: number,
  diplome: string,
  createdAt: Date
}
```

### `parents` (Entités spécialisées)

```javascript
{
  user_id: string,                  // Référence vers users
  nom: string,
  prenom: string,
  email: string,
  telephone: string,
  adresse: string,
  profession: string,
  situation_familiale: string,
  nombre_enfants: number,
  createdAt: Date
}
```

### `etudiants` (Entités spécialisées)

```javascript
{
  user_id: string | null,           // Référence vers users (optionnel)
  nom: string,
  prenom: string,
  email: string,
  telephone: string,
  adresse: string,
  date_naissance: Date,
  classe_id: string,
  nationalite: string,
  bourse_id: string | null,
  parentId: string,
  exemptions: string[],
  anneeScolaire: string,
  createdAt: Date
}
```

### `admin_activities` (Traçabilité)

```javascript
{
  type: 'user_creation' | 'role_assignment' | 'entity_creation',
  admin_id: string,                 // ID de l'admin qui a fait l'action
  target_user_id: string,           // ID de l'utilisateur cible
  action: string,                   // Description de l'action
  details: object,                  // Détails spécifiques
  timestamp: Date,
  createdAt: Date
}
```

## 🚀 Utilisation des Seeds

### Commandes disponibles :

```bash
# Seed complet avec nettoyage préalable
node seedRoleSystem.js --clear

# Seed sans nettoyage (ajoute aux données existantes)
node seedRoleSystem.js

# Seed original (ancienne version)
node seedRunner.js
```

### Comptes de test créés :

| Rôle         | Email                 | Mot de passe | Permissions                  |
| ------------ | --------------------- | ------------ | ---------------------------- |
| Admin        | admin@ecole.com       | password123  | Tout + création sous-admins  |
| Sous-admin 1 | subadmin1@ecole.com   | password123  | Gestion utilisateurs         |
| Sous-admin 2 | subadmin2@ecole.com   | password123  | Gestion utilisateurs         |
| Enseignant 1 | enseignant1@ecole.com | password123  | Fonctionnalités enseignant   |
| Enseignant 2 | enseignant2@ecole.com | password123  | Fonctionnalités enseignant   |
| Parent       | parent1@ecole.com     | password123  | Suivi enfants                |
| Étudiant     | etudiant1@ecole.com   | password123  | Consultation frais/paiements |

### Utilisateurs en attente (sans rôle) :

- pending1@ecole.com / password123
- pending2@ecole.com / password123

## 📋 Workflows Testables

### 1. Connexion Admin

```
1. Se connecter avec admin@ecole.com
2. Accéder au dashboard admin
3. Voir les statistiques utilisateurs
4. Consulter les utilisateurs en attente
```

### 2. Création de Sous-Admin

```
1. Connecté en tant qu'admin
2. Aller au formulaire "Créer Sous-Admin"
3. Remplir le formulaire
4. Vérifier la création et les permissions
```

### 3. Assignation de Rôles

```
1. Connecté en tant qu'admin ou sous-admin
2. Sélectionner un rôle dans le dropdown
3. Assigner à un utilisateur en attente
4. Vérifier la création automatique de l'entité
```

### 4. Test des Permissions

```
1. Se connecter avec différents rôles
2. Vérifier l'accès aux fonctionnalités
3. Tester les redirections dashboard
4. Valider les restrictions UI
```

## 🔄 Flux de Données

### Création d'un Sous-Admin

```
Admin → CreateSubAdminForm → API /auth/create-sub-admin → Users Collection
                                ↓
                           Entité User avec role='sub-admin'
                                ↓
                           Admin_activities (traçabilité)
```

### Assignation de Rôle

```
Admin/Sous-admin → UserRoleAssignment → API /auth/assign-role
                        ↓
                   Update User.role
                        ↓
                   Create Entity (enseignants/parents/etudiants)
                        ↓
                   Admin_activities (traçabilité)
```

## 🎨 Interface Utilisateur

### Dashboard Admin (`AdminDashboard.tsx`)

- Statistiques en temps réel
- Cartes métriques avec icônes
- Formulaire création sous-admin
- Interface assignation rôles
- Répartition visuelle par rôle

### Assignation de Rôles (`UserRoleAssignment.tsx`)

- Liste utilisateurs en attente
- Sélecteur de rôle
- Actions d'assignation
- Feedback visuel

### Création Sous-Admin (`CreateSubAdminForm.tsx`)

- Formulaire complet
- Validation champs
- Permissions admin uniquement
- Gestion erreurs

## 🔐 Système de Permissions

### Côté Backend

```javascript
// Classe User - Méthodes principales
canCreateSubAdmin(); // Admin principal seulement
canAssignRoles(); // Admin + sous-admins
assignRole(userId, role); // Avec création entité
createRoleEntity(user, role); // Factory pattern
```

### Côté Frontend

```javascript
// AuthContext - Permissions
canManageUsers; // Admin + sous-admins
canCreateSubAdmin; // Admin principal
isAdmin, isSubAdmin; // Checks de rôle
isParent, isEnseignant, isEtudiant; // Rôles fonctionnels
```

## 📊 Données de Test Incluses

- **9 utilisateurs** avec hiérarchie complète
- **2 entités enseignants** avec spécialités
- **1 entité parent** avec informations familiales
- **1 entité étudiant** liée à un utilisateur
- **5 classes** de différents niveaux
- **5 bourses** avec critères variés
- **Factures et paiements** pour tests financiers
- **Activités admin** pour traçabilité

## 🛠️ Extensions Possibles

1. **Rôles granulaires** : Permissions plus fines par module
2. **Audit trail** : Historique complet des modifications
3. **Notifications** : Alertes pour nouvelles inscriptions
4. **Bulk operations** : Actions en masse sur utilisateurs
5. **API statistics** : Endpoints pour métriques avancées

## 🔍 Debugging

### Vérifier les seeds :

```bash
# Se connecter à l'émulateur Firestore
# Aller sur http://localhost:4000
# Consulter les collections créées
```

### Tester les APIs :

```bash
# Login admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecole.com","password":"password123"}'

# Récupérer utilisateurs en attente
curl -X GET http://localhost:5000/users/pending \
  -H "Authorization: Bearer <token>"
```

Cette documentation couvre l'ensemble du nouveau système de rôles hiérarchiques implémenté ! 🎯
