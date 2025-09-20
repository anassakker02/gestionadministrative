// One-off migration script to normalize `qui_a_paye` on paiements
// Usage: from back/functions folder run: node .\scripts\fix_paiements_qui_a_paye.js

const db = require("../config/firebase");

(async function main() {
  try {
    console.log(
      "Starting migration: normalize paiements.qui_a_paye to etudiant_id"
    );
    const snapshot = await db.collection("paiements").get();
    console.log(`Found ${snapshot.size} paiements`);
    let updated = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const etuId = data.etudiant_id;
      const current = data.qui_a_paye;
      const updates = {};

      // If qui_a_paye is missing or different from etudiant_id, set it to etudiant_id
      if (typeof etuId === "string" && etuId && current !== etuId) {
        // Preserve original actor (if any) into payer_user_id
        if (typeof current === "string" && current && !data.payer_user_id) {
          updates.payer_user_id = current;
        }
        updates.qui_a_paye = etuId;
      }

      // Ensure montantPaye is numeric
      if (
        typeof data.montantPaye !== "number" &&
        typeof data.montantPaye !== "undefined"
      ) {
        const n = Number(data.montantPaye);
        if (!Number.isNaN(n)) updates.montantPaye = n;
      }

      if (Object.keys(updates).length > 0) {
        await doc.ref.update({ ...updates, updatedAt: new Date() });
        updated++;
        console.log(`Updated paiement ${doc.id}:`, updates);
      }
    }
    console.log(`Migration finished. Updated ${updated} paiements.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(2);
  }
})();
