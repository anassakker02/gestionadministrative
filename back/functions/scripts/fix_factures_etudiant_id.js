// One-off migration script
// Usage: from back/functions folder run: node .\scripts\fix_factures_etudiant_id.js

const db = require("../config/firebase");

(async function main() {
  try {
    console.log(
      "Starting migration: fix factures etudiant_id and numero fields"
    );
    const snapshot = await db.collection("factures").get();
    console.log(`Found ${snapshot.size} factures`);
    let updated = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      if (!data.etudiant_id && data.student_id) {
        updates.etudiant_id = data.student_id;
      }
      // ensure numero field exists (frontend sometimes expects `numero`)
      if (!data.numero && data.numero_facture) {
        updates.numero = data.numero_facture;
      }
      if (!data.numero && !data.numero_facture) {
        // generate a best-effort numero
        updates.numero = `MIG-${doc.id.slice(-6)}`;
        updates.numero_facture = updates.numero;
      }
      // ensure montant_total is numeric
      if (data.montant_total && typeof data.montant_total !== "number") {
        const n = Number(data.montant_total);
        if (!Number.isNaN(n)) updates.montant_total = n;
      }

      if (Object.keys(updates).length > 0) {
        await doc.ref.update({ ...updates, updatedAt: new Date() });
        updated++;
        console.log(`Updated facture ${doc.id}:`, updates);
      }
    }
    console.log(`Migration finished. Updated ${updated} factures.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(2);
  }
})();
