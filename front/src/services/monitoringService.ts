import { apiRequest } from "@/lib/api";

export interface SecuritySummary {
  auth_success: number;
  auth_failure: number;
  auth_lockout: number;
  access_denied: number;
  session_expired: number;
  logout: number;
  data_export: number;
  data_anonymize: number;
  waf_block: number;
}

export interface WafData {
  total: number;
  byType: Record<string, number>;
  last1h: number;
  blocked: Array<{
    reason: string;
    path: string | null;
    ip: string | null;
    userAgent: string | null;
    timestamp: string;
  }>;
}

export interface MonitoringData {
  period: string;
  generatedAt: string;
  securityScore: number;
  summary: SecuritySummary;
  waf: WafData;
  last1h: {
    auth_failure: number;
    auth_lockout: number;
    access_denied: number;
  };
  alerts: {
    bruteForce: boolean;
    accessEscalation: boolean;
    manyLockouts: boolean;
    wafAttack: boolean;
  };
  recentEvents: Array<{
    action: string;
    email: string | null;
    path: string | null;
    role: string | null;
    ip: string | null;
    reason: string | null;
    timestamp: string;
  }>;
}

export interface HealthData {
  status: boolean;
  message: string;
  timestamp: string;
  version: string;
  uptime: number;
  memory: { used: string; total: string };
}

export async function getSecurityMonitoring(): Promise<MonitoringData> {
  const res = await apiRequest("/monitoring/security", "GET");
  return res.data;
}

export async function getHealthStatus(): Promise<HealthData> {
  const res = await apiRequest("/health", "GET");
  return res;
}
