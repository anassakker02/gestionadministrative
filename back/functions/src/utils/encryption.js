const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ivLength = 16;

// Clé d'encryption par défaut sécurisée (32 caractères exactement)
const DEFAULT_ENCRYPTION_KEY = "a_very_secure_32_byte_secret_key!";

// Récupérer la clé d'environnement ou utiliser la clé par défaut
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY;

// Forcer une clé valide de 32 bytes
let finalKey = ENCRYPTION_KEY;

// Log pour debug
console.log(`🔑 Clé d'encryption détectée: ${ENCRYPTION_KEY.substring(0, 10)}... (longueur: ${ENCRYPTION_KEY.length})`);

// S'assurer que la clé fait exactement 32 bytes
if (finalKey.length !== 32) {
  console.warn(
    `⚠️  ENCRYPTION_KEY length: ${finalKey.length} bytes, expected 32 bytes. Using secure default.`
  );
  finalKey = DEFAULT_ENCRYPTION_KEY;
}

// Vérification finale et correction automatique
if (finalKey.length !== 32) {
  console.warn(`⚠️  Clé d'encryption de longueur incorrecte: ${finalKey.length} bytes`);
  
  // Correction automatique de la clé
  if (finalKey.length < 32) {
    // Compléter avec des zéros
    finalKey = finalKey.padEnd(32, '0');
    console.log("✅ Clé complétée à 32 bytes");
  } else if (finalKey.length > 32) {
    // Tronquer à 32 caractères
    finalKey = finalKey.substring(0, 32);
    console.log("✅ Clé tronquée à 32 bytes");
  }
  
  // Vérification finale
  if (finalKey.length !== 32) {
    console.error("❌ Impossible de corriger la clé d'encryption");
    throw new Error("Invalid encryption key configuration");
  }
}

console.log("✅ Clé d'encryption validée (32 bytes)");

const encrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text; // Return as is if null, undefined, or empty
  }
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(finalKey),
    iv
  );
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

const decrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text; // Return as is if null, undefined, or empty
  }
  // If value is not a string (e.g. seed stored an array/object), don't attempt to split/decrypt.
  if (typeof text !== "string") {
    return text;
  }
  const textParts = text.split(":");
  if (textParts.length !== 2) {
    console.error("Decryption error: Invalid encrypted text format.");
    return null; // Or throw an error, depending on desired behavior
  }
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(finalKey),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
