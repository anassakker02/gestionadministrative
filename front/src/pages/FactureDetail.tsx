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
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Facture {facture.numero || facture.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div>Montant total: {facture.montant_total} MAD</div>
            <div>Montant payé: {facture.montantPaye || 0} MAD</div>
            <div>Montant restant: {facture.montantRestant || 0} MAD</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.print()}>Imprimer</Button>
            <Button
              variant="outline"
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
              Télécharger PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
