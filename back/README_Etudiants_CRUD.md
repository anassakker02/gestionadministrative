# CRUD Complet des Étudiants - API

## 🎯 Description
Le contrôleur des étudiants a été entièrement refactorisé pour fournir un CRUD (Create, Read, Update, Delete) complet avec validation des données, gestion des relations, et fonctionnalités avancées.

## 🚀 Fonctionnalités

### ✅ **CRUD de Base**
- **CREATE** : Créer un nouvel étudiant
- **READ** : Récupérer tous les étudiants ou un étudiant spécifique
- **UPDATE** : Mettre à jour un étudiant existant
- **DELETE** : Supprimer un étudiant

### 🔍 **Fonctionnalités Avancées**
- **Recherche** : Recherche d'étudiants par nom/prénom
- **Filtrage** : Filtrage par classe, nationalité, bourse
- **Pagination** : Pagination des résultats avec paramètres configurables
- **Statistiques** : Statistiques globales des étudiants
- **Relations** : Récupération des données liées (classe, parent, bourse)
- **Validation** : Validation complète des données d'entrée
- **Gestion d'erreurs** : Messages d'erreur clairs et appropriés

## 📋 Endpoints Disponibles

### 1. **POST** `/etudiants` - Créer un étudiant
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "date_naissance": "2005-03-15",
  "classe_id": "classe_id_example",
  "nationalite": "Française",
  "bourse_id": null
}
```

**Validation :**
- `nom` : Requis, minimum 2 caractères, unique avec prénom + date
- `prenom` : Requis, minimum 2 caractères
- `date_naissance` : Requis, format date valide, âge entre 3 et 25 ans
- `classe_id` : Requis, doit exister dans la collection classes
- `nationalite` : Requis, non vide
- `bourse_id` : Optionnel, doit exister dans la collection bourses

**Réponse :**
```json
{
  "status": true,
  "message": "Étudiant créé avec succès",
  "data": {
    "id": "auto_generated_id",
    "nom": "Dupont",
    "prenom": "Jean",
    "date_naissance": "2005-03-15",
    "classe_id": "classe_id_example",
    "nationalite": "Française",
    "bourse_id": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. **GET** `/etudiants` - Récupérer tous les étudiants
**Paramètres de requête :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `search` : Terme de recherche par nom/prénom
- `classe_id` : Filtrer par classe
- `nationalite` : Filtrer par nationalité
- `bourse_id` : Filtrer par bourse

**Exemple :**
```
GET /etudiants?page=1&limit=5&classe_id=classe_1&nationalite=Française
```

**Réponse :**
```json
{
  "status": true,
  "data": [
         {
       "id": "etudiant_id",
       "nom": "Dupont",
       "prenom": "Jean",
       "classe": { "id": "classe_id", "nom": "6ème A", "niveau": "6ème" },
       "bourse": { "id": "bourse_id", "nom": "Bourse d'excellence", "pourcentage_remise": 50 }
     }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

### 3. **GET** `/etudiants/search` - Rechercher des étudiants
**Paramètres :**
- `q` : Terme de recherche (requis, minimum 2 caractères)
- `classe_id` : Filtrer par classe
- `nationalite` : Filtrer par nationalité

**Exemple :**
```
GET /etudiants/search?q=Dupont&classe_id=classe_1
```

**Réponse :**
```json
{
  "status": true,
  "data": [...],
  "searchTerm": "Dupont",
  "count": 3
}
```

### 4. **GET** `/etudiants/stats` - Statistiques des étudiants
**Paramètres de requête :**
- `classe_id` : Statistiques pour une classe spécifique
- `nationalite` : Statistiques pour une nationalité spécifique

**Réponse :**
```json
{
  "status": true,
  "data": {
    "total": 150,
    "parClasse": {
      "classe_1": 25,
      "classe_2": 30
    },
    "parNationalite": {
      "Française": 100,
      "Marocaine": 30,
      "Autre": 20
    },
    "avecBourse": 45,
    "sansBourse": 105,
    "moyenneAge": 12
  }
}
```

### 5. **GET** `/etudiants/classe/:classe_id` - Étudiants par classe
**Paramètres de requête :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)

**Réponse :**
```json
{
  "status": true,
  "data": [...],
  "classe": {
    "id": "classe_id",
    "nom": "6ème A",
    "niveau": "6ème"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

### 6. **GET** `/etudiants/:id` - Récupérer un étudiant par ID
**Réponse :**
```json
{
  "status": true,
  "data": {
    "id": "etudiant_id",
    "nom": "Dupont",
    "prenom": "Jean",
    "date_naissance": "2005-03-15",
         "classe_id": "classe_id",
     "nationalite": "Française",
     "bourse_id": "bourse_id",
     "classe": { "id": "classe_id", "nom": "6ème A", "niveau": "6ème" },
     "bourse": { "id": "bourse_id", "nom": "Bourse d'excellence", "pourcentage_remise": 50 }
  }
}
```

### 7. **PUT** `/etudiants/:id` - Mettre à jour un étudiant
**Corps de la requête :**
```json
{
  "nom": "Nouveau nom",
  "prenom": "Nouveau prénom",
  "bourse_id": "nouvelle_bourse_id"
}
```

**Notes :**
- Mise à jour partielle supportée
- Validation des données
- Vérification de l'unicité
- Vérification des relations

### 8. **DELETE** `/etudiants/:id` - Supprimer un étudiant
**Validation :**
- Vérification de l'existence
- Vérification qu'aucune facture n'est associée
- Vérification qu'aucun échéancier n'est associé

## 🛡️ Validation et Sécurité

### **Validation des Données**
- **Nom/Prénom** : Minimum 2 caractères, non vide
- **Date de naissance** : Format valide, âge entre 3 et 25 ans
- **Relations** : Vérification de l'existence des entités liées
- **Unicité** : Vérification de l'unicité nom + prénom + date
- **Types** : Conversion automatique des types

### **Gestion des Erreurs**
- **400** : Données invalides ou relations inexistantes
- **404** : Étudiant non trouvé
- **409** : Conflit (étudiant avec mêmes informations)
- **500** : Erreur interne du serveur

### **Sécurité**
- Validation des entrées
- Protection contre les injections
- Vérification des relations avant suppression
- Gestion des contraintes d'intégrité

## 📊 Structure des Données

### **Modèle Étudiant**
```javascript
{
  id: "string",                    // Auto-généré
  nom: "string",                   // Nom de l'étudiant
  prenom: "string",                // Prénom de l'étudiant
  date_naissance: "string",        // Date de naissance (YYYY-MM-DD)
  classe_id: "string",             // ID de la classe
  parent_id: "string",             // ID du parent
  nationalite: "string",           // Nationalité
  bourse_id: "string|null",        // ID de la bourse (optionnel)
  createdAt: "Date",              // Date de création
  updatedAt: "Date"               // Date de dernière modification
}
```

### **Relations**
- **Classe** : Informations complètes de la classe
- **Bourse** : Informations complètes de la bourse

### **Index Firestore**
- Collection : `etudiants`
- Index sur : `nom` (pour la recherche)
- Index sur : `classe_id` (pour le filtrage)
- Index sur : `createdAt` (pour le tri)

## 🧪 Tests

### **Collection Postman**
Le fichier `Postman_Etudiants_CRUD.json` contient tous les tests nécessaires :

1. **Tests de Création**
   - Création réussie
   - Validation des erreurs
   - Vérification des relations

2. **Tests de Lecture**
   - Récupération de tous les étudiants
   - Pagination et filtres
   - Recherche
   - Statistiques
   - Étudiants par classe

3. **Tests de Mise à Jour**
   - Mise à jour complète
   - Mise à jour partielle
   - Gestion des erreurs

4. **Tests de Suppression**
   - Suppression réussie
   - Gestion des erreurs

## 🚀 Utilisation

### **1. Démarrer le serveur**
```bash
cd back/functions
npm install
firebase emulators:start --only functions
```

### **2. Importer la collection Postman**
- Ouvrir Postman
- Importer `Postman_Etudiants_CRUD.json`
- Configurer la variable `base_url`

### **3. Exécuter les tests**
- Tester individuellement chaque endpoint
- Exécuter toute la collection
- Vérifier les résultats dans la console

## 🔧 Configuration

### **Variables d'Environnement**
```javascript
// Dans Postman
base_url: "http://localhost:5001/votre-projet/us-central1/api/v1"
```

### **Données de Test Requises**
Avant d'exécuter les tests, assurez-vous d'avoir :
- Une classe existante (`classe_id_example`)
- Une bourse existante (`bourse_id_example`)

## 📝 Notes Importantes

### **Ordre des Routes**
Les routes sont ordonnées pour éviter les conflits :
1. Routes spéciales (`/search`, `/stats`, `/classe/:id`)
2. Routes avec paramètres (`/:id`)

### **Gestion des Relations**
- Vérification de l'existence des entités liées
- Protection contre la suppression d'étudiants avec factures/échéanciers
- Récupération des données complètes des relations

### **Performance**
- Pagination pour les grandes listes
- Index sur les champs de recherche et filtrage
- Limitation des résultats de recherche
- Chargement optimisé des relations

## 🐛 Dépannage

### **Erreurs Communes**

#### **1. Erreur de Validation**
```
Status: 400
Message: "Le nom, prénom, date de naissance, classe, parent et nationalité sont requis"
```
**Solution** : Vérifier que tous les champs obligatoires sont fournis

#### **2. Relation Inexistante**
```
Status: 400
Message: "La classe spécifiée n'existe pas"
```
**Solution** : Vérifier que les IDs des relations existent

#### **3. Conflit d'Unicité**
```
Status: 409
Message: "Un étudiant avec ces informations existe déjà"
```
**Solution** : Utiliser des informations uniques

#### **4. Étudiant Non Trouvé**
```
Status: 404
Message: "Étudiant non trouvé"
```
**Solution** : Vérifier l'ID de l'étudiant

#### **5. Erreur de Suppression**
```
Status: 400
Message: "Impossible de supprimer cet étudiant car il a des factures associées"
```
**Solution** : Supprimer d'abord les factures et échéanciers

### **Vérifications Préalables**
1. **Serveur démarré** : `firebase emulators:start --only functions`
2. **Base de données** : Données de test disponibles
3. **Relations** : Classes, parents et bourses existants
4. **Variables** : URLs et IDs correctement configurés

## 🔮 Améliorations Futures

- **Authentification** : Ajout de middleware d'authentification
- **Audit** : Logs des modifications
- **Cache** : Mise en cache des statistiques et relations
- **Export** : Export des données en CSV/Excel
- **Bulk Operations** : Opérations en lot
- **Notifications** : Notifications lors des modifications
- **Historique** : Historique des modifications

## 📞 Support

Pour toute question ou problème :
1. Vérifier la documentation de l'API
2. Consulter les logs du serveur
3. Vérifier la configuration des variables
4. Tester d'abord avec des outils simples (curl, Insomnia)
5. Vérifier l'existence des entités liées
