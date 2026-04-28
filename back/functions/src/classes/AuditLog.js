const db = require("../config/firebase");
const fs = require("fs");
const path = require("path");

const LOG_DIR = "/tmp/app-logs";
const SECURITY_LOG = path.join(LOG_DIR, "security.log");
const WAF_LOG = path.join(LOG_DIR, "waf.log");

// Créer le dossier si inexistant
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) {}

function writeToFile(filePath, line) {
  try { fs.appendFileSync(filePath, line + "\n"); } catch (e) {}
}

class AuditLog {
  constructor(data) {
    this.userId = data.userId; // ID of the user who performed the action
    this.action = data.action; // e.g., 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER'
    this.entityType = data.entityType; // e.g., 'User', 'Invoice', 'Payment'
    this.entityId = data.entityId; // ID of the entity that was affected
    this.timestamp = data.timestamp || new Date();
    this.details = data.details || {}; // Additional details about the action
  }

  // Nettoyer les valeurs undefined
  static cleanUndefinedValues(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => AuditLog.cleanUndefinedValues(item));
    } else if (obj && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = AuditLog.cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    return obj;
  }

  async save() {
    try {
      const logData = {
        userId: this.userId,
        action: this.action,
        entityType: this.entityType,
        entityId: this.entityId,
        timestamp: this.timestamp,
        details: AuditLog.cleanUndefinedValues(this.details),
      };
      await db
        .collection("auditLogs")
        .add(AuditLog.cleanUndefinedValues(logData));

      // Écriture fichier pour Wazuh
      const ts = new Date().toISOString();
      const ip = this.details?.ip || "unknown";
      const line = `${ts} YNOV-APP action=${this.action} user=${this.userId || "anon"} ip=${ip} entity=${this.entityType || "-"} id=${this.entityId || "-"}`;
      const logFile = this.action === "WAF_BLOCK" ? WAF_LOG : SECURITY_LOG;
      writeToFile(logFile, line);

    } catch (error) {
      console.error("Error saving audit log:", error);
      throw new Error("Failed to save audit log");
    }
  }
}

module.exports = AuditLog;
