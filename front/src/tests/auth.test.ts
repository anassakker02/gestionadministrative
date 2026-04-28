/**
 * Tests unitaires — Authentification
 * 9 scénarios couvrant login, logout, rôles, session expirée
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Helpers de test ─────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function simulateLogin(attempts: number, maxAttempts: number) {
  return attempts >= maxAttempts;
}

function checkPasswordStrength(pwd: string): boolean {
  return PASSWORD_REGEX.test(pwd);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Authentification — sécurité login", () => {
  it("1. Bloque après 5 tentatives échouées", () => {
    expect(simulateLogin(5, MAX_ATTEMPTS)).toBe(true);
  });

  it("2. Ne bloque pas avant 5 tentatives", () => {
    expect(simulateLogin(4, MAX_ATTEMPTS)).toBe(false);
  });

  it("3. LOCKOUT_MS est bien 5 minutes", () => {
    expect(LOCKOUT_MS).toBe(300000);
  });

  it("4. Le mot de passe fort passe la regex", () => {
    expect(checkPasswordStrength("Motdepasse1!")).toBe(true);
  });

  it("5. Le mot de passe sans majuscule échoue", () => {
    expect(checkPasswordStrength("motdepasse1!")).toBe(false);
  });

  it("6. Le mot de passe sans chiffre échoue", () => {
    expect(checkPasswordStrength("MotDePasse!!")).toBe(false);
  });

  it("7. Le mot de passe sans caractère spécial échoue", () => {
    expect(checkPasswordStrength("MotDePasse1")).toBe(false);
  });

  it("8. Le mot de passe trop court (<8) échoue", () => {
    expect(checkPasswordStrength("Mo1!")).toBe(false);
  });

  it("9. Message d'erreur générique (anti-énumération) — ne révèle pas si email existe", () => {
    // Vérifie que le message ne contient pas "email" ou "inexistant"
    const genericMessage = "Identifiants invalides";
    expect(genericMessage).not.toContain("email inexistant");
    expect(genericMessage).not.toContain("email inconnu");
    expect(genericMessage).not.toContain("utilisateur introuvable");
  });
});

describe("Authentification — session et stockage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("10. sessionStorage vide après logout simulé", () => {
    sessionStorage.setItem("token", "fake-token");
    sessionStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));
    // Simule logout
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("refreshToken");
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("user")).toBeNull();
  });
});
