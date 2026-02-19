import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { factureService } from "@/services/factureService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function FactureDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["facture", id],
    queryFn: () =>
      id ? factureService.getFacture(id) : Promise.resolve({ data: null }),
    enabled: !!id,
  });

  const facture = data?.data || null;

  if (!id) return <div>ID facture manquante</div>;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (error || !facture)
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Facture introuvable</p>
        </CardContent>
      </Card>
    );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold">
                Facture {facture.numero || facture.id}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Détails de la facturation et état des paiements
              </p>
            </div>
            <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
              {facture.statut || "En cours"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/50 text-center">
              <span className="text-xs text-muted-foreground uppercase font-semibold">
                Montant total
              </span>
              <div className="text-xl font-bold mt-1">
                {facture.montant_total} MAD
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-50/50 border border-green-100 text-center">
              <span className="text-xs text-green-600 uppercase font-semibold">
                Montant payé
              </span>
              <div className="text-xl font-bold mt-1 text-green-700">
                {facture.montantPaye || 0} MAD
              </div>
            </div>
            <div className="p-4 rounded-lg bg-orange-50/50 border border-orange-100 text-center">
              <span className="text-xs text-orange-600 uppercase font-semibold">
                Montant restant
              </span>
              <div className="text-xl font-bold mt-1 text-orange-700">
                {facture.montantRestant || 0} MAD
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <Button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none shadow-sm"
              variant="default"
            >
              Imprimer la facture
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={async () => {
                // Tente d'obtenir une URL via l'API, gère data: URL -> Blob
                try {
                  const resp: {
                    status?: boolean;
                    downloadUrl?: string;
                    dataUrl?: string;
                  } = await apiRequest(`/factures/${facture.id}/pdf`, "GET");
                  const url = resp?.downloadUrl || resp?.dataUrl;
                  if (!url) return;
                  if (url.startsWith("data:application/pdf")) {
                    const commaIdx = url.indexOf(",");
                    const base64 = commaIdx >= 0 ? url.slice(commaIdx + 1) : "";
                    const byteCharacters = atob(base64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], {
                      type: "application/pdf",
                    });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, "_blank", "noopener,noreferrer");
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
                  } else {
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                } catch (e) {
                  // ignore
                }
              }}
            >
              Télécharger en PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
