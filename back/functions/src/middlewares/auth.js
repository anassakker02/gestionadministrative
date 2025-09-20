const jwt = require("jsonwebtoken");
const db = require("../config/firebase");

const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("[AUTH MIDDLEWARE] Authorization header:", authHeader);
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    console.warn("[AUTH MIDDLEWARE] No token provided");
    return res
      .status(401)
      .json({ status: false, message: "Accès refusé. Aucun token fourni." });
  }

  try {
    console.log(
      "[AUTH MIDDLEWARE] Backend JWT_SECRET (trimmed):",
      typeof process.env.JWT_SECRET === "string"
        ? process.env.JWT_SECRET.substr(0, 10) + "..."
        : process.env.JWT_SECRET
    );
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[AUTH MIDDLEWARE] Token verified, payload:", decoded);
    req.user = decoded; // Attach user payload to the request object
    next();
  } catch (error) {
    console.error(
      "[AUTH MIDDLEWARE] Authentication error:",
      error && error.message ? error.message : error
    );
    if (error && error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          status: false,
          message: "Token expiré.",
          code: "TOKEN_EXPIRED",
        });
    }
    return res
      .status(401)
      .json({
        status: false,
        message: "Token invalide.",
        code: "INVALID_TOKEN",
      });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({
          status: false,
          message: "Accès refusé. Rôle utilisateur non défini.",
        });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          status: false,
          message: "Accès refusé. Vous n'avez pas la permission nécessaire.",
        });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
