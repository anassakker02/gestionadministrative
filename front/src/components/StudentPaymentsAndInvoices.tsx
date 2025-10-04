import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, CheckCircle, AlertCircle, Clock, CreditCard, DollarSign } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Paiement, getAllPaiements } from "@/api/paiementsApi";
import {
  type Facture,
  getFacturesByStudent,
  getFactureById,
} from "@/api/facturesApi";
import { getEtudiantById } from "@/api/etudiantsApi";
import { studentService } from "@/services/studentService";

type Props = {
  studentId: string;
  yearFilter: string;
  statusFilter: string;
  methodFilter: string;
};

// Schéma de validation pour le paiement
const paymentSchema = z.object({
  montant: z.number().min(1, "Le montant doit être supérieur à 0"),
  methode: z.string().min(1, "La méthode de paiement est requise"),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Helpers — parsing dates hétérogènes
const parsePrimitiveDate = (val: unknown): Date | undefined => {
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};
const parseFirestoreLikeDate = (val: unknown): Date | undefined => {
  if (typeof val !== "object" || val === null) return undefined;
  const anyV = val as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };
  if (typeof anyV.toDate === "function") {
    const d = anyV.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
  }
  let seconds: number | undefined;
  if (typeof anyV.seconds === "number") seconds = anyV.seconds;
  if (typeof seconds !== "number" && typeof anyV._seconds === "number")
    seconds = anyV._seconds;
  if (typeof seconds === "number") {
    const d = new Date(seconds * 1000);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};
const pickAnyDate = (obj: Record<string, unknown>): unknown => {
  const keys = [
    "date",
    "date_paiement",
    "datePaiement",
    "createdAt",
    "updatedAt",
  ];
  for (const k of keys) if (k in obj) return obj[k];
  return undefined;
};
const formatDate = (dateLike: unknown): string => {
  const d = parsePrimitiveDate(dateLike) || parseFirestoreLikeDate(dateLike);
  if (!d) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const formatMoney = (n: unknown, currency?: string): string => {
  const v = Number(n || 0);
  const cur =
    typeof currency === "string" && currency.trim() ? currency : "MAD";
  try {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: cur,
    }).format(v);
  } catch {
    return `${v.toLocaleString()} ${cur}`;
  }
};
const coerceArray = <T,>(val: unknown): T[] =>
  Array.isArray(val) ? (val as T[]) : [];

// Helpers génériques pour lire des champs de manière typée/sûre
const toStringSafe = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
};
const toNumberSafe = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const getFieldString = (
  obj: Record<string, unknown>,
  keys: string[]
): string | undefined => {
  for (const k of keys) {
    if (k in obj) {
      const val = obj[k];
      const s = toStringSafe(val);
      if (typeof s !== "undefined") return s;
    }
  }
  return undefined;
};
const getFieldNumber = (
  obj: Record<string, unknown>,
  keys: string[]
): number | undefined => {
  for (const k of keys) {
    if (k in obj) {
      const n = toNumberSafe(obj[k]);
      if (typeof n !== "undefined") return n;
    }
  }
  return undefined;
};
const getNestedIdString = (val: unknown): string | undefined => {
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    if ("id" in o) return toStringSafe(o["id"]);
  }
  return undefined;
};
const paymentDate = (p: Paiement): Date | undefined => {
  const dateLike = pickAnyDate(p as Record<string, unknown>);
  return parsePrimitiveDate(dateLike) || parseFirestoreLikeDate(dateLike);
};

// Contrat années scolaires: Septembre (mois 8) → Août (mois 7)
const academicYearOf = (d: Date): string => {
  const y = d.getFullYear();
  const start = d.getMonth() >= 8 ? y : y - 1;
  return `${start}-${start + 1}`;
};

// Status badges utilisés ailleurs pour cohérence
const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive";
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  Confirmé: {
    variant: "default",
    className: "bg-green-500 text-white",
    icon: CheckCircle,
  },
  "En traitement": {
    variant: "secondary", // Changed from 'info' to 'secondary'
    className: "bg-blue-500 text-white",
    icon: Clock,
  },
  Échoué: {
    variant: "destructive",
    className: "bg-red-500 text-white",
    icon: AlertCircle,
  },
  "En retard": {
    variant: "destructive",
    className: "bg-orange-500 text-white", // Kept for consistency if intended as a warning
    icon: AlertCircle,
  },
};

const openPdfInNewTab = (url: string) => {
  try {
    if (url.startsWith("data:application/pdf;base64,")) {
      const base64 = url.split(",")[1] ?? "";
      const bytes = atob(base64);
      const buf = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
      const blob = new Blob([buf], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } else {
      window.open(url, "_blank");
    }
  } catch {
    toast({
      title: "Erreur PDF",
      description: "Impossible d'ouvrir le PDF.",
      variant: "destructive",
    });
  }
};

export default function StudentPaymentsAndInvoices({
  studentId,
  yearFilter,
  statusFilter,
  methodFilter,
}: Props) {
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  type SelectedStudentPaymentInfo = {
    id: string;
    nom: string;
    prenom: string;
    totalDue: number;
    totalPaid: number;
    remaining: number;
  };

  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<
    SelectedStudentPaymentInfo | null
  >(null);
  const [studentInfo, setStudentInfo] = useState<SelectedStudentPaymentInfo | null>(null);

  // Formulaire de paiement
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant: 0,
      methode: "",
      description: "",
    },
  });

  // Requêtes
  const paymentsQuery = useQuery({
    queryKey: ["payments", studentId, statusFilter, methodFilter],
    queryFn: () => {
      console.log("🔍 Récupération des paiements pour l'étudiant:", studentId);
      console.log("🔍 Filtres:", { statusFilter, methodFilter });
      return getAllPaiements(studentId, statusFilter, methodFilter);
    },
    enabled: !!studentId,
  });
  const invoicesQuery = useQuery<{ data?: Facture[] } | Facture[]>({
    queryKey: ["invoices", studentId],
    queryFn: () => {
      console.log("🔍 Récupération des factures pour l'étudiant:", studentId);
      return getFacturesByStudent(studentId);
    },
    enabled: !!studentId,
  });

  const paymentsAll: Paiement[] = useMemo(
    () => {
      const payments = paymentsQuery.data?.data || [];
      console.log("📊 Paiements récupérés:", payments.length, payments);
      return payments;
    },
    [paymentsQuery.data]
  );
  const invoices: Facture[] = useMemo(() => {
    const raw = invoicesQuery.data as
      | { data?: Facture[] }
      | Facture[]
      | undefined;
    let allInvoices: Facture[] = [];
    if (Array.isArray(raw)) {
      allInvoices = raw;
    } else {
      allInvoices = (raw?.data as Facture[]) || [];
    }
    
    // Ne montrer que les factures qui ont des paiements associés
    const paidInvoices = allInvoices.filter(invoice => {
      // Vérifier si cette facture a des paiements associés
      return paymentsAll.some(payment => 
        payment.facture_ids && payment.facture_ids.includes(invoice.id || '')
      );
    });
    
    console.log("📊 Factures filtrées (avec paiements):", paidInvoices.length, paidInvoices);
    return paidInvoices;
  }, [invoicesQuery.data, paymentsAll]);

  // Filtrage des paiements concernant l'étudiant (défensif)
  const payments: Paiement[] = useMemo(() => {
    // The getAllPaiements API call already handles filtering by studentId, status, and method.
    // So, we can directly use paymentsAll here, which already contains the filtered data.
    return paymentsAll;
  }, [paymentsAll]);

  // Charger les informations de l'étudiant après que paymentsAll soit disponible
  useEffect(() => {
    let mounted = true;
    const fetchStudentInfo = async () => {
      try {
        const response = await studentService.getStudent(studentId);
        const student = response.data;
        if (student && mounted) {
          const totalPaid = paymentsAll.reduce(
            (sum, payment) => sum + (payment.montantPaye || 0),
            0
          );
          const totalDue = Number(student.frais_payment) || 0;
          const remaining = Math.max(0, totalDue - totalPaid);

          const info: SelectedStudentPaymentInfo = {
            id: student.id,
            nom: student.nom || "",
            prenom: student.prenom || "",
            totalDue,
            totalPaid,
            remaining,
          };

          setStudentInfo(info);
          console.log("📊 Student info loaded:", info);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'étudiant:", error);
      }
    };

    fetchStudentInfo();

    return () => {
      mounted = false;
    };
  }, [studentId, paymentsAll]);


  // Années scolaires disponibles depuis les paiements
  const yearsAvailable = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) {
      const d = paymentDate(p);
      if (d) set.add(academicYearOf(d));
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [payments]);

  const pageSize = 5;
  const [page, setPage] = useState<number>(1);

  const paymentsYearFiltered = useMemo(() => {
    const list = payments.filter((p) => {
      const pObj = p as unknown as Record<string, unknown>;

      // Filter by year
      if (yearFilter !== "all") {
      const d = paymentDate(p);
        if (!d || academicYearOf(d) !== yearFilter) return false;
      }

      // Filter by status
      if (statusFilter !== "Tous") {
        const status = toStringSafe(pObj["status"]);
        if (status !== statusFilter) return false;
      }

      // Filter by method
      if (methodFilter !== "Tous") {
        const method = toStringSafe(pObj["methode"]) ?? toStringSafe(pObj["mode"]);
        if (method !== methodFilter) return false;
      }

      return true;
    });
    list.sort((a, b) => {
      const da = (paymentDate(a) || new Date(0)).getTime();
      const db = (paymentDate(b) || new Date(0)).getTime();
      return db - da;
    });
    return list;
  }, [payments, yearFilter, statusFilter, methodFilter]);

  const totalPayments = paymentsYearFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalPayments / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const visiblePayments = paymentsYearFiltered.slice(startIdx, endIdx);

  const paymentInvoices = useMemo(
    () =>
      invoices.filter((inv) =>
        String(inv.numero_facture || "").startsWith("PAY-")
      ),
    [invoices]
  );

  const detectCurrency = (): string => {
    for (const p of payments) {
      const val = (p as unknown as Record<string, unknown>)["currency"];
      const s = toStringSafe(val);
      if (s && s.trim()) return s;
    }
    for (const inv of invoices) {
      const s =
        inv.currency && inv.currency.trim()
          ? inv.currency
          : toStringSafe((inv as Record<string, unknown>)["currency"]);
      if (s && s.trim()) return s;
    }
    return "MAD";
  };

  const getInvoiceAmounts = (inv: Facture) => {
    const invObj = inv as unknown as Record<string, unknown>;
    const total =
      toNumberSafe(inv.montant_total) ??
      toNumberSafe(invObj["montant_total"]) ??
      0;
    const paid =
      toNumberSafe(inv.montantPaye) ??
      toNumberSafe(invObj["montant_payee"]) ??
      0;
    const remaining =
      toNumberSafe(inv.montantRestant) ??
      toNumberSafe(invObj["montant_restant"]) ??
      total - paid;
    return { total, paid, remaining };
  };

  const openInvoicePdf = async (invoiceId: string): Promise<string | undefined> => {
    try {
      const inv = invoices.find((i) => String(i.id) === String(invoiceId));
      let url = inv?.pdf_url;

      if (!url) {
      const res: unknown = await getFactureById(invoiceId);
      const resObj =
        res && typeof res === "object"
          ? (res as Record<string, unknown>)
          : undefined;
      const dataRaw = resObj?.["data"] ?? resObj;
      const dataObj =
        dataRaw && typeof dataRaw === "object"
          ? (dataRaw as Record<string, unknown>)
          : undefined;
        url = dataObj ? getFieldString(dataObj, ["pdf_url"]) : undefined;
      }

      if (url) {
        if (url.startsWith("data:application/pdf;base64,")) {
          const base64 = url.split(",")[1] ?? "";
          const bytes = atob(base64);
          const buf = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
          const blob = new Blob([buf], { type: "application/pdf" });
          const blobUrl = URL.createObjectURL(blob);
          return blobUrl; // Return the blob URL
        } else {
          return url; // Return the direct URL
        }
      }

      toast({
        title: "PDF indisponible",
        description: "Aucun lien PDF trouvé pour cette facture.",
      });
      return undefined;
    } catch (e) {
      console.error("Erreur lors de l'ouverture du PDF de la facture:", e);
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le PDF de la facture.",
        variant: "destructive",
      });
      return undefined;
    }
  };

  const handleDownloadReceiptClick = async (factureId: string) => {
    const url = await openInvoicePdf(factureId);
    if (url) {
      setCurrentReceiptUrl(url);
      setIsReceiptDialogOpen(true);
    }
  };

  // Fonctions pour gérer le paiement
  const handlePayClick = (student: SelectedStudentPaymentInfo) => {
    setSelectedStudentForPayment(student);
    paymentForm.reset({
      montant: student.remaining > 0 ? student.remaining : student.totalDue,
      methode: "",
      description: `Paiement des frais d'inscription et de scolarité`,
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!selectedStudentForPayment) return;

    const totalFrais = selectedStudentForPayment.totalDue;
    
    if (data.montant > totalFrais) {
      toast({
        title: "Erreur de montant",
        description: `Le montant ne peut pas dépasser ${totalFrais} DH`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Ici, vous pouvez appeler l'API pour créer le paiement
      console.log("Création du paiement:", {
        etudiant_id: selectedStudentForPayment.id,
        montant: data.montant,
        methode: data.methode,
        description: data.description,
      });

      toast({
        title: "Paiement effectué",
        description: `Paiement de ${data.montant} DH enregistré avec succès pour ${selectedStudentForPayment.prenom} ${selectedStudentForPayment.nom}`,
      });

      setIsPaymentDialogOpen(false);
      setSelectedStudentForPayment(null);
      paymentForm.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du paiement",
        variant: "destructive",
      });
    }
  };

  const handleCancelPayment = () => {
    setIsPaymentDialogOpen(false);
    setSelectedStudentForPayment(null);
    paymentForm.reset();
  };

  if (paymentsQuery.isLoading || invoicesQuery.isLoading)
    return <div>Chargement…</div>;
  if (paymentsQuery.error) {
    console.error("❌ Erreur chargement des paiements:", paymentsQuery.error);
    return <div>Erreur chargement des paiements: {paymentsQuery.error.message}</div>;
  }
  if (invoicesQuery.error) {
    console.error("❌ Erreur chargement des factures:", invoicesQuery.error);
    return <div>Erreur chargement des factures: {invoicesQuery.error.message}</div>;
  }

  // Debug info
  console.log("🔍 Debug Info:");
  console.log("- Student ID:", studentId);
  console.log("- Student Info:", studentInfo);
  console.log("- Payments Query Status:", paymentsQuery.status);
  console.log("- Payments Query Data:", paymentsQuery.data);
  console.log("- Invoices Query Status:", invoicesQuery.status);
  console.log("- Invoices Query Data:", invoicesQuery.data);
  console.log("- Payments All:", paymentsAll);
  console.log("- Invoices:", invoices);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Historique des Paiements Individuels</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Liste de tous les paiements effectués par l'étudiant.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (studentInfo) {
                    handlePayClick(studentInfo);
                  } else {
                    console.log("❌ StudentInfo not available");
                    toast({
                      title: "Erreur",
                      description: "Impossible de charger les informations de l'étudiant",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!studentInfo}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                {studentInfo ? "Payer" : "Chargement..."}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Affichés: {paymentsYearFiltered.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucun paiement trouvé pour cet étudiant.</p>
              <p className="text-sm text-muted-foreground mb-4">
                ID étudiant: {studentId}
              </p>
              {studentInfo && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Étudiant: {studentInfo.prenom} {studentInfo.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Montant dû: {studentInfo.totalDue} MAD
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  if (studentInfo) {
                    handlePayClick(studentInfo);
                  } else {
                    toast({
                      title: "Erreur",
                      description: "Impossible de charger les informations de l'étudiant",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!studentInfo}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {studentInfo ? "Créer le premier paiement" : "Chargement..."}
              </Button>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Qui a payé</TableHead>
                      <TableHead>Enregistré par</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiblePayments.map((p) => {
                      const pObj = p as unknown as Record<string, unknown>;
                      const dateVal = pickAnyDate(pObj);
                      const amount = toNumberSafe(p.montantPaye) ?? 0;
                      const status = toStringSafe(pObj["status"]);
                      const config = status ? statusConfig[status] : undefined;
                      const StatusIcon = config?.icon;
                      const keyId =
                        p.id ||
                        getFieldString(pObj, ["external_id"]) ||
                        String(Math.random());
                      const method =
                        getFieldString(pObj, ["methode", "mode"]) || "—";
                      const currency =
                        getFieldString(pObj, ["currency"]) || undefined;
                      const qui = getFieldString(pObj, ["qui_a_paye", "payer_user_id"]) || "—";
                      const enr = getFieldString(pObj, ["enregistre_par", "recordedBy_user_id"]) || "—";
                      const hasFactures =
                        Array.isArray(p.facture_ids) &&
                        p.facture_ids.length > 0;
                      const firstFactureId = hasFactures
                        ? String(p.facture_ids[0])
                        : undefined;

                      const handleSendEmail = (paymentId: string) => {
                        toast({
                          title: "Envoi d'e-mail",
                          description: `Fonctionnalité d'envoi d'e-mail pour le paiement ${paymentId} non implémentée.`,
                        });
                      };

                      return (
                        <TableRow key={keyId}>
                          <TableCell>{formatDate(dateVal)}</TableCell>
                          <TableCell>{method}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(amount, currency)}
                          </TableCell>
                          <TableCell>
                            {config ? (
                              <Badge
                                variant={config.variant}
                                className={config.className}
                              >
                                {StatusIcon && (
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                )}{" "}
                                {status}
                              </Badge>
                            ) : (
                              <span>{status || "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>{String(qui)}</TableCell>
                          <TableCell>{String(enr)}</TableCell>
                          <TableCell className="flex gap-2">
                            {status === "En traitement" && (
                              <>
                                <Button variant="outline" size="sm">
                                  Reçu temporaire
                                </Button>
                                <Button variant="outline" size="sm">
                                  ? Aide
                                </Button>
                              </>
                            )}
                            {status === "Confirmé" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!hasFactures}
                                  onClick={() =>
                                    firstFactureId && handleDownloadReceiptClick(firstFactureId)
                                  }
                                >
                                  <Download className="h-4 w-4 mr-1" /> Télécharger Reçu
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendEmail(keyId)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-1 h-4 w-4"
                                  >
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.93 1.93 0 0 1-2.06 0L2 7" />
                                  </svg>
                                  Envoyer par Email
                                </Button>
                              </>
                            )}
                            {!(status === "En traitement" || status === "Confirmé") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasFactures}
                              onClick={() => {
                                if (firstFactureId)
                                    handleDownloadReceiptClick(firstFactureId);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" /> PDF
                            </Button>
                            )}
                            {/* Bouton Payer */}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                if (studentInfo) {
                                  handlePayClick({
                                    id: studentInfo.id,
                                    nom: studentInfo.nom,
                                    prenom: studentInfo.prenom,
                                    totalDue: studentInfo.totalDue,
                                    totalPaid: payments.reduce(
                                      (sum, payment) => sum + (payment.montantPaye || 0),
                                      0
                                    ),
                                    remaining:
                                      studentInfo.totalDue -
                                      payments.reduce(
                                        (sum, payment) => sum + (payment.montantPaye || 0),
                                        0
                                      ),
                                  });
                                } else {
                                  handlePayClick({
                                    id: studentId,
                                    nom: "Étudiant",
                                    prenom: "",
                                    totalDue: 0,
                                    totalPaid: 0,
                                    remaining: 0,
                                  });
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Payer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Affiche {totalPayments === 0 ? 0 : startIdx + 1}–
                  {Math.min(endIdx, totalPayments)} sur {totalPayments}
                </span>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    if (studentInfo) {
                      handlePayClick(studentInfo);
                    }
                  }}
                  disabled={!studentInfo}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Créer un paiement
                </Button>
              </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document PDF</DialogTitle>
            <DialogDescription>
              Aperçu du document avant impression.
            </DialogDescription>
          </DialogHeader>
          {currentReceiptUrl ? (
            <iframe src={currentReceiptUrl} className="w-full h-full border-0" />
          ) : (
            <p>Chargement du document...</p>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsReceiptDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => window.print()}>
              Imprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Factures</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">Aucune facture.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">N° facture</th>
                    <th className="px-2 py-1 text-right">Montant total</th>
                    <th className="px-2 py-1 text-right">Payé (cumul)</th>
                    <th className="px-2 py-1 text-right">Restant</th>
                    <th className="px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const invObj = inv as unknown as Record<string, unknown>;
                    const amounts = getInvoiceAmounts(inv);
                    const numero =
                      inv.numero_facture ||
                      getFieldString(invObj, ["numero"]) ||
                      inv.id ||
                      "";
                    const curr =
                      inv.currency || getFieldString(invObj, ["currency"]);
                    const hasId = Boolean(inv.id);
                    return (
                      <tr
                        key={String(inv.id || numero)}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-2 py-1">{numero}</td>
                        <td className="px-2 py-1 text-right">
                          {formatMoney(amounts.total, curr)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatMoney(amounts.paid, curr)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatMoney(amounts.remaining, curr)}
                        </td>
                        <td className="px-2 py-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasId}
                            onClick={() =>
                              hasId && handleDownloadReceiptClick(String(inv.id))
                            }
                          >
                            <Download className="h-4 w-4 mr-1" /> PDF
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Paiement */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Effectuer un Paiement
            </DialogTitle>
            <DialogDescription>
              Enregistrer un nouveau paiement pour {selectedStudentForPayment?.prenom} {selectedStudentForPayment?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4">
            {/* Informations de l'étudiant */}
            {selectedStudentForPayment && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Informations de l'étudiant</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Nom:</strong> {selectedStudentForPayment.prenom} {selectedStudentForPayment.nom}</p>
                  <p><strong>Montant dû:</strong> {selectedStudentForPayment.totalDue} DH</p>
                  <p><strong>Montant payé:</strong> {selectedStudentForPayment.totalPaid} DH</p>
                  <p className="font-semibold text-green-600">
                    <strong>Restant dû:</strong> {selectedStudentForPayment.remaining} DH
                  </p>
                </div>
              </div>
            )}

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (DH)</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                min="0"
                max={selectedStudentForPayment ? selectedStudentForPayment.totalDue : undefined}
                {...paymentForm.register("montant", { valueAsNumber: true })}
                placeholder="Entrez le montant à payer"
              />
              {paymentForm.formState.errors.montant && (
                <p className="text-sm text-red-600">{paymentForm.formState.errors.montant.message}</p>
              )}
            </div>

            {/* Méthode de paiement */}
            <div className="space-y-2">
              <Label htmlFor="methode">Méthode de paiement</Label>
              <Select onValueChange={(value) => paymentForm.setValue("methode", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="carte">Carte bancaire</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              {paymentForm.formState.errors.methode && (
                <p className="text-sm text-red-600">{paymentForm.formState.errors.methode.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Input
                id="description"
                {...paymentForm.register("description")}
                placeholder="Description du paiement"
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancelPayment} size="sm">
                Annuler
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Enregistrer le Paiement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
