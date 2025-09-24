# Jeux de données de démonstration (Paiements et Plafonds)

Ce seed fournit 4 cas d’étudiants compatibles avec la règle de plafond du contrôleur des paiements.

Rappel du calcul du plafond côté backend:

- Le plafond = (Scolarité) + (Autres frais) pour la classe et l’année scolaire courante (ex: "2025").
- Si l’étudiant a une bourse, un pourcentage de remise est appliqué sur la scolarité uniquement, puis on additionne les Autres frais.
- Les paiements enregistrés pour l’étudiant ne doivent jamais dépasser ce plafond, sinon le backend renvoie 400.

Dans `src/utils/seedData.js`, les tarifs de l’année courante sont créés avec `annee_scolaire` = année en cours (ex: `new Date().getFullYear().toString()`), afin que le contrôleur retrouve bien les tarifs.

Cas insérés:

1. Étudiant 1 (sans bourse)

   - Classe: L1-INFO
   - Plafond attendu: 56 000 (Scolarité) + 800 (Autres frais) = 56 800 MAD
   - Facture: 56 800 MAD (payée)
   - Paiements: 10 000 + 20 000 + 26 800 = 56 800 (cap atteint)

2. Étudiant 2 (bourse 50%)

   - Classe: M1-MATH
   - Bourse: 50% sur la scolarité
   - Plafond attendu: 28 000 (Scolarité après bourse) + 800 (Autres frais) = 28 800 MAD
   - Facture: 28 800 MAD (payée)
   - Paiements: 15 000 + 13 800 = 28 800 (cap atteint)

3. Étudiant 3 (sans bourse)

   - Classe: L2-DESIGN
   - Plafond attendu: 56 800 MAD
   - Facture: 56 800 MAD (partiellement payée)
   - Paiements: 20 000 (reste 36 800)

4. Étudiant 4 (bourse 25%)
   - Classe: M2-INFO
   - Bourse: 25% sur la scolarité
   - Plafond attendu: 42 000 (Scolarité après bourse) + 800 = 42 800 MAD
   - Facture: 42 800 MAD (partiellement payée)
   - Paiements: 10 000 + 12 000 + 5 000 = 27 000 (reste 15 800)

Notes:

- Les collections vidées avant reseed: users, etudiants, classes, factures, paiements, parents, tarifs, bourses, auditLogs.
- Les bourses `bourse50` (50%) et `bourse25` (25%) sont créées et associées aux étudiants 2 et 4.
- Les champs de compatibilité sont respectés: `etudiant_id` et `student_id` côté facture, `qui_a_paye` contient toujours l’ID de l’étudiant, `payer_user_id` est l’acteur réel (parent/admin) pour l’audit.

Exécution:

- Assurez-vous que la configuration Firebase Admin est opérationnelle (émulateur ou clés de service).
- Lancez le seeder depuis le dossier `functions`. Si vous utilisez l’émulateur, démarrez-le avant.

Après seed:

- Le Dashboard des paiements doit refléter ces quatre situations (payé, partiel, avec/sans bourse) et les totaux/états doivent correspondre aux plafonds.
