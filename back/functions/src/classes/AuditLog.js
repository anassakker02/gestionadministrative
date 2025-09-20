const db = require("../config/firebase");

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
    } catch (error) {
      console.error("Error saving audit log:", error);
      throw new Error("Failed to save audit log");
    }
  }
}

module.exports = AuditLog;
