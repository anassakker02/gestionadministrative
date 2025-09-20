const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ivLength = 16;

// It is CRITICAL to securely manage this key. Consider using Google Cloud KMS or Firebase Environment Configuration for sensitive keys.
// For now, we will use an environment variable. Ensure this is set securely in your Firebase Functions environment.
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "a_very_secret_key_of_at_least_32_chars"; // Must be 32 bytes (256 bits)

if (ENCRYPTION_KEY.length !== 32) {
  console.warn(
    "WARNING: ENCRYPTION_KEY is not 32 bytes long. Please generate a secure 32-byte key."
  );
}

const encrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text; // Return as is if null, undefined, or empty
  }
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY),
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
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

module.exports = { encrypt, decrypt };
