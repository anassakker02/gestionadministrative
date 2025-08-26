# CRUD Complet des Bourses - API

## 🎯 Description
Le contrôleur des bourses a été entièrement refactorisé pour fournir un CRUD (Create, Read, Update, Delete) complet avec validation des données, gestion d'erreurs et fonctionnalités avancées.

## 🚀 Fonctionnalités

### ✅ **CRUD de Base**
- **CREATE** : Créer une nouvelle bourse
- **READ** : Récupérer toutes les bourses ou une bourse spécifique
- **UPDATE** : Mettre à jour une bourse existante
- **DELETE** : Supprimer une bourse

### 🔍 **Fonctionnalités Avancées**
- **Recherche** : Recherche de bourses par nom
- **Pagination** : Pagination des résultats avec paramètres configurables
- **Statistiques** : Statistiques globales des bourses
- **Validation** : Validation complète des données d'entrée
- **Gestion d'erreurs** : Messages d'erreur clairs et appropriés

## 📋 Endpoints Disponibles

### 1. **POST** `/bourses` - Créer une bourse
```json
{
  "nom": "Bourse d'excellence",
  "pourcentage_remise": 50
}
```

**Validation :**
- `nom` : Requis, non vide, unique
- `pourcentage_remise` : Requis, entre 0 et 100

**Réponse :**
```json
{
  "status": true,
  "message": "Bourse créée avec succès",
  "data": {
    "id": "auto_generated_id",
    "nom": "Bourse d'excellence",
    "pourcentage_remise": 50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. **GET** `/bourses` - Récupérer toutes les bourses
**Paramètres de requête :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10)
- `search` : Terme de recherche par nom

**Exemple :**
```
GET /bourses?page=1&limit=5&search=excellence
```

**Réponse :**
```json
{
  "status": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

### 3. **GET** `/bourses/search` - Rechercher des bourses
**Paramètres :**
- `q` : Terme de recherche (requis)

**Exemple :**
```
GET /bourses/search?q=excellence
```

**Réponse :**
```json
{
  "status": true,
  "data": [...],
  "searchTerm": "excellence",
  "count": 3
}
```

### 4. **GET** `/bourses/stats` - Statistiques des bourses
**Réponse :**
```json
{
  "status": true,
  "data": {
    "total": 25,
    "totalRemise": 1250,
    "moyenneRemise": "50.00",
    "bourseMaxRemise": 100,
    "bourseMinRemise": 10
  }
}
```

### 5. **GET** `/bourses/:id` - Récupérer une bourse par ID
**Réponse :**
```json
{
  "status": true,
  "data": {
    "id": "bourse_id",
    "nom": "Bourse d'excellence",
    "pourcentage_remise": 50
  }
}
```

### 6. **PUT** `/bourses/:id` - Mettre à jour une bourse
**Corps de la requête :**
```json
{
  "nom": "Nouveau nom",
  "pourcentage_remise": 60
}
```

**Notes :**
- Mise à jour partielle supportée
- Validation des données
- Vérification de l'unicité du nom

### 7. **DELETE** `/bourses/:id` - Supprimer une bourse
**Validation :**
- Vérification de l'existence
- Vérification qu'aucun étudiant n'utilise cette bourse

## 🛡️ Validation et Sécurité

### **Validation des Données**
- **Nom** : Non vide, unique dans la base
- **Pourcentage** : Nombre entre 0 et 100
- **Types** : Conversion automatique des types

### **Gestion des Erreurs**
- **400** : Données invalides
- **404** : Ressource non trouvée
- **409** : Conflit (nom déjà existant)
- **500** : Erreur interne du serveur

### **Sécurité**
- Validation des entrées
- Protection contre les injections
- Vérification des relations avant suppression

## 📊 Structure des Données

### **Modèle Bourse**
```javascript
{
  id: "string",                    // Auto-généré
  nom: "string",                   // Nom de la bourse
  pourcentage_remise: "number",    // Pourcentage de remise (0-100)
  createdAt: "Date",              // Date de création
  updatedAt: "Date"               // Date de dernière modification
}
```

### **Index Firestore**
- Collection : `bourses`
- Index sur : `nom` (pour la recherche)
- Index sur : `createdAt` (pour le tri)

## 🧪 Tests

### **Collection Postman**
Le fichier `Postman_Bourses_CRUD.json` contient tous les tests nécessaires :

1. **Tests de Création**
   - Création réussie
   - Validation des erreurs

2. **Tests de Lecture**
   - Récupération de toutes les bourses
   - Pagination
   - Recherche
   - Statistiques

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
- Importer `Postman_Bourses_CRUD.json`
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

### **Firebase Configuration**
```javascript
// Vérifier que firebase.js est correctement configuré
const db = admin.firestore();
```

## 📝 Notes Importantes

### **Ordre des Routes**
Les routes sont ordonnées pour éviter les conflits :
1. Routes spéciales (`/search`, `/stats`)
2. Routes avec paramètres (`/:id`)

### **Gestion des Relations**
- Vérification des étudiants avant suppression
- Protection contre la suppression de bourses utilisées

### **Performance**
- Pagination pour les grandes listes
- Index sur les champs de recherche
- Limitation des résultats de recherche

## 🐛 Dépannage

### **Erreurs Communes**

#### **1. Erreur de Validation**
```
Status: 400
Message: "Le nom et le pourcentage de remise sont requis"
```
**Solution** : Vérifier que tous les champs requis sont fournis

#### **2. Conflit de Nom**
```
Status: 409
Message: "Une bourse avec ce nom existe déjà"
```
**Solution** : Utiliser un nom unique

#### **3. Bourse Non Trouvée**
```
Status: 404
Message: "Bourse non trouvée"
```
**Solution** : Vérifier l'ID de la bourse

#### **4. Erreur de Suppression**
```
Status: 400
Message: "Impossible de supprimer cette bourse car elle est attribuée à des étudiants"
```
**Solution** : Retirer la bourse des étudiants avant suppression

## 🔮 Améliorations Futures

- **Authentification** : Ajout de middleware d'authentification
- **Audit** : Logs des modifications
- **Cache** : Mise en cache des statistiques
- **Export** : Export des données en CSV/Excel
- **Bulk Operations** : Opérations en lot

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Consulter la documentation Firebase
3. Tester avec Postman
4. Vérifier la configuration des variables
