/**
 * Tests unitaires — sanitize.ts (Anti-XSS DOMPurify)
 * 8 scénarios couvrant les attaques XSS les plus courantes
 */
import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeObject } from "@/utils/sanitize";

describe("sanitizeText — protection XSS", () => {
  it("1. Supprime les balises <script>", () => {
    const result = sanitizeText('<script>alert("xss")</script>Bonjour');
    expect(result).not.toContain("<script>");
    expect(result).toContain("Bonjour");
  });

  it("2. Supprime les balises <img> avec onerror", () => {
    const result = sanitizeText('<img src=x onerror=alert(1)>');
    expect(result).not.toContain("<img");
    expect(result).not.toContain("onerror");
  });

  it("3. Supprime les balises <a> avec javascript:", () => {
    const result = sanitizeText('<a href="javascript:alert(1)">clic</a>');
    expect(result).not.toContain("<a");
    expect(result).not.toContain("javascript:");
  });

  it("4. Supprime les balises <svg> avec onload", () => {
    const result = sanitizeText('<svg onload=alert(1)>');
    expect(result).not.toContain("<svg");
    expect(result).not.toContain("onload");
  });

  it("5. Conserve le texte brut sans modification", () => {
    const result = sanitizeText("Alice Dupont");
    expect(result).toBe("Alice Dupont");
  });

  it("6. Supprime les entités HTML encodées malicieuses", () => {
    const result = sanitizeText("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result).not.toContain("<script>");
  });

  it("7. Gère les chaînes vides", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("8. Supprime les balises <iframe>", () => {
    const result = sanitizeText('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain("<iframe");
  });
});

describe("sanitizeObject — nettoyage d'objets", () => {
  it("Nettoie toutes les valeurs string d'un objet", () => {
    const input = {
      nom: '<script>alert(1)</script>Alice',
      prenom: "Bob",
      age: 25,
    };
    const result = sanitizeObject(input);
    expect(result.nom).not.toContain("<script>");
    expect(result.prenom).toBe("Bob");
    expect(result.age).toBe(25);
  });
});
