import { useEffect, useState } from "react";
import {
  getSecurityMonitoring,
  getHealthStatus,
  MonitoringData,
  HealthData,
} from "@/services/monitoringService";

// ── Labels & couleurs des événements ──────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  auth_success:    "Connexion réussie",
  AUTH_SUCCESS:    "Connexion réussie",
  auth_failure:    "Échec connexion",
  AUTH_FAILURE:    "Échec connexion",
  auth_lockout:    "Blocage brute force",
  AUTH_LOCKOUT:    "Blocage brute force",
  access_denied:   "Accès refusé (RBAC)",
  ACCESS_DENIED:   "Accès refusé (RBAC)",
  session_expired: "Session expirée",
  SESSION_EXPIRED: "Session expirée",
  logout:          "Déconnexion",
  LOGOUT:          "Déconnexion",
  data_export:     "Export RGPD (Art.15)",
  DATA_EXPORT:     "Export RGPD (Art.15)",
  data_anonymize:  "Anonymisation RGPD (Art.17)",
  DATA_ANONYMIZE:  "Anonymisation RGPD (Art.17)",
  WAF_BLOCK:       "WAF — Attaque bloquée",
  waf_block:       "WAF — Attaque bloquée",
};

const EVENT_COLORS: Record<string, string> = {
  auth_failure:    "bg-red-100 text-red-700 border border-red-300",
  AUTH_FAILURE:    "bg-red-100 text-red-700 border border-red-300",
  auth_lockout:    "bg-red-200 text-red-900 border border-red-400 font-bold",
  AUTH_LOCKOUT:    "bg-red-200 text-red-900 border border-red-400 font-bold",
  access_denied:   "bg-orange-100 text-orange-700 border border-orange-300",
  ACCESS_DENIED:   "bg-orange-100 text-orange-700 border border-orange-300",
  auth_success:    "bg-green-100 text-green-700 border border-green-300",
  AUTH_SUCCESS:    "bg-green-100 text-green-700 border border-green-300",
  session_expired: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  SESSION_EXPIRED: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  data_export:     "bg-blue-100 text-blue-700 border border-blue-300",
  DATA_EXPORT:     "bg-blue-100 text-blue-700 border border-blue-300",
  data_anonymize:  "bg-purple-100 text-purple-700 border border-purple-300",
  DATA_ANONYMIZE:  "bg-purple-100 text-purple-700 border border-purple-300",
  logout:          "bg-gray-100 text-gray-600 border border-gray-300",
  LOGOUT:          "bg-gray-100 text-gray-600 border border-gray-300",
  WAF_BLOCK:       "bg-rose-200 text-rose-900 border border-rose-400 font-bold",
  waf_block:       "bg-rose-200 text-rose-900 border border-rose-400 font-bold",
};

const WAF_TYPE_LABELS: Record<string, string> = {
  SQL_INJECTION:      "Injection SQL",
  XSS:                "Cross-Site Scripting",
  PATH_TRAVERSAL:     "Path Traversal",
  CMD_INJECTION:      "Injection de commande",
  SUSPICIOUS_AGENT:   "Agent suspect (scanner)",
  UNKNOWN:            "Autre",
};

// ── Composants utilitaires ─────────────────────────────────────────────────────
function SectionTitle({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border-l-4 ${color} mb-4`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ value, label, sublabel, color }: { value: number; label: string; sublabel?: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 text-center ${color}`}>
      <div className="text-4xl font-bold mb-1">{value}</div>
      <div className="text-sm font-semibold">{label}</div>
      {sublabel && <div className="text-xs opacity-60 mt-0.5">{sublabel}</div>}
    </div>
  );
}

function AlertBanner({ active, level, message }: { active: boolean; level: "critical" | "warning"; message: string }) {
  if (!active) return null;
  const styles = level === "critical"
    ? "bg-red-600 text-white border-red-700 animate-pulse"
    : "bg-orange-100 text-orange-800 border-orange-400";
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${styles}`}>
      <span>{level === "critical" ? "🚨" : "⚠️"}</span>
      {message}
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
      <span>{ok ? "✅" : "❌"}</span> {label}
    </div>
  );
}

// ── Score de sécurité ──────────────────────────────────────────────────────────
function SecurityScore({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const bg    = score >= 80 ? "bg-green-50 border-green-300" : score >= 60 ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300";
  const label = score >= 80 ? "Bon" : score >= 60 ? "Moyen" : "Critique";
  const bar   = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-0.5">Score de sécurité</p>
          <p className="text-xs text-gray-400">Calculé sur les 24 dernières heures</p>
        </div>
        <div className="text-right">
          <span className={`text-5xl font-black ${color}`}>{score}</span>
          <span className={`text-xl font-bold ${color}`}>/100</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div className={`h-3 rounded-full transition-all duration-700 ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0</span>
        <span className={`font-semibold ${color}`}>{label}</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function Monitoring() {
  const [data, setData]               = useState<MonitoringData | null>(null);
  const [health, setHealth]           = useState<HealthData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab]     = useState<"dashboard" | "waf" | "siem">("dashboard");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mon, hlt] = await Promise.all([getSecurityMonitoring(), getHealthStatus()]);
      setData(mon);
      setHealth(hlt);
      setLastRefresh(new Date());
    } catch {
      setError("Impossible de charger les données. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const hasAlerts = data && (
    data.alerts.bruteForce || data.alerts.accessEscalation ||
    data.alerts.manyLockouts || data.alerts.wafAttack
  );

  const totalAlerts = data ? [
    data.alerts.bruteForce,
    data.alerts.manyLockouts,
    data.alerts.accessEscalation,
    data.alerts.wafAttack,
  ].filter(Boolean).length : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🛡️ Monitoring de Sécurité — SIEM
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Section 3.3 — RGPD · RBAC · Journalisation · WAF · Scanner DAST
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalAlerts > 0 && (
            <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
              {totalAlerts} alerte{totalAlerts > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-gray-400">
            Mis à jour : {lastRefresh.toLocaleTimeString("fr-FR")} (60s)
          </span>
          <button onClick={load} disabled={loading} className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50">
            {loading ? "⟳" : "↻"} Rafraîchir
          </button>
        </div>
      </div>

      {/* ── Erreur ── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* ── Santé API + Score ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 flex items-center justify-between ${health?.status ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{health?.status ? "🟢" : "🔴"}</span>
            <div>
              <span className="font-bold text-gray-800">API Firebase — {health?.status ? "En ligne" : "Hors ligne"}</span>
              <span className="ml-3 text-sm text-gray-500">v{health?.version}</span>
            </div>
          </div>
          {health && (
            <div className="text-right text-xs text-gray-500 space-y-0.5">
              <div>Uptime : <strong>{Math.round((health.uptime || 0) / 60)} min</strong></div>
              <div>Mémoire : <strong>{health.memory?.used} / {health.memory?.total}</strong></div>
            </div>
          )}
        </div>
        {data && <SecurityScore score={data.securityScore ?? 100} />}
      </div>

      {loading && !data && (
        <div className="text-center py-16 text-gray-400 text-sm">Chargement des audit logs Firestore...</div>
      )}

      {data && (
        <>
          {/* ── Alertes actives ── */}
          {hasAlerts ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest">⚠️ Alertes de sécurité actives</p>
              <AlertBanner active={data.alerts.bruteForce}       level="critical" message="Attaque brute force — plus de 20 échecs de connexion en 24h" />
              <AlertBanner active={data.alerts.manyLockouts}     level="critical" message="Nombreux blocages — plus de 5 comptes bloqués en 24h" />
              <AlertBanner active={data.alerts.accessEscalation} level="warning"  message="Tentatives d'escalade de privilèges — plus de 10 accès refusés en 24h" />
              <AlertBanner active={data.alerts.wafAttack}        level="critical" message="Attaque WAF en cours — plus de 10 requêtes malveillantes bloquées en 24h" />
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              ✅ Aucune alerte de sécurité active — Surveillance normale
            </div>
          )}

          {/* ── Onglets ── */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1">
              {([
                { id: "dashboard", label: "📊 Dashboard" },
                { id: "waf",       label: "🛡️ WAF" },
                { id: "siem",      label: "📋 SIEM — Logs" },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-gray-800 text-gray-800"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ONGLET DASHBOARD                                                   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">

              {/* SECTION 1 — ACCÈS SÉCURISÉ */}
              <div>
                <SectionTitle icon="🔐" title="1. Accès Sécurisé" subtitle="Auth · Brute force · Rate limiting · JWT · Timeout" color="border-blue-500 bg-blue-50" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatBox value={data.summary.auth_success}    label="Connexions réussies"  sublabel="24h" color="border-green-200 bg-green-50 text-green-800" />
                  <StatBox value={data.summary.auth_failure}    label="Échecs connexion"      sublabel="24h" color="border-red-200 bg-red-50 text-red-800" />
                  <StatBox value={data.summary.auth_lockout}    label="Comptes bloqués"       sublabel="24h — brute force" color="border-red-300 bg-red-100 text-red-900" />
                  <StatBox value={data.summary.session_expired} label="Sessions expirées"     sublabel="timeout 30min" color="border-yellow-200 bg-yellow-50 text-yellow-800" />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dernière heure</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="text-3xl font-bold text-red-700">{data.last1h.auth_failure}</div>
                      <div className="text-xs text-red-600 mt-1">Échecs connexion</div>
                      {data.last1h.auth_failure > 5 && <div className="text-xs text-red-500 font-semibold mt-1">⚠️ Élevé</div>}
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-100 border border-red-300">
                      <div className="text-3xl font-bold text-red-800">{data.last1h.auth_lockout}</div>
                      <div className="text-xs text-red-700 mt-1">Blocages</div>
                      {data.last1h.auth_lockout > 0 && <div className="text-xs text-red-600 font-semibold mt-1">🚨 Actif</div>}
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-3xl font-bold text-gray-700">{data.summary.logout}</div>
                      <div className="text-xs text-gray-500 mt-1">Déconnexions (24h)</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Protections actives</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge ok={true} label="JWT HS256 forcé" />
                    <StatusBadge ok={true} label="Brute force 5 tentatives → blocage 5 min" />
                    <StatusBadge ok={true} label="Rate limiting 10 req/15min" />
                    <StatusBadge ok={true} label="bcrypt saltRounds=10" />
                    <StatusBadge ok={true} label="Timeout inactivité 30 min" />
                    <StatusBadge ok={true} label="Anti-énumération activé" />
                  </div>
                </div>
              </div>

              {/* SECTION 2 — RGPD */}
              <div>
                <SectionTitle icon="🔒" title="2. Protection des Données — RGPD" subtitle="Exports · Anonymisations · AES-256 · Art.15/16/17/33" color="border-purple-500 bg-purple-50" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatBox value={data.summary.data_export}    label="Exports RGPD (Art.15)"  sublabel="GET /users/:id/export"   color="border-blue-200 bg-blue-50 text-blue-800" />
                  <StatBox value={data.summary.data_anonymize} label="Anonymisations (Art.17)" sublabel="DELETE /users/:id/data"  color="border-purple-200 bg-purple-50 text-purple-800" />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Conformité RGPD</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <StatusBadge ok={true} label="Chiffrement AES-256-CBC" />
                    <StatusBadge ok={true} label="HTTPS/HSTS max-age=1 an" />
                    <StatusBadge ok={true} label="Art.15 — Droit d'accès" />
                    <StatusBadge ok={true} label="Art.16 — Rectification" />
                    <StatusBadge ok={true} label="Art.17 — Anonymisation" />
                    <StatusBadge ok={true} label="Art.33 — Procédure 72h" />
                  </div>
                </div>
              </div>

              {/* SECTION 3 — RBAC */}
              <div>
                <SectionTitle icon="👥" title="3. Gestion des Accès par Rôle — RBAC" subtitle="Accès non autorisés · Firestore Rules · ProtectedRoute · 4 rôles" color="border-orange-500 bg-orange-50" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <StatBox value={data.summary.access_denied}  label="Accès refusés (RBAC)"  sublabel="24h — ACCESS_DENIED" color="border-orange-200 bg-orange-50 text-orange-800" />
                  <StatBox value={data.last1h.access_denied}   label="Accès refusés (1h)"     sublabel="Dernière heure"      color={data.last1h.access_denied > 3 ? "border-red-300 bg-red-100 text-red-800" : "border-gray-200 bg-gray-50 text-gray-700"} />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Architecture RBAC</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <StatusBadge ok={true} label="Firestore Rules — deny by default" />
                    <StatusBadge ok={true} label="ProtectedRoute — /unauthorized" />
                    <StatusBadge ok={true} label="Rôle Admin — accès complet" />
                    <StatusBadge ok={true} label="Rôle Sous-admin — pas de suppression" />
                    <StatusBadge ok={true} label="Rôle Comptable — paiements/factures" />
                    <StatusBadge ok={true} label="Rôle Étudiant — ses données uniquement" />
                  </div>
                </div>
              </div>

              {/* SECTION 4 — JOURNALISATION */}
              <div>
                <SectionTitle icon="📋" title="4. Journalisation des Actions — Audit Logs" subtitle="auditLogs Firestore · immuable · append-only · 8+1 événements" color="border-gray-600 bg-gray-50" />
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <StatBox value={Object.values(data.summary).reduce((a, b) => a + b, 0)} label="Total événements"   sublabel="24h" color="border-gray-300 bg-gray-50 text-gray-800" />
                  <StatBox value={data.summary.auth_success + data.summary.auth_failure + data.summary.auth_lockout + data.summary.logout + data.summary.session_expired}
                    label="Auth" sublabel="Authentification" color="border-blue-200 bg-blue-50 text-blue-800" />
                  <StatBox value={data.summary.access_denied}   label="RBAC"     sublabel="Accès refusés"    color="border-orange-200 bg-orange-50 text-orange-800" />
                  <StatBox value={data.summary.data_export + data.summary.data_anonymize} label="RGPD" sublabel="Export + anonymisation" color="border-purple-200 bg-purple-50 text-purple-800" />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Intégrité des logs</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge ok={true} label="allow update: if false" />
                    <StatusBadge ok={true} label="allow delete: if false" />
                    <StatusBadge ok={true} label="Lecture réservée aux admins" />
                    <StatusBadge ok={true} label="Conservation 1 an" />
                    <StatusBadge ok={true} label="Horodatage serveur (serverTimestamp)" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ONGLET WAF                                                         */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "waf" && (
            <div className="space-y-6">
              <SectionTitle icon="🛡️" title="Pare-feu Applicatif (WAF)" subtitle="Détection et blocage des attaques OWASP Top 10 — SQLi · XSS · Path Traversal · CMD Injection · Agents suspects" color="border-rose-500 bg-rose-50" />

              {/* Stats WAF */}
              <div className="grid grid-cols-3 gap-4">
                <StatBox value={data.waf?.total ?? 0}   label="Attaques bloquées" sublabel="24h — WAF"        color="border-rose-300 bg-rose-50 text-rose-800" />
                <StatBox value={data.waf?.last1h ?? 0}  label="Bloquées (1h)"     sublabel="Dernière heure"    color={( data.waf?.last1h ?? 0) > 5 ? "border-red-300 bg-red-100 text-red-900" : "border-gray-200 bg-gray-50 text-gray-700"} />
                <StatBox value={data.summary.waf_block ?? 0} label="Total WAF_BLOCK" sublabel="Firestore auditLogs" color="border-rose-200 bg-rose-50 text-rose-700" />
              </div>

              {/* Répartition par type d'attaque */}
              {data.waf && Object.keys(data.waf.byType || {}).length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Répartition par type d'attaque</p>
                  <div className="space-y-3">
                    {Object.entries(data.waf.byType).map(([type, count]) => {
                      const total = data.waf?.total || 1;
                      const pct   = Math.round((count / total) * 100);
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{WAF_TYPE_LABELS[type] || type}</span>
                            <span className="text-gray-500">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                  <p className="text-green-700 font-semibold">✅ Aucune attaque détectée par le WAF sur les 24 dernières heures</p>
                  <p className="text-green-600 text-sm mt-1">Le pare-feu applicatif est actif et opérationnel</p>
                </div>
              )}

              {/* Protections WAF */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Règles WAF actives — OWASP Top 10</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <StatusBadge ok={true} label="A03:2021 — Injection SQL détectée et bloquée" />
                  <StatusBadge ok={true} label="A03:2021 — XSS (Cross-Site Scripting) bloqué" />
                  <StatusBadge ok={true} label="A01:2021 — Path Traversal bloqué" />
                  <StatusBadge ok={true} label="A03:2021 — Command Injection bloqué" />
                  <StatusBadge ok={true} label="Scanners automatisés bloqués (sqlmap, nikto...)" />
                  <StatusBadge ok={true} label="Décodage URL avant analyse (encodage %xx)" />
                  <StatusBadge ok={true} label="Analyse URL + Query + Body" />
                  <StatusBadge ok={true} label="WAF_BLOCK loggué en Firestore auditLogs" />
                </div>
              </div>

              {/* Dernières attaques bloquées */}
              {(data.waf?.blocked?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-rose-800 text-white px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-sm">🚫 Dernières attaques bloquées</span>
                    <span className="text-xs text-rose-200">Source : auditLogs — WAF_BLOCK</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold">Type d'attaque</th>
                        <th className="text-left px-4 py-2 font-semibold">Chemin ciblé</th>
                        <th className="text-left px-4 py-2 font-semibold">IP source</th>
                        <th className="text-left px-4 py-2 font-semibold">Horodatage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.waf.blocked.map((ev, i) => (
                        <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-rose-50"}`}>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-200 text-rose-900 border border-rose-400">
                              {WAF_TYPE_LABELS[ev.reason] || ev.reason}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-gray-500">{ev.path || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">{ev.ip || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-400">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleString("fr-FR") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ONGLET SIEM                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "siem" && (
            <div className="space-y-6">
              <SectionTitle icon="📋" title="SIEM — Tableau de bord des événements" subtitle="Agrégation en temps réel des audit logs Firestore — 20 derniers événements" color="border-gray-600 bg-gray-50" />

              {/* Vue synthétique SIEM */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
                  <div className="text-3xl font-bold text-blue-700">{data.summary.auth_success + data.summary.auth_failure + data.summary.auth_lockout + data.summary.logout + data.summary.session_expired}</div>
                  <div className="text-xs font-semibold text-blue-600 mt-1">🔐 Événements Auth</div>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-center">
                  <div className="text-3xl font-bold text-orange-700">{data.summary.access_denied}</div>
                  <div className="text-xs font-semibold text-orange-600 mt-1">👥 Événements RBAC</div>
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-center">
                  <div className="text-3xl font-bold text-purple-700">{data.summary.data_export + data.summary.data_anonymize}</div>
                  <div className="text-xs font-semibold text-purple-600 mt-1">🔒 Événements RGPD</div>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
                  <div className="text-3xl font-bold text-rose-700">{data.summary.waf_block ?? 0}</div>
                  <div className="text-xs font-semibold text-rose-600 mt-1">🛡️ Blocages WAF</div>
                </div>
              </div>

              {/* Intégrité des logs */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Intégrité du système de journalisation</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge ok={true} label="allow update: if false — modification impossible" />
                  <StatusBadge ok={true} label="allow delete: if false — suppression impossible" />
                  <StatusBadge ok={true} label="Lecture réservée aux admins" />
                  <StatusBadge ok={true} label="Conservation : 1 an" />
                  <StatusBadge ok={true} label="9 types d'événements (8 + WAF_BLOCK)" />
                  <StatusBadge ok={true} label="Horodatage serveur serverTimestamp()" />
                </div>
              </div>

              {/* Tableau SIEM — événements récents */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-sm">📜 Journal des événements — 20 derniers</span>
                  <span className="text-xs text-gray-400">Source : Firestore auditLogs</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold">Événement</th>
                      <th className="text-left px-4 py-2 font-semibold">Section</th>
                      <th className="text-left px-4 py-2 font-semibold">Email</th>
                      <th className="text-left px-4 py-2 font-semibold">Rôle</th>
                      <th className="text-left px-4 py-2 font-semibold">Chemin</th>
                      <th className="text-left px-4 py-2 font-semibold">IP</th>
                      <th className="text-left px-4 py-2 font-semibold">Horodatage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEvents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                          Aucun événement dans les 24 dernières heures
                        </td>
                      </tr>
                    )}
                    {data.recentEvents.map((ev, i) => {
                      const action  = ev.action || "";
                      const isWAF   = action.includes("WAF");
                      const isRGPD  = action.includes("DATA");
                      const isRBAC  = action.includes("ACCESS");
                      const section = isWAF ? "🛡️ WAF" : isRGPD ? "🔒 RGPD" : isRBAC ? "👥 RBAC" : "🔐 Auth";
                      return (
                        <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${EVENT_COLORS[action] || "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                              {EVENT_LABELS[action] || action}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">{section}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{ev.email || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-500 capitalize">{ev.role || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-400 font-mono">{ev.path || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-400 font-mono">{ev.ip || "—"}</td>
                          <td className="px-4 py-2 text-xs text-gray-400">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleString("fr-FR") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Légende ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-400 space-y-1">
            <p>📊 <strong>Source</strong> : Collection Firestore <code>auditLogs</code> — Période : 24 dernières heures</p>
            <p>🛡️ <strong>WAF</strong> : Détection SQLi · XSS · Path Traversal · CMD Injection · Agents suspects (sqlmap, nikto...)</p>
            <p>🚨 <strong>Alertes</strong> : Brute force &gt;20/24h · Lockouts &gt;5/24h · Accès refusés &gt;10/24h · WAF &gt;10/24h</p>
            <p>🔄 <strong>Rafraîchissement</strong> automatique toutes les 60 secondes</p>
            <p>🖥️ <strong>Scanner DAST</strong> : <code>node scripts/security_scan.js</code> — 12 tests OWASP automatisés</p>
          </div>
        </>
      )}
    </div>
  );
}
