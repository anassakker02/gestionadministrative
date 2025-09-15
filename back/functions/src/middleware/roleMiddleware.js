// Middleware de vérification des rôles

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res
        .status(403)
        .json({
          message:
            "Accès refusé : utilisateur non authentifié ou rôle manquant",
        });
    }
    if (!allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: `Accès refusé : rôle '${user.role}' non autorisé` });
    }
    next();
  };
}

module.exports = { authorizeRoles };
