const admin = require("firebase-admin");

// Configuration Firebase pour la validation
const serviceAccount = {
  projectId: "demo-project",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

const db = admin.firestore();

const validateSeeds = async () => {
  console.log("🔍 Validation des seeds (compat front/back)...");
  console.log("");

  const validations = [];

  try {
    // 1. Vérifier les utilisateurs
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const adminUsers = users.filter((u) => u.role === "admin");
    const parentUsers = users.filter((u) => u.role === "parent");
    const etudiantUsers = users.filter((u) => u.role === "etudiant");

    validations.push({
      test: "Utilisateurs créés",
      expected: "≥ 6 utilisateurs",
      actual: `${users.length} utilisateurs`,
      status: users.length >= 6 ? "✅" : "❌",
    });
    validations.push({
      test: "Admin présent",
      expected: ">= 1 admin",
      actual: `${adminUsers.length} admin(s)`,
      status: adminUsers.length >= 1 ? "✅" : "❌",
    });

    // 2. Vérifier les entités parents
    const parentsSnapshot = await db.collection("parents").get();
    const parents = parentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    validations.push({
      test: "Entités parents",
      expected: ">= 2 parents",
      actual: `${parents.length} parent(s)`,
      status: parents.length >= 2 ? "✅" : "❌",
    });

    // 3. Vérifier les entités étudiants
    const etudiantsSnapshot = await db.collection("etudiants").get();
    const etudiants = etudiantsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    validations.push({
      test: "Entités étudiants",
      expected: ">= 3 étudiants avec user_id",
      actual: `${etudiants.length} étudiant(s), ${
        etudiants.filter((e) => e.user_id).length
      } avec user_id`,
      status:
        etudiants.length >= 3 && etudiants.filter((e) => e.user_id).length >= 3
          ? "✅"
          : "❌",
    });

    // 4. Vérifier les factures (compat champs)
    const facturesSnapshot2 = await db.collection("factures").get();
    const factures2 = facturesSnapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const compatKeysOk = factures2.every(
      (f) =>
        (f.etudiant_id || f.student_id) &&
        (f.numero || f.numero_facture) &&
        f.date_emission &&
        typeof f.montant_total === "number"
    );
    validations.push({
      test: "Factures champs compat",
      expected:
        "etudiant_id/student_id + numero/numero_facture + date_emission + montant_total",
      actual: compatKeysOk ? "OK" : "Manquants",
      status: compatKeysOk ? "✅" : "❌",
    });

    // 5. Vérifier les paiements (compat champs)
    const paiementsSnapshot2 = await db.collection("paiements").get();
    const paiements2 = paiementsSnapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const paiementsCompat = paiements2.every(
      (p) =>
        p.etudiant_id &&
        Array.isArray(p.facture_ids) &&
        typeof p.montantPaye === "number" &&
        (p.methode || p.mode)
    );
    validations.push({
      test: "Paiements champs compat",
      expected: "etudiant_id + facture_ids[] + montantPaye + methode/mode",
      actual: paiementsCompat ? "OK" : "Manquants",
      status: paiementsCompat ? "✅" : "❌",
    });

    // 6. Collections de base présentes
    const classesSnapshot2 = await db.collection("classes").get();
    validations.push({
      test: "Collections de base",
      expected: ">= 3 classes, >= 5 factures, >= 5 paiements (démo)",
      actual: `${classesSnapshot2.size} classes, ${factures2.length} factures, ${paiements2.length} paiements`,
      status:
        classesSnapshot2.size >= 3 &&
        factures2.length >= 5 &&
        paiements2.length >= 5
          ? "✅"
          : "❌",
    });

    // 7. Vérifier les autres collections
    const classesSnapshot = await db.collection("classes").get();
    const boursesSnapshot = await db.collection("bourses").get();
    const facturesSnapshot = await db.collection("factures").get();

    validations.push({
      test: "Collections de base",
      expected: "Classes, bourses, factures créées",
      actual: `${classesSnapshot.size} classes, ${boursesSnapshot.size} bourses, ${facturesSnapshot.size} factures`,
      status:
        classesSnapshot.size >= 5 &&
        boursesSnapshot.size >= 5 &&
        facturesSnapshot.size >= 5
          ? "✅"
          : "❌",
    });

    // Affichage des résultats
    console.log("📊 Résultats de validation :");
    console.log("");

    validations.forEach((validation) => {
      console.log(`${validation.status} ${validation.test}`);
      console.log(`   Attendu: ${validation.expected}`);
      console.log(`   Obtenu: ${validation.actual}`);
      console.log("");
    });

    const passed = validations.filter((v) => v.status === "✅").length;
    const total = validations.length;

    console.log(`🎯 Score: ${passed}/${total} validations réussies`);

    if (passed === total) {
      console.log(
        "🎉 Tous les tests sont passés ! Les seeds sont compatibles front/back."
      );

      console.log("");
      console.log("🔗 Comptes de test disponibles :");

      if (adminUsers.length > 0)
        console.log(`👑 Admin: ${adminUsers[0].email}`);
      if (parentUsers.length > 0)
        console.log(`👪 Parent: ${parentUsers[0].email}`);
      if (etudiantUsers.length > 0)
        console.log(`🎓 Étudiant: ${etudiantUsers[0].email}`);

      console.log("");
      console.log("🔑 Mot de passe pour tous les comptes: password123");
    } else {
      console.log("⚠️  Certaines validations ont échoué. Vérifiez les seeds.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la validation:", error);
    process.exit(1);
  }
};

validateSeeds();
