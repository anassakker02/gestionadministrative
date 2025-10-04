import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Student } from "@/types/student";
import { factureService } from "@/services/factureService";
import { apiRequest } from "@/lib/api";

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = React.useState(false);
  if (!student) {
    return null;
  }

  const { nom, prenom, paymentStatus } = student;
  function computeStatus(
    due: number,
    paid: number,
    remaining: number,
    warning?: string
  ): string {
    if (!Number.isFinite(due) && !Number.isFinite(paid)) return "N/A";
    if (paid > due)
      return `Trop-perçu de ${(paid - due).toLocaleString("fr-FR")} MAD`;
    if (remaining <= 0 && paid >= due && (due || paid))
      return "Payé intégralement";
    if (paid === 0 && (due || remaining)) return "Non payé";
    return warning || "En cours";
  }
  const due = paymentStatus?.totalMontantDu ?? 0;
  const paid = paymentStatus?.totalPaid ?? 0;
  // Toujours dériver le restant pour éviter un décalage si remainingAmount n'est pas rafraîchi
  const remaining = Math.max(0, (Number(due) || 0) - (Number(paid) || 0));
  const displayStatus = computeStatus(
    due,
    paid,
    remaining,
    paymentStatus?.paymentWarningStatus
  );

  const handleGenerateInvoice = async () => {
    if (!student?.id) return;
    const confirm = window.confirm(
      `Générer une nouvelle facture pour ${nom} ${prenom} ?`
    );
    if (!confirm) return;
    try {
      setIsGenerating(true);
      // Préparer les détails à intégrer dans la facture (utilise les valeurs dérivées)
      const statusLabel = computeStatus(
        due,
        paid,
        remaining,
        paymentStatus?.paymentWarningStatus
      );
      const today = new Date();
      const dateStr = today.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const formatAmount = (n: number) =>
        Number.isFinite(n) ? n.toLocaleString("fr-FR") : "N/A";
      const detailsText = [
        `Détails de Paiement pour ${nom} ${prenom}`,
        `Montant Dû Annuel: ${formatAmount(due)} MAD`,
        `Montant Payé: ${formatAmount(paid)} MAD`,
        `Montant Restant: ${formatAmount(remaining)} MAD`,
        `Statut de Paiement: ${statusLabel}`,
        `Date: ${dateStr}`,
      ].join("\n");
      const payload: Parameters<typeof factureService.generateForStudent>[0] = {
        student_id: student.id,
        description: detailsText,
        // Item payable: le montant restant à régler (s'il existe)
        items:
          remaining > 0
            ? [
                {
                  description: "Régularisation du montant restant",
                  quantity: 1,
                  unitPrice: remaining,
                  total: remaining,
                },
              ]
            : undefined,
        currency: "MAD",
      };
      const resp = await factureService.generateForStudent(payload);
      // Rafraîchir les listes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["factures-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["payments-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]);
      // Récupérer l'ID de la facture générée
      const r: unknown = resp as unknown;
      const idFromData =
        (r as { data?: { id?: string; facture?: { id?: string } } })?.data
          ?.id ||
        (r as { data?: { id?: string; facture?: { id?: string } } })?.data
          ?.facture?.id;
      const factureId = idFromData || (r as { id?: string })?.id;
      if (!factureId) {
        // Si pas d'ID, on informe et on sort
        window.alert(
          "Facture générée, mais l'identifiant n'a pas été retourné par le serveur."
        );
        onClose();
        return;
      }

      // Demander l'URL du PDF
      const pdfResp: {
        status?: boolean;
        downloadUrl?: string;
        dataUrl?: string;
      } = await apiRequest(`/factures/${factureId}/pdf`, "GET");
      const url = pdfResp?.downloadUrl || pdfResp?.dataUrl;
      if (!url) {
        window.alert("PDF non disponible pour cette facture.");
        onClose();
        return;
      }

      // Ouvrir une fenêtre avec un iframe et imprimer automatiquement
      const openAndPrint = (srcUrl: string) => {
        const w = window.open("", "_blank");
        if (!w) return;
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Facture ${factureId}</title></head>
          <body style="margin:0">
            <iframe src="${srcUrl}" style="border:0;width:100vw;height:100vh;" id="pdfFrame"></iframe>
            <script>
              const iframe = document.getElementById('pdfFrame');
              iframe.addEventListener('load', function(){
                try { iframe.contentWindow && iframe.contentWindow.focus && iframe.contentWindow.focus(); } catch(e){}
                try { iframe.contentWindow && iframe.contentWindow.print && iframe.contentWindow.print(); } catch(e){}
              });
            </script>
          </body></html>`;
        (w.document as unknown as { write: (s: string) => void }).write(html);
        w.document.close();
        w.focus();
      };

      if (url.startsWith("data:application/pdf")) {
        // Convertir dataURL en blob URL pour une meilleure compatibilité
        const commaIdx = url.indexOf(",");
        const base64 = commaIdx >= 0 ? url.slice(commaIdx + 1) : "";
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++)
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        openAndPrint(blobUrl);
        // On laisse le navigateur révoquer plus tard; sinon, révoquez après un délai si besoin
      } else {
        openAndPrint(url);
      }

      onClose();
    } catch (err) {
      console.error("Erreur génération facture:", err);
      window.alert(
        "Échec de la génération de la facture. Veuillez réessayer ou vérifier le serveur."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Détails de Paiement pour {nom} {prenom}
          </DialogTitle>
          <DialogDescription>
            Informations détaillées sur les paiements de l'étudiant.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium">Montant Dû Annuel:</span>
            <span className="text-right font-semibold">
              {paymentStatus?.totalMontantDu?.toLocaleString() || "N/A"} MAD
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium">Montant Payé:</span>
            <span className="text-right font-semibold text-green-600">
              {paymentStatus?.totalPaid?.toLocaleString() || "N/A"} MAD
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium">Montant Restant:</span>
            <span className="text-right font-semibold text-red-600">
              {remaining.toLocaleString("fr-FR")} MAD
            </span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium">Statut de Paiement:</span>
            <span className="text-right font-semibold">{displayStatus}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={handleGenerateInvoice} disabled={isGenerating}>
            {isGenerating ? "Génération…" : "Générer Facture"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailsModal;
