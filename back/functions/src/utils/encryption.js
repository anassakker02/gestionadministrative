const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ivLength = 16;

// ─── Clé obligatoire via variable d'environnement ─────────────────────────────
// Générer avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Puis : firebase functions:secrets:set ENCRYPTION_KEY
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    "[SECURITY] ENCRYPTION_KEY est manquante. Définissez-la dans les variables d'environnement.\n" +
    "Générez une clé sécurisée : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

let finalKey = process.env.ENCRYPTION_KEY;

// S'assurer que la clé fait exactement 32 bytes
if (Buffer.byteLength(finalKey, "utf8") < 32) {
  throw new Error(
    `[SECURITY] ENCRYPTION_KEY trop courte (${Buffer.byteLength(finalKey, "utf8")} bytes). Doit faire exactement 32 bytes.`
  );
}

// Tronquer si trop longue (utiliser les 32 premiers bytes)
finalKey = Buffer.from(finalKey, "utf8").slice(0, 32);

const encrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, finalKey, iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  if (typeof text !== "string") {
    return text;
  }
  const textParts = text.split(":");
  if (textParts.length !== 2) {
    return null;
  }
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedText = textParts[1];
  const decipher = crypto.createDecipheriv(algorithm, finalKey, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
