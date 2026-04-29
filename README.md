# Plateforme de Gestion Scolaire & Sécurité (YNOV 2026)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production-success.svg)
![Security](https://img.shields.io/badge/Security-WAF%20%7C%20SIEM%20%7C%20RBAC-red.svg)

Une solution complète de gestion administrative scolaire développée avec une architecture moderne, mettant l'accent sur la **sécurité applicative** et le **monitoring**.

## 🚀 Vue d'ensemble

Ce projet a été conçu pour répondre aux besoins critiques de gestion interne d'un établissement scolaire tout en intégrant des couches de sécurité robustes pour la protection des données sensibles (RGPD).

### 🛠 Stack Technique
- **Frontend :** React 18, TypeScript, Tailwind CSS, Shadcn UI.
- **Backend :** Node.js, Express, Firebase Cloud Functions.
- **Base de données :** Google Cloud Firestore (NoSQL).
- **Hébergement :** Firebase Hosting & Google Cloud Platform.
- **Sécurité & Monitoring :** Wazuh (SIEM), ModSecurity (WAF), Docker.

## 🛡️ Fonctionnalités de Sécurité (PFE)

Le projet intègre des mécanismes de défense avancés :

1.  **Web Application Firewall (WAF) :**
    - Filtrage des attaques SQL Injection, XSS, et Brute Force au niveau de la couche middleware.
    - Analyse en temps réel du trafic entrant.
2.  **SIEM & Monitoring (Wazuh) :**
    - Centralisation des logs d'accès et d'erreurs.
    - Détection d'intrusions (IDS) et analyse des vulnérabilités (CVE).
    - Surveillance de l'intégrité des fichiers (FIM).
3.  **Contrôle d'Accès RBAC :**
    - Gestion granulaire des rôles (Admin, Sous-Admin, Parent, Étudiant).
    - Sécurisation des routes API et des règles Firestore.
4.  **Conformité RGPD :**
    - Anonymisation des données.
    - Export des données personnelles et droit à l'oubli intégrés.

## 📈 Fonctionnalités Métier

- **Gestion des Étudiants :** Inscriptions, dossiers personnels, suivi académique.
- **Gestion Financière :** Facturation automatique, gestion des paiements, bourses d'études.
- **Portail Parents :** Consultation des soldes, historique des paiements et documents.
- **Tableau de Bord :** Statistiques en temps réel sur les effectifs et les revenus.

## 🏗 Architecture CI/CD

Le projet utilise un pipeline DevOps complet via GitLab CI/CD :
1.  **Linting & Tests :** Validation de la qualité du code et tests de sécurité.
2.  **Build :** Compilation optimisée du Frontend et du Backend.
3.  **Deploy :** Déploiement automatique vers Firebase Hosting et Cloud Functions.

## 📂 Structure du Projet

```text
├── front/                  # Application React (Vite + TS)
├── back/                   # Fonctions Firebase & Logique métier
│   └── functions/          # API REST & Middlewares de sécurité
├── wazuh-docker/           # Configuration du SIEM
└── LIVRABLES/              # Rapports techniques et documentation PFE
```

## 🛠 Installation Locale

1.  **Clonage du dépôt :**
    ```bash
    git clone https://github.com/anassakker02/gestionadministrative.git
    ```
2.  **Configuration :**
    - Installer les dépendances : `npm install` (dans root, front/ et back/functions/).
    - Configurer les fichiers `.env` à partir des `.env.example`.
3.  **Lancement :**
    - Frontend : `npm run dev`
    - Backend : `firebase serve` ou `npm run shell`

---
*Réalisé par **Anass Akker** dans le cadre du projet de fin d'études YNOV 2026.*
