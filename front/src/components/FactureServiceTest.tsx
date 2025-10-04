import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { factureService } from "@/services/factureService";

const FactureServiceTest: React.FC = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testGenerateAfterPayment = async () => {
    setLoading(true);
    try {
      const testData = {
        student_id: "test-student-123",
        montant_paye: 1500.0,
        mode_paiement: "Espèces" as const,
        qui_a_paye: "Jean Dupont",
        enregistre_par: "admin-123",
        reference_externe: "REF-TEST-001",
      };

      const response = await factureService.generateAfterPayment(testData);
      setResult(`✅ Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRecordManualPayment = async () => {
    setLoading(true);
    try {
      const testData = {
        facture_id: "test-facture-456",
        montant_paye: 750.0,
        qui_a_paye: "Marie Martin",
        mode_paiement: "Virement" as const,
        reference_externe: "VIREMENT-789",
        commentaires: "Paiement partiel test",
      };

      const response = await factureService.recordManualPayment(testData);
      setResult(`✅ Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Test des Services de Facturation
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Button
          onClick={testGenerateAfterPayment}
          disabled={loading}
          className="h-20 flex flex-col items-center justify-center"
        >
          <span className="text-sm font-medium">
            Test Generate After Payment
          </span>
          <span className="text-xs text-muted-foreground">
            Génération nouvelle facture
          </span>
        </Button>

        <Button
          onClick={testRecordManualPayment}
          disabled={loading}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center"
        >
          <span className="text-sm font-medium">
            Test Record Manual Payment
          </span>
          <span className="text-xs text-muted-foreground">
            Paiement sur facture existante
          </span>
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Test en cours...</p>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Résultat du Test :</h2>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FactureServiceTest;
