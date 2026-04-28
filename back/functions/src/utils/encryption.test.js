const { encrypt, decrypt } = require("./encryption");

describe("Encryption Utility", () => {
  const testSecret = "This is a secret message";

  test("should encrypt and decrypt correctly", () => {
    const encrypted = encrypt(testSecret);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(testSecret);
    expect(encrypted).toContain(":");

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(testSecret);
  });

  test("should return null or input for invalid inputs", () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeUndefined();
    expect(encrypt("")).toBe("");

    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeUndefined();
    expect(decrypt("")).toBe("");
    expect(decrypt("invalidformat")).toBeNull();
  });

  test("should return input if text is not a string during decryption", () => {
    const obj = { key: "value" };
    expect(decrypt(obj)).toBe(obj);
  });

  test("should produce different ciphertexts for the same plaintext (due to random IV)", () => {
    const encrypted1 = encrypt(testSecret);
    const encrypted2 = encrypt(testSecret);
    expect(encrypted1).not.toBe(encrypted2);

    // Both should decrypt to the same secret
    expect(decrypt(encrypted1)).toBe(testSecret);
    expect(decrypt(encrypted2)).toBe(testSecret);
  });
});
