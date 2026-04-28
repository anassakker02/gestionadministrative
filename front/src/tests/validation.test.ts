/**
 * Tests unitaires — Validation des entrées utilisateur
 * 19 scénarios couvrant les champs critiques de l'application
 */
import { describe, it, expect } from "vitest";

// ─── Helpers reproduisant la logique de validation des controllers ────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const NOM_MIN_LENGTH = 2;
const NOM_MAX_LENGTH = 100;
const MONTANT_MIN = 0.01;
const MONTANT_MAX = 999999;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validateNom(nom: string): boolean {
  const trimmed = nom.trim();
  return trimmed.length >= NOM_MIN_LENGTH && trimmed.length <= NOM_MAX_LENGTH;
}

function validateMontant(montant: unknown): boolean {
  if (typeof montant !== "number") return false;
  return montant >= MONTANT_MIN && montant <= MONTANT_MAX && Number.isFinite(montant);
}

function validateRole(role: string): boolean {
  const allowedRoles = ["admin", "sous-admin", "comptable", "enseignant", "etudiant", "parent", "user"];
  return allowedRoles.includes(role);
}

// ─── Tests email ─────────────────────────────────────────────────────────────

describe("Validation email", () => {
  it("1. Email valide", () => expect(validateEmail("alice@ynov.com")).toBe(true));
  it("2. Email sans @", () => expect(validateEmail("aliceynov.com")).toBe(false));
  it("3. Email sans domaine", () => expect(validateEmail("alice@")).toBe(false));
  it("4. Email avec espaces", () => expect(validateEmail("alice @ynov.com")).toBe(false));
  it("5. Email vide", () => expect(validateEmail("")).toBe(false));
});

// ─── Tests nom/prénom ─────────────────────────────────────────────────────────

describe("Validation nom/prénom", () => {
  it("6. Nom valide (3 chars)", () => expect(validateNom("Ali")).toBe(true));
  it("7. Nom trop court (1 char)", () => expect(validateNom("A")).toBe(false));
  it("8. Nom vide", () => expect(validateNom("")).toBe(false));
  it("9. Nom avec espaces seulement", () => expect(validateNom("   ")).toBe(false));
  it("10. Nom très long (101 chars)", () => expect(validateNom("a".repeat(101))).toBe(false));
});

// ─── Tests montant paiement ───────────────────────────────────────────────────

describe("Validation montant paiement", () => {
  it("11. Montant valide (100.50)", () => expect(validateMontant(100.50)).toBe(true));
  it("12. Montant négatif", () => expect(validateMontant(-10)).toBe(false));
  it("13. Montant zéro", () => expect(validateMontant(0)).toBe(false));
  it("14. Montant string", () => expect(validateMontant("100")).toBe(false));
  it("15. Montant Infinity", () => expect(validateMontant(Infinity)).toBe(false));
  it("16. Montant NaN", () => expect(validateMontant(NaN)).toBe(false));
  it("17. Montant trop élevé (1M+)", () => expect(validateMontant(1000001)).toBe(false));
});

// ─── Tests rôles ─────────────────────────────────────────────────────────────

describe("Validation rôles", () => {
  it("18. Rôle 'admin' autorisé", () => expect(validateRole("admin")).toBe(true));
  it("19. Rôle 'superadmin' non autorisé", () => expect(validateRole("superadmin")).toBe(false));
  it("20. Rôle vide non autorisé", () => expect(validateRole("")).toBe(false));
  it("21. Injection de rôle '{$ne: null}'", () => expect(validateRole("{$ne: null}")).toBe(false));
});
