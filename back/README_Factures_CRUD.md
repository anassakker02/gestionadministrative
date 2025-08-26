# API CRUD des Factures - Documentation

## Vue d'ensemble

L'API des factures permet de gérer complètement le cycle de vie des factures de scolarité, incluant la création, la consultation, la mise à jour et la suppression des factures, ainsi que des fonctionnalités avancées comme la recherche, les statistiques et la gestion des échéances.

## Endpoints

### 1. Créer une facture
- **POST** `/factures`
- **Description** : Crée une nouvelle facture pour un étudiant
- **Corps de la requête** :
  ```json
  {
    "student_id": "string (requis)",
    "montant_total": "number (requis)",
    "statut": "string (requis) - payée|impayée|partielle|annulée|en_attente",
    "date_emission": "string (optionnel) - ISO date",
    "numero_facture": "string (optionnel) - généré automatiquement si non fourni",
    "pdf_url": "string (optionnel)",
    "description": "string (optionnel)",
    "echeances": "array (optionnel)",
    "remises": "array (optionnel)"
  }
  ```
- **Réponse de succès** (201) :
  ```json
  {
    "status": true,
    "message": "Facture créée avec succès",
    "data": {
      "id": "facture_id",
      "student_id": "student_id",
      "montant_total": 1500,
      "statut": "impayée",
      "numero_facture": "2024-000001",
      "date_emission": "2024-01-15T10:00:00.000Z",
      "montant_paye": 0,
      "montant_restant": 1500,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
  ```

### 2. Récupérer toutes les factures
- **GET** `/factures`
- **Description** : Récupère la liste paginée des factures avec filtres
- **Paramètres de requête** :
  - `page` : Numéro de page (défaut: 1)
  - `limit` : Nombre d'éléments par page (défaut: 10)
  - `statut` : Filtrer par statut
  - `student_id` : Filtrer par étudiant
  - `date_debut` : Date de début pour le filtre
  - `date_fin` : Date de fin pour le filtre
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": [
      {
        "id": "facture_id",
        "student_id": "student_id",
        "montant_total": 1500,
        "statut": "impayée",
        "numero_facture": "2024-000001",
        "etudiant": {
          "id": "student_id",
          "nom": "Dupont",
          "prenom": "Jean"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```

### 3. Récupérer une facture par ID
- **GET** `/factures/:id`
- **Description** : Récupère les détails complets d'une facture
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": {
      "student_id": "student_id",
      "montant_total": 1500,
      "statut": "impayée",
      "numero_facture": "2024-000001",
      "etudiant": {
        "id": "student_id",
        "nom": "Dupont",
        "prenom": "Jean"
      },
      "echeanciers": [
        {
          "id": "echeance_id",
          "date_echeance": "2024-02-15T00:00:00.000Z",
          "montant": 500
        }
      ],
      "montant_paye": 0,
      "montant_restant": 1500
    }
  }
  ```

### 4. Mettre à jour une facture
- **PUT** `/factures/:id`
- **Description** : Met à jour une facture existante
- **Corps de la requête** :
  ```json
  {
    "statut": "partielle",
    "montant_paye": 500,
    "description": "Mise à jour de la description"
  }
  ```
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "message": "Facture mise à jour avec succès",
    "data": {
      "id": "facture_id",
      "statut": "partielle",
      "montant_paye": 500,
      "montant_restant": 1000
    }
  }
  ```

### 5. Supprimer une facture
- **DELETE** `/factures/:id`
- **Description** : Supprime une facture (seulement si elle n'a pas d'échéanciers)
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "message": "Facture supprimée avec succès"
  }
  ```

### 6. Rechercher des factures
- **GET** `/factures/search?q=terme`
- **Description** : Recherche des factures par numéro
- **Paramètres de requête** :
  - `q` : Terme de recherche (requis)
  - `statut` : Filtrer par statut
  - `student_id` : Filtrer par étudiant
  - `date_debut` : Date de début
  - `date_fin` : Date de fin
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": [...],
    "searchTerm": "2024-000",
    "count": 5
  }
  ```

### 7. Statistiques des factures
- **GET** `/factures/stats`
- **Description** : Récupère les statistiques globales des factures
- **Paramètres de requête** :
  - `student_id` : Filtrer par étudiant
  - `date_debut` : Date de début
  - `date_fin` : Date de fin
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": {
      "total": 150,
      "parStatut": {
        "payée": 80,
        "impayée": 45,
        "partielle": 25
      },
      "montantTotal": 225000,
      "montantPaye": 150000,
      "montantRestant": 75000,
      "moyenneMontant": 1500,
      "parMois": {
        "2024-01": 25,
        "2024-02": 30
      },
      "parAnnee": {
        "2024": 150
      }
    }
  }
  ```

### 8. Factures par étudiant
- **GET** `/factures/etudiant/:student_id`
- **Description** : Récupère toutes les factures d'un étudiant spécifique
- **Paramètres de requête** :
  - `page` : Numéro de page
  - `limit` : Nombre d'éléments par page
  - `statut` : Filtrer par statut
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": [...],
    "etudiant": {
      "id": "student_id",
      "nom": "Dupont",
      "prenom": "Jean"
    },
    "pagination": {...}
  }
  ```

### 9. Factures par statut
- **GET** `/factures/statut/:statut`
- **Description** : Récupère toutes les factures d'un statut spécifique
- **Paramètres de requête** :
  - `page` : Numéro de page
  - `limit` : Nombre d'éléments par page
- **Réponse de succès** (200) :
  ```json
  {
    "status": true,
    "data": [...],
    "statut": "impayée",
    "pagination": {...}
  }
  ```

## Validation des données

### Champs obligatoires
- `student_id` : Doit référencer un étudiant existant
- `montant_total` : Doit être un nombre positif
- `statut` : Doit être une des valeurs autorisées

### Statuts autorisés
- `payée` : Facture entièrement payée
- `impayée` : Facture non payée
- `partielle` : Facture partiellement payée
- `annulée` : Facture annulée
- `en_attente` : Facture en attente de paiement

### Règles de validation
- Le montant payé ne peut pas dépasser le montant total
- Le statut est automatiquement mis à jour selon le montant payé
- Le numéro de facture est généré automatiquement si non fourni
- Une facture ne peut pas être supprimée si elle a des échéanciers

## Gestion des erreurs

### Codes d'erreur
- **400** : Données invalides ou manquantes
- **404** : Facture ou étudiant non trouvé
- **409** : Conflit (ex: numéro de facture dupliqué)
- **500** : Erreur interne du serveur

### Messages d'erreur
```json
{
  "status": false,
  "message": "Description de l'erreur",
  "error": "Détails techniques (en développement)"
}
```

## Relations avec d'autres entités

### Étudiant
- Chaque facture est liée à un étudiant via `student_id`
- Les informations de l'étudiant sont incluses dans les réponses

### Échéanciers
- Les factures peuvent avoir des échéanciers associés
- Les échéanciers empêchent la suppression de la facture

### Paiements
- Le montant payé et restant est calculé automatiquement
- Le statut est mis à jour selon les paiements

## Fonctionnalités avancées

### Génération automatique des numéros
- Format : `YYYY-NNNNNN` (année + séquence)
- Incrémentation automatique par année
- Vérification d'unicité

### Calculs automatiques
- `montant_restant = montant_total - montant_paye`
- Mise à jour automatique du statut selon le montant payé

### Filtres et recherche
- Filtrage par statut, étudiant, dates
- Recherche par numéro de facture
- Pagination avec métadonnées

### Statistiques
- Comptage par statut
- Calculs de montants totaux et moyens
- Répartition temporelle (mois/année)

## Exemples d'utilisation

### Créer une facture pour un étudiant
```bash
curl -X POST http://localhost:5001/api/factures \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student_123",
    "montant_total": 2000,
    "statut": "impayée",
    "description": "Frais de scolarité 2024"
  }'
```

### Récupérer les factures impayées
```bash
curl "http://localhost:5001/api/factures?statut=impayée&page=1&limit=20"
```

### Obtenir les statistiques
```bash
curl "http://localhost:5001/api/factures/stats?date_debut=2024-01-01&date_fin=2024-12-31"
```

## Notes importantes

1. **Sécurité** : Toutes les opérations sont protégées par authentification
2. **Performance** : La pagination est recommandée pour les grandes listes
3. **Intégrité** : Les relations avec les étudiants et échéanciers sont vérifiées
4. **Audit** : Toutes les modifications sont horodatées
5. **Flexibilité** : Les champs optionnels permettent une personnalisation avancée

## Support et maintenance

Pour toute question ou problème avec l'API des factures, consultez la documentation technique ou contactez l'équipe de développement.
