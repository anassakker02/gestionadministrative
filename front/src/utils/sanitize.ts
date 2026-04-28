/**
 * sanitize.ts — Anti-XSS avec DOMPurify
 * Utiliser avant toute écriture d'input utilisateur en base ou dans le DOM.
 */
import DOMPurify from "dompurify";

/**
 * Nettoie une chaîne de caractères en supprimant tout HTML/JS injecté.
 * Aucune balise HTML autorisée — texte brut uniquement.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Nettoie un objet dont toutes les valeurs string sont des entrées utilisateur.
 * Exemple : sanitizeObject({ nom: '<script>alert(1)</script>', prenom: 'Alice' })
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(result[key] as string);
    }
  }
  return result;
}
