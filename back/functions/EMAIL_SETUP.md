# Configuration de l'envoi d'emails

## Prérequis

1. **Compte Gmail** avec authentification à 2 facteurs activée
2. **App Password** généré pour l'application

## Étapes de configuration

### 1. Activer l'authentification à 2 facteurs

1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur "Sécurité"
3. Activez "Validation en 2 étapes"

### 2. Générer un App Password

1. Dans "Sécurité", cliquez sur "Mots de passe des applications"
2. Sélectionnez "Application" → "Autre (nom personnalisé)"
3. Entrez un nom (ex: "Gestion Frais Scolarité")
4. Cliquez sur "Générer"
5. **Copiez le mot de passe de 16 caractères** (vous ne le reverrez plus !)

### 3. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier `functions/` avec :

```bash
# Configuration Firebase
JWT_KEY_SECRET=votre_cle_secrete_jwt_ici

# Configuration Email (Gmail)
EMAIL=votre_email@gmail.com
PASSWORD=votre_app_password_ici

# Configuration Frontend
FRONTEND_URL=http://localhost:3000
```

### 4. Redémarrer le serveur

```bash
npm run serve
```

## Test de l'envoi d'emails

1. **Endpoint** : `POST /api/auth/send-password-reset`
2. **Body** : `{ "email": "test@example.com" }`
3. **Vérifiez** votre boîte de réception

## Dépannage

### Erreur "Invalid login"
- Vérifiez que l'authentification à 2 facteurs est activée
- Utilisez l'App Password, pas votre mot de passe principal

### Erreur "Less secure app access"
- Cette option n'est plus disponible
- Utilisez obligatoirement un App Password

### Erreur "Authentication failed"
- Vérifiez que l'EMAIL et PASSWORD sont corrects
- Redémarrez le serveur après modification du .env

## Sécurité

- **Ne committez jamais** le fichier `.env` dans Git
- **Utilisez des App Passwords** pour chaque environnement
- **Changez régulièrement** vos mots de passe
- **Limitez l'accès** aux comptes de service
