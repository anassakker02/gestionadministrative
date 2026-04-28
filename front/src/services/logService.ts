/**
 * logService.ts — Logs de sécurité côté frontend
 * Les logs sont envoyés au backend via l'API existante.
 * Ils sont stockés dans Firestore (collection "logs") — append-only.
 */
import { apiRequest } from "@/lib/api";

export type LogEventType =
  | "auth_success"
  | "auth_failure"
  | "auth_lockout"
  | "logout"
  | "access_denied"
  | "session_expired"
  | "password_changed"
  | "register_attempt";

interface LogPayload {
  type: LogEventType;
  email?: string;
  path?: string;
  role?: string;
  details?: Record<string, unknown>;
}

/**
 * Envoie un événement de sécurité au backend pour persister dans Firestore.
 * Silencieux en cas d'erreur (ne doit jamais bloquer l'UX).
 */
export async function logEvent(payload: LogPayload): Promise<void> {
  try {
    await apiRequest("/logs", "POST", {
      ...payload,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Silencieux — le logging ne doit jamais faire planter l'application
  }
}

// ─── Helpers sémantiques ─────────────────────────────────────────────────────

export const logAuthSuccess = (email: string) =>
  logEvent({ type: "auth_success", email });

export const logAuthFailure = (email: string) =>
  logEvent({ type: "auth_failure", email });

export const logAuthLockout = (email: string) =>
  logEvent({ type: "auth_lockout", email });

export const logLogout = () =>
  logEvent({ type: "logout" });

export const logAccessDenied = (path: string, role?: string) =>
  logEvent({ type: "access_denied", path, role });

export const logSessionExpired = () =>
  logEvent({ type: "session_expired" });
