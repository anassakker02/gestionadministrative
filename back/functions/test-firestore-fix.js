// Test des corrections Firestore pour valeurs undefined
// Ce fichier peut être supprimé après les tests

const testGenerateAfterPaymentData = {
  student_id: "test-student-123",
  parent_id: undefined, // Ceci était le problème !
  montant_paye: 1500.0,
  mode_paiement: "Espèces",
  qui_a_paye: "Jean Dupont",
  enregistre_par: "admin-123",
  reference_externe: undefined, // Aussi un problème potentiel
};

const testRecordManualPaymentData = {
  facture_id: "test-facture-456",
  montant_paye: 750.0,
  qui_a_paye: "Marie Martin",
  mode_paiement: "Virement",
  reference_externe: undefined, // Problème potentiel
  commentaires: undefined, // Problème potentiel
};

// Fonction de nettoyage (comme dans le backend)
function cleanUndefinedValues(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanUndefinedValues(item));
  } else if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedValues(value);
      }
    }
    return cleaned;
  }
  return obj;
}

console.log("🧪 Test des données avant nettoyage :");
console.log(
  "GenerateAfterPayment:",
  JSON.stringify(testGenerateAfterPaymentData, null, 2)
);
console.log(
  "RecordManualPayment:",
  JSON.stringify(testRecordManualPaymentData, null, 2)
);

console.log("\n✅ Test des données après nettoyage :");
console.log(
  "GenerateAfterPayment:",
  JSON.stringify(cleanUndefinedValues(testGenerateAfterPaymentData), null, 2)
);
console.log(
  "RecordManualPayment:",
  JSON.stringify(cleanUndefinedValues(testRecordManualPaymentData), null, 2)
);

console.log("\n📝 Résumé des corrections appliquées :");
console.log(
  "1. ✅ Ajout de fonction cleanUndefinedValues() dans le contrôleur"
);
console.log("2. ✅ parent_id: parent_id || etudiantData.parent_id || null");
console.log("3. ✅ reference_externe: reference_externe || null");
console.log("4. ✅ Nettoyage des objets avant sauvegarde Firestore");
console.log("5. ✅ Nettoyage côté frontend dans factureService.ts");
console.log(
  "\n🎯 L'erreur Firestore 'Cannot use undefined' devrait être résolue !"
);

module.exports = { cleanUndefinedValues };
