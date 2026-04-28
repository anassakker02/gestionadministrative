import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPaiementById,
  createPaiement,
  Paiement,
  getAllPaiements,
} from "@/api/paiementsApi";
import { factureService } from "@/services/factureService";
import { Facture } from "@/types/facture";
import { userService } from "@/services/userService";
import { studentService } from "@/services/studentService";
import {
  getEtudiants,
  Etudiant,
  getBoursesForStudentForm,
} from "@/api/etudiantsApi";
import { getTarifs, Tarif } from "@/api/tarifsApi";
import { User } from "@/types/user";
// Etudiant already imported above
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import { Student } from "@/types/student";
import StudentPaymentsAndInvoices from "@/components/StudentPaymentsAndInvoices";
import StudentNameDisplay from "@/components/StudentNameDisplay";
import PaymentStudentInfo from "@/components/PaymentStudentInfo";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Helpers globaux (stables) pour lire des champs hétérogènes et parser des dates/numériques
const getStringField = (obj: unknown, keys: string[]) => {
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
};

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

const getNumberField = (obj: unknown, keys: string[]) => {
  const s = getStringField(obj, keys);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isNaN(n) ? undefined : n;
};

const getDateField = (obj: unknown, keys: string[]) => {
  if (typeof obj !== "object" || obj === null) return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (v == null) continue;
    const d1 = parsePrimitiveDate(v);
    if (d1) return d1;
    const d2 = parseFirestoreLikeDate(v);
    if (d2) return d2;
  }
  return undefined;
};

const mockPayments = [
  {
    id: 1,
    student: "Marie Dubois",
    class: "3ème A",
    amount: 450,
    dueDate: "2024-01-15",
    status: "Payé",
    paymentDate: "2024-01-10",
    method: "Virement",
    invoice: "INV-2024-001",
  },
  {
    id: 2,
    student: "Jean Martin",
    class: "2nde B",
    amount: 485,
    dueDate: "2024-01-15",
    status: "En retard",
    paymentDate: null,
    method: null,
    invoice: "INV-2024-002",
  },
  {
    id: 3,
    student: "Sophie Laurent",
    class: "1ère S",
    amount: 520,
    dueDate: "2024-02-15",
    status: "En attente",
    paymentDate: null,
    method: null,
    invoice: "INV-2024-003",
  },
  {
    id: 4,
    student: "Pierre Moreau",
    class: "Terminale A",
    amount: 475,
    dueDate: "2024-01-20",
    status: "Payé",
    paymentDate: "2024-01-18",
    method: "Carte bancaire",
    invoice: "INV-2024-004",
  },
];

const statusConfig = {
  Payé: {
    variant: "default" as const,
    className: "bg-green-500 text-white", // Directly use green for success
    icon: CheckCircle,
  },
  "En retard": {
    variant: "destructive" as const,
    className: "bg-red-500 text-white", // Directly use red for destructive
    icon: AlertCircle,
  },
  "En attente": {
    variant: "secondary" as const,
    className: "bg-yellow-500 text-white", // Directly use yellow for warning
    icon: Clock,
  },
  enregistré: {
    variant: "default" as const,
    className: "bg-blue-500 text-white", // Directly use blue for info
    icon: Clock,
  },
};

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { user, isAdmin, isComptable, isSubAdmin } = useAuth();
  const canManagePayments = isAdmin || isComptable || isSubAdmin;

  // Filtres avancés pour la liste des paiements
  const [paymentDateFrom, setPaymentDateFrom] = useState<string>("");
  const [paymentDateTo, setPaymentDateTo] = useState<string>("");
  const [filterStudentId, setFilterStudentId] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Facture | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] =
    useState<Etudiant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "PayPal" | "Espèces" | "Virement" | "Carte bancaire"
  >("Espèces");
  // selectedPayer removed: payments are recorded for the selected student,
  // and the user who inserts the payment is stored as `enregistre_par`.
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: invoicesData } = useQuery<{ data: Facture[] }, Error>({
    queryKey: ["invoices"],
    queryFn: factureService.getFactures,
    enabled: canManagePayments,
  });

  const invoices: Facture[] = invoicesData?.data || [];
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery<
    { status: boolean; data: Paiement[] },
    Error
  >({
    queryKey: ["payments"],
    queryFn: () => getAllPaiements(),
    enabled: canManagePayments,
  });
  const payments: Paiement[] = useMemo(() => {
    const acc: Paiement[] = [];
    if (paymentsData?.data) {
      if (Array.isArray(paymentsData.data)) {
        acc.push(...paymentsData.data);
      } else if (
        typeof paymentsData.data === "object" &&
        Array.isArray(
          (paymentsData.data as { paiements?: Paiement[] }).paiements,
        )
      ) {
        acc.push(...(paymentsData.data as { paiements: Paiement[] }).paiements);
      }
    }
    return acc;
  }, [paymentsData]);

  // Fetch students and users to resolve foreign keys (etudiant, parent, qui_a_paye)
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery<
    { data: Etudiant[] },
    Error
  >({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await studentService.getAllStudents();
      return { data: response.data || [] };
    },
    enabled: canManagePayments,
  });
  const students: Etudiant[] = studentsData?.data || [];

  // Méthodes de paiement disponibles (dérivées dynamiquement des données)
  const availableMethods: string[] = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) {
      const m = getStringField(p as unknown, [
        "mode",
        "methode",
        "mode_paiement",
        "method",
      ]);
      if (m && m.trim()) set.add(m.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [payments]);

  // Charger tarifs et bourses pour calculer le Montant Dû (plafond) par étudiant
  const { data: tarifsResp } = useQuery<{ data?: Tarif[] } | Tarif[], Error>({
    queryKey: ["tarifs"],
    queryFn: getTarifs,
    enabled: canManagePayments,
  });
  const tarifs: Tarif[] = Array.isArray(tarifsResp)
    ? (tarifsResp as Tarif[])
    : (tarifsResp?.data as Tarif[]) || [];

  const { data: boursesResp } = useQuery<
    { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>,
    Error
  >({
    queryKey: ["bourses"],
    queryFn: getBoursesForStudentForm,
    enabled: canManagePayments,
  });
  const bourses: Array<Record<string, unknown>> = Array.isArray(boursesResp)
    ? (boursesResp as Array<Record<string, unknown>>)
    : (boursesResp?.data as Array<Record<string, unknown>>) || [];

  const userQuery = useQuery<{ data: User[] }, Error>({
    queryKey: ["all-users"],
    queryFn: async () =>
      (await (userService.getAllUsers?.() ??
        Promise.resolve({ data: [] as User[] }))) as { data: User[] },
    enabled: canManagePayments,
  });
  const users: User[] = userQuery.data?.data || [];

  const studentById: Record<string, Etudiant> = {};
  for (const s of students)
    if (s && typeof s === "object" && s.id) studentById[String(s.id)] = s;
  const userById: Record<string, User> = {};
  for (const u of users)
    if (u && typeof u === "object" && u.id) userById[String(u.id)] = u;

  const currencyFormatter = new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
  });

  // Local helper type for student paymentStatus used in payment dashboard
  type StudentPaymentStatus = {
    paymentWarningStatus?: string;
    totalMontantDu?: number;
    totalPaid?: number;
    remainingAmount?: number;
  };

  type StudentWithPayment = Etudiant & { paymentStatus?: StudentPaymentStatus };
  const [selectedPayment, setSelectedPayment] = useState<Paiement | null>(null);
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false);
  // Student details modal states (copied behavior from PaymentDashboard)
  const [selectedStudentForDetails, setSelectedStudentForDetails] =
    useState<Student | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);
  const [paymentRelatedInvoice, setPaymentRelatedInvoice] =
    useState<Facture | null>(null);
  const [isLoadingRelatedInvoice, setIsLoadingRelatedInvoice] = useState(false);
  const [paymentActor, setPaymentActor] = useState<User | null>(null);
  const [isLoadingPaymentActor, setIsLoadingPaymentActor] = useState(false);
  const [paymentActorError, setPaymentActorError] = useState<string | null>(
    null,
  );
  const [paymentPayerId, setPaymentPayerId] = useState<string | null>(null);
  const [paymentPayerName, setPaymentPayerName] = useState<string | null>(null);

  // Calcule un statut lisible à partir des totaux
  function computeStatus(
    due: number,
    paid: number,
    remaining: number,
    warning?: string,
  ): string {
    const _due = Number.isFinite(due) ? due : 0;
    const _paid = Number.isFinite(paid) ? paid : 0;
    const _rem = Number.isFinite(remaining)
      ? remaining
      : Math.max(0, _due - _paid);
    if (_paid > _due)
      return `Trop-perçu de ${(_paid - _due).toLocaleString("fr-FR")} MAD`;
    if (_rem <= 0 && _paid >= _due && (_due || _paid))
      return "Payé intégralement";
    if (_paid === 0 && (_due || _rem)) return "Non payé";
    return warning || "En cours";
  }

  // Group payments by student_id. If the payment doesn't have an etudiant_id/student_id,
  // try to resolve it via linked facture(s) (facture_id or facture_ids) using the loaded `invoices`.
  const invoiceById: Record<string, Facture> = {};
  for (const inv of invoices) {
    if (inv?.id) invoiceById[inv.id] = inv;
  }

  // Année scolaire courante: tolérer plusieurs formats ("YYYY-YYYY+1", "YYYY", "YYYY/YY")
  const _now = new Date();
  const _y = _now.getFullYear();
  const _m = _now.getMonth(); // 0-11
  // Année commence en septembre
  const _start = _m >= 8 ? _y : _y - 1;
  const _end = _start + 1;
  const currentAcademicYear = `${_start}-${_end}`;
  const academicYearCandidates = new Set<string>([
    `${_start}-${_end}`,
    `${_start}`,
    `${_start}/${_end}`,
    `${_start}-${String(_end).slice(-2)}`,
  ]);

  // Construire un index des bourses par id pour retrouver un pourcentage/réduction
  const bourseById: Record<string, Record<string, unknown>> = {};
  for (const b of bourses) {
    const id = typeof b.id === "string" ? (b.id as string) : undefined;
    if (id) bourseById[id] = b;
  }

  // Extrait un pourcentage de bourse (0..1) si présent; sinon 0.
  const getBoursePercent = (
    rec: Record<string, unknown> | undefined,
  ): number => {
    if (!rec) return 0;
    const numCandidates = [
      rec["pourcentage"] as number | string | undefined,
      rec["percentage"] as number | string | undefined,
      rec["taux"] as number | string | undefined,
      rec["taux_reduction"] as number | string | undefined,
      rec["reduction_percent"] as number | string | undefined,
      rec["pourcentage_remise"] as number | string | undefined,
    ];
    for (const v of numCandidates) {
      if (typeof v === "number") {
        if (v > 1 && v <= 100) return v / 100;
        if (v >= 0 && v <= 1) return v;
      }
      if (typeof v === "string") {
        const n = Number(v.replace(/\s|%/g, ""));
        if (!Number.isNaN(n)) {
          if (n > 1 && n <= 100) return n / 100;
          if (n >= 0 && n <= 1) return n;
        }
      }
    }
    return 0;
  };

  // Extrait un montant de réduction absolue éventuel
  const getBourseAmount = (
    rec: Record<string, unknown> | undefined,
  ): number => {
    if (!rec) return 0;
    const v = rec["montant"];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : 0;
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  };

  // Build enriched students with aggregated payment values
  const studentsWithPayment: StudentWithPayment[] = students.map((s) => {
    // student id may be either the etudiant doc id or the linked user id
    const sid = s.id || "unknown";
    const srec = s as unknown as Record<string, unknown>;
    let userId: string | null = null;
    if (typeof srec.user_id === "string") userId = srec.user_id;
    else if (typeof srec.userId === "string") userId = srec.userId;
    const sidCandidates = [sid, userId].filter(Boolean) as string[];

    // Montant Dû (plafond) = somme des tarifs (Scolarité + Autres frais) pour la classe et l'année scolaire courante
    // puis application de la bourse (pourcentage ou montant), clampé à >= 0
    const classeId =
      typeof s.classe_id === "string" ? (s.classe_id as string) : "";
    const baseDue = tarifs
      .filter((t) => {
        if (!t || t.classe_id !== classeId || t.isActive === false)
          return false;
        const ay = (t as unknown as Record<string, unknown>)["annee_scolaire"];
        const ayStr =
          typeof ay === "string" || typeof ay === "number" ? String(ay) : "";
        return academicYearCandidates.has(ayStr);
      })
      .filter((t) =>
        ["Scolarité", "Autres frais"].includes(
          typeof t.type === "string" ? (t.type as string) : "",
        ),
      )
      .reduce((sum, t) => sum + (Number(t.montant) || 0), 0);

    const bourseId =
      typeof s.bourse_id === "string" ? (s.bourse_id as string) : undefined;
    const bRec = bourseId ? bourseById[bourseId] : undefined;
    const percent = getBoursePercent(bRec);
    const absolute = getBourseAmount(bRec);
    const afterPercent = Math.max(0, baseDue - baseDue * percent);
    const totalMontantDu = Math.max(0, afterPercent - absolute);

    // Dédupliquer les paiements (un même paiement peut matcher par student_id ET par facture_ids)
    const seenPayIds = new Set<string>();
    const pList = payments.reduce((acc: Paiement[], p: Paiement) => {
      // clé d'identification robuste du paiement
      const payId =
        getStringField(p as unknown, ["id", "paiement_id", "_id"]) || undefined;

      let matches = false;
      // 1) match direct via student id
      const pid = getStringField(p as unknown, [
        "etudiant_id",
        "student_id",
        "etudiantId",
        "studentId",
      ]);
      if (pid && sidCandidates.includes(pid)) matches = true;

      // 2) sinon, match via facture_ids
      if (!matches) {
        const prec = p as unknown as Record<string, unknown>;
        const possible =
          prec["facture_ids"] ||
          prec["factureIds"] ||
          prec["invoice_ids"] ||
          prec["invoices"];
        if (Array.isArray(possible)) {
          for (const fid of possible as unknown[]) {
            if (
              typeof fid === "string" &&
              invoiceById[fid] &&
              sidCandidates.includes(invoiceById[fid].etudiant_id)
            ) {
              matches = true;
              break;
            }
          }
        }
      }

      if (matches) {
        const key = payId || JSON.stringify(p);
        if (!seenPayIds.has(key)) {
          seenPayIds.add(key);
          acc.push(p);
        }
      }
      return acc;
    }, []);

    const totalPaid = pList.reduce((sum, p) => {
      const n = getNumberField(p as unknown, [
        "montantPaye",
        "montant_paye",
        "amount",
        "montant",
      ]);
      return sum + (typeof n === "number" ? n : 0);
    }, 0);

    const remainingAmount = Math.max(0, totalMontantDu - totalPaid);

    let paymentWarningStatus: string | undefined;
    if (totalMontantDu > 0 && totalPaid / totalMontantDu < 0.5) {
      paymentWarningStatus = "Avertissement: 1er Semestre (50%) non atteint";
    }

    return {
      ...s,
      paymentStatus: {
        totalMontantDu,
        totalPaid,
        remainingAmount,
        paymentWarningStatus,
      },
    } as StudentWithPayment;
  });

  const paymentsByStudent: Record<string, Paiement[]> = payments.reduce(
    (acc: Record<string, Paiement[]>, p: Paiement) => {
      // Try direct student id fields first
      let sid = getStringField(p, ["student_id", "etudiant_id"]);

      // If absent, try linked facture id (single)
      if (!sid) {
        const fId = getStringField(p, [
          "facture_id",
          "invoice_id",
          "factureId",
        ]);
        if (fId && invoiceById[fId]) {
          sid = invoiceById[fId].etudiant_id || undefined;
        }
      }

      // If still absent, try facture_ids array
      if (!sid) {
        const possible = p["facture_ids"] || p["factureIds"] || p["factures"];
        if (Array.isArray(possible)) {
          for (const fid of possible as unknown[]) {
            if (typeof fid === "string" && invoiceById[fid]) {
              sid = invoiceById[fid].etudiant_id || sid;
              if (sid) break;
            }
          }
        }
      }

      const key = sid || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    },
    {},
  );

  // (déplacé plus bas, proche du JSX)

  const fetchInvoiceForPayment = async (payment: Paiement) => {
    // Try common field names facture_id / invoice_id
    const factureId = getStringField(payment, [
      "facture_id",
      "invoice_id",
      "factureId",
    ]);
    if (!factureId) return null;
    try {
      setIsLoadingRelatedInvoice(true);
      const res = await factureService.getFacture(factureId);
      setPaymentRelatedInvoice(res.data || null);
      return res.data || null;
    } catch (err) {
      setPaymentRelatedInvoice(null);
      return null;
    } finally {
      setIsLoadingRelatedInvoice(false);
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: ({
      id,
      paymentData,
    }: {
      id: string;
      paymentData: Partial<Paiement>;
    }) => createPaiement(paymentData),
    onSuccess: () => {
      // Invalidate invoices and payments to refresh dashboard totals
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // Invalider aussi les clés utilisées par le PaymentDashboard
      queryClient.invalidateQueries({ queryKey: ["factures-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["payments-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-payment-status"] });
      toast({
        title: "Paiement enregistré",
        description: "Le paiement a été enregistré avec succès.",
      });
      setIsPaymentModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de paiement",
        description: `Échec de l'enregistrement du paiement: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const payFactureMutation = useMutation({
    mutationFn: ({
      id,
      paymentData,
    }: {
      id: string;
      paymentData: Record<string, unknown>;
    }) => factureService.payFacture(id, paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Facture mise à jour",
        description: "Le statut de la facture a été mis à jour.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Échec de la mise à jour de la facture: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const generateFactureMutation = useMutation({
    mutationFn: (payload: {
      student_id: string;
      items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
      description?: string;
      currency?: string;
    }) => factureService.generateForStudent(payload),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Facture générée",
        description: "La facture a été générée avec succès.",
      });
    },
  });

  // Export PDF (Factures + Paiements) dans une nouvelle fenêtre imprimable
  const handleExportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;

    const esc = (s: unknown) => {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };
    const fmtMAD = (n: unknown) =>
      currencyFormatter.format(typeof n === "number" ? n : Number(n) || 0);
    const fmtDate = (d: Date | undefined) =>
      d ? d.toLocaleString("fr-FR") : "";

    const factureRowsHtml = invoices
      .map((inv) => {
        const stu = inv.etudiant_id ? studentById[inv.etudiant_id] : undefined;
        const stuName = stu
          ? `${stu.nom || ""} ${stu.prenom || ""}`.trim()
          : "";
        const created = fmtDate(
          getDateField(inv as unknown, ["createdAt", "created_at", "date"]),
        );
        const invNum = inv.numero || "FAC-" + String(inv.id || "").slice(-8);
        return `<tr>
                <td>${esc(invNum)}</td>
                <td>${esc(stuName)}</td>
                <td>${esc(inv.etudiant_id || "")}</td>
                <td>${esc(inv.statut || "")}</td>
                <td style="text-align:right">${esc(
                  fmtMAD(inv.montant_total || 0),
                )}</td>
                <td>${esc(created)}</td>
              </tr>`;
      })
      .join("");

    const paiementRowsHtml = payments
      .map((p) => {
        const sid = getStringField(p, ["etudiant_id", "student_id"]) || "";
        const stu = sid ? studentById[sid] : undefined;
        const stuName = stu
          ? `${stu.nom || ""} ${stu.prenom || ""}`.trim()
          : "";
        const montant =
          getNumberField(p as unknown, [
            "montantPaye",
            "montant_paye",
            "amount",
            "montant",
          ]) || 0;
        const methode =
          getStringField(p, ["mode", "methode", "mode_paiement", "method"]) ||
          "";
        const date = fmtDate(
          getDateField(p, [
            "date",
            "date_paiement",
            "datePaiement",
            "payment_date",
            "paymentDate",
            "createdAt",
          ]),
        );
        return `<tr>
                <td>${esc(
                  (p as unknown as Record<string, unknown>).id || "",
                )}</td>
                <td>${esc(stuName)}</td>
                <td>${esc(sid)}</td>
                <td style="text-align:right">${esc(fmtMAD(montant))}</td>
                <td>${esc(methode)}</td>
                <td>${esc(date)}</td>
              </tr>`;
      })
      .join("");

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Export Paiements et Factures</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            h1 { margin: 0 0 15px; font-size: 2.2em; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { margin-top: 30px; font-size: 1.8em; color: #34495e; }
            .meta { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }
            .summary { display: flex; flex-wrap: wrap; justify-content: space-around; gap: 15px; margin: 20px 0 30px; }
            .card { background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px 20px; flex: 1 1 calc(33% - 30px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); min-width: 200px; }
            .label { font-size: 0.85em; color: #555; margin-bottom: 5px; }
            .value { font-size: 1.8em; font-weight: bold; color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; background-color: #fff; }
            th, td { border: 1px solid #e0e0e0; padding: 10px 15px; text-align: left; font-size: 0.95em; }
            th { background: #f5f5f5; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
            td.amount { text-align: right; font-weight: bold; color: #28a745; }
            .actions { text-align: center; margin: 20px 0; }
            .btn { background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 1em; text-decoration: none; display: inline-block; transition: background-color 0.3s ease; }
            .btn:hover { background-color: #0056b3; }
            @media print { .actions { display: none; } }
          </style>
        </head>
        <body>
          <h1>Export Paiements et Factures</h1>
          <div class="meta">Généré le ${new Date().toLocaleString(
            "fr-FR",
          )} • Devise: MAD</div>
          <div class="actions"><button class="btn" onclick="window.print()">Imprimer</button></div>
          <div class="summary">
            <div class="card"><div class="label">Total Facturé</div><div class="value">${esc(
              currencyFormatter.format(totalAmount),
            )}</div></div>
            <div class="card"><div class="label">Montant Encaissé</div><div class="value">${esc(
              currencyFormatter.format(paidAmount),
            )}</div></div>
            <div class="card"><div class="label">En Attente</div><div class="value">${esc(
              currencyFormatter.format(pendingAmount),
            )}</div></div>
          </div>

          <h2>Factures</h2>
          <table>
            <thead>
              <tr>
                <th>Numéro</th><th>Étudiant</th><th>Étudiant ID</th><th>Statut</th><th>Montant Total</th><th>Créée le</th>
              </tr>
            </thead>
            <tbody>${factureRowsHtml}</tbody>
          </table>

          <h2>Paiements</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Étudiant</th><th>Étudiant ID</th><th>Montant</th><th>Méthode</th><th>Date</th>
              </tr>
            </thead>
            <tbody>${paiementRowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    (w.document as unknown as { write: (s: string) => void }).write(html);
    w.document.close();
    w.focus();
  };

  const openPaymentDetails = (payment: Paiement) => {
    setSelectedPayment(payment);
    setIsPaymentDetailOpen(true);
    // Fetch the related invoice immediately
    fetchInvoiceForPayment(payment);
    // Also fetch the user who made the payment (if present)
    fetchUserForPayment(payment);
  };

  // Fonction d'impression pour les détails de paiement
  const handlePrintPaymentDetails = () => {
    if (!selectedPayment) return;

    const w = window.open("", "_blank");
    if (!w) return;

    const esc = (s: unknown) => {
      if (s == null) return "";
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const fmtMAD = (n: unknown) =>
      currencyFormatter.format(typeof n === "number" ? n : Number(n) || 0);

    const fmtDate = (d: Date | undefined) =>
      d ? d.toLocaleString("fr-FR") : "";

    // Récupérer les informations de l'étudiant
    const studentId = getStringField(selectedPayment, [
      "etudiant_id",
      "student_id",
    ]);
    const student = studentId ? studentById[studentId] : undefined;
    const studentName = student
      ? `${student.nom || ""} ${student.prenom || ""}`.trim()
      : "N/A";

    // Récupérer les factures liées
    const factureIds = selectedPayment.facture_ids || [];
    const relatedInvoices = factureIds
      .map((id) => invoiceById[id])
      .filter(Boolean);

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Détails du Paiement - ${esc(selectedPayment.id || "N/A")}</title>
          <style>
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              padding: 20px; 
              color: #333; 
              line-height: 1.6; 
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              margin: 0 0 20px; 
              font-size: 2.2em; 
              color: #2c3e50; 
              border-bottom: 3px solid #3498db; 
              padding-bottom: 10px; 
              text-align: center;
            }
            h2 { 
              margin-top: 30px; 
              font-size: 1.5em; 
              color: #34495e; 
              border-bottom: 1px solid #bdc3c7;
              padding-bottom: 5px;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin: 20px 0; 
            }
            .info-section { 
              background-color: #f8f9fa; 
              border: 1px solid #e9ecef; 
              border-radius: 8px; 
              padding: 15px; 
            }
            .info-item { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              padding: 5px 0;
              border-bottom: 1px dotted #dee2e6;
            }
            .info-item:last-child { 
              border-bottom: none; 
            }
            .label { 
              font-weight: 600; 
              color: #6c757d; 
            }
            .value { 
              font-weight: 500; 
              color: #2c3e50; 
            }
            .amount { 
              color: #28a745; 
              font-weight: bold; 
              font-size: 1.1em;
            }
            .invoice-item { 
              background-color: #e3f2fd; 
              border: 1px solid #bbdefb; 
              border-radius: 6px; 
              padding: 12px; 
              margin: 8px 0; 
            }
            .invoice-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr 1fr; 
              gap: 10px; 
            }
            .details-section { 
              background-color: #fff3cd; 
              border: 1px solid #ffeaa7; 
              border-radius: 6px; 
              padding: 12px; 
              margin: 10px 0; 
            }
            .meta { 
              color: #6c757d; 
              font-size: 0.9em; 
              margin-bottom: 20px; 
              text-align: center;
            }
            .actions { 
              text-align: center; 
              margin: 20px 0; 
            }
            .btn { 
              background-color: #007bff; 
              color: #fff; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 5px; 
              cursor: pointer; 
              font-size: 1em; 
              text-decoration: none; 
              display: inline-block; 
              transition: background-color 0.3s ease; 
            }
            .btn:hover { 
              background-color: #0056b3; 
            }
            @media print { 
              .actions { display: none; } 
              body { padding: 0; }
            }
            @media screen and (max-width: 768px) {
              .info-grid { grid-template-columns: 1fr; }
              .invoice-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <h1>Détails du Paiement</h1>
          <div class="meta">Généré le ${new Date().toLocaleString("fr-FR")} • Devise: MAD</div>
          <div class="actions"><button class="btn" onclick="window.print()">Imprimer</button></div>

          <div class="info-grid">
            <div class="info-section">
              <h2>Informations Générales</h2>
              <div class="info-item">
                <span class="label">ID Paiement:</span>
                <span class="value">${esc(selectedPayment.id || "N/A")}</span>
              </div>
              <div class="info-item">
                <span class="label">Montant:</span>
                <span class="value amount">${esc(fmtMAD(getNumberField(selectedPayment, ["montantPaye", "montant_paye", "amount", "montant"]) || 0))}</span>
              </div>
              <div class="info-item">
                <span class="label">Méthode:</span>
                <span class="value">${esc(getStringField(selectedPayment, ["mode", "methode", "mode_paiement", "method"]) || "N/A")}</span>
              </div>
              <div class="info-item">
                <span class="label">Statut:</span>
                <span class="value">${esc(getStringField(selectedPayment, ["status"]) || "N/A")}</span>
              </div>
              <div class="info-item">
                <span class="label">Date:</span>
                <span class="value">${esc(fmtDate(getDateField(selectedPayment, ["date", "date_paiement", "datePaiement", "payment_date", "paymentDate", "paidAt", "paid_at", "createdAt", "created_at", "timestamp", "time"])))}</span>
              </div>
            </div>

            <div class="info-section">
              <h2>Informations Étudiant</h2>
              <div class="info-item">
                <span class="label">Nom:</span>
                <span class="value">${esc(studentName)}</span>
              </div>
              <div class="info-item">
                <span class="label">ID Étudiant:</span>
                <span class="value">${esc(studentId || "N/A")}</span>
              </div>
              ${
                student
                  ? `
                <div class="info-item">
                  <span class="label">Classe:</span>
                  <span class="value">${esc(getStringField(student, ["classe", "classe_nom"]) || "N/A")}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">${esc(getStringField(student, ["email"]) || "N/A")}</span>
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <div class="info-section">
            <h2>Traçabilité</h2>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="label">Enregistré par:</span>
                  <span class="value">${esc(getStringField(selectedPayment, ["enregistre_par", "recordedBy_user_id"]) || "N/A")}</span>
                </div>
                <div class="info-item">
                  <span class="label">Qui a payé:</span>
                  <span class="value">${esc(getStringField(selectedPayment, ["qui_a_paye", "payer_user_id"]) || "N/A")}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="label">Date de création:</span>
                  <span class="value">${esc(fmtDate(getDateField(selectedPayment, ["createdAt", "created_at", "timestamp"])))}</span>
                </div>
                <div class="info-item">
                  <span class="label">Dernière modification:</span>
                  <span class="value">${esc(fmtDate(getDateField(selectedPayment, ["updatedAt", "updated_at"])))}</span>
                </div>
              </div>
            </div>
          </div>

          ${
            relatedInvoices.length > 0
              ? `
            <div class="info-section">
              <h2>Factures Liées</h2>
              ${relatedInvoices
                .map(
                  (invoice) => `
                <div class="invoice-item">
                  <div class="invoice-grid">
                    <div>
                      <span class="label">Numéro:</span>
                      <span class="value">${esc(invoice.numero || "N/A")}</span>
                    </div>
                    <div>
                      <span class="label">Montant:</span>
                      <span class="value">${esc(fmtMAD(invoice.montant_total || 0))}</span>
                    </div>
                    <div>
                      <span class="label">Statut:</span>
                      <span class="value">${esc(invoice.statut || "N/A")}</span>
                    </div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${(() => {
            const details = selectedPayment.details;
            const description = getStringField(selectedPayment, [
              "description",
            ]);
            const notes = getStringField(selectedPayment, ["notes"]);

            if (details || description || notes) {
              return `
                <div class="details-section">
                  <h2>Détails Supplémentaires</h2>
                  ${
                    description
                      ? `
                    <div style="margin-bottom: 10px;">
                      <span class="label">Description:</span>
                      <p style="margin: 5px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${esc(description)}</p>
                    </div>
                  `
                      : ""
                  }
                  ${
                    notes
                      ? `
                    <div style="margin-bottom: 10px;">
                      <span class="label">Notes:</span>
                      <p style="margin: 5px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${esc(notes)}</p>
                    </div>
                  `
                      : ""
                  }
                  ${
                    details && typeof details === "object"
                      ? `
                    <div>
                      <span class="label">Détails techniques:</span>
                      <pre style="margin: 5px 0; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-size: 0.8em; overflow-x: auto;">${esc(JSON.stringify(details, null, 2))}</pre>
                    </div>
                  `
                      : ""
                  }
                </div>
              `;
            }
            return "";
          })()}
        </body>
      </html>`;

    (w.document as unknown as { write: (s: string) => void }).write(html);
    w.document.close();
    w.focus();
  };

  // Ouvre le modal d'enregistrement de paiement pour un étudiant donné
  function handleRegisterPaymentClick(student: StudentWithPayment): void {
    setSelectedInvoiceForPayment(null);
    setSelectedStudentForPayment(student as Etudiant);
    setPaymentAmount(0);
    setIsPaymentModalOpen(true);
  }

  const fetchUserForPayment = async (payment: Paiement) => {
    setPaymentActorError(null);
    setPaymentPayerId(null);
    setPaymentPayerName(null);
    // Try to extract a user id from common fields
    let resolvedUserId = getStringField(payment, [
      "qui_a_paye",
      "enregistre_par",
      "user_id",
      "userId",
    ]);

    // If absent, try to fetch the full paiement record to recover the actor
    if (!resolvedUserId) {
      try {
        const paymentId = getStringField(payment, ["id", "paiement_id", "_id"]);
        if (paymentId) {
          const fullResp = await getPaiementById(paymentId);
          let fullRec: unknown = fullResp;
          if (fullResp && typeof fullResp === "object") {
            const mrec = fullResp as Record<string, unknown>;
            fullRec =
              "data" in mrec && typeof mrec.data !== "undefined"
                ? mrec.data
                : mrec;
          }
          const fallbackUserId = getStringField(fullRec, [
            "qui_a_paye",
            "enregistre_par",
            "user_id",
            "userId",
          ]);
          if (fallbackUserId) resolvedUserId = fallbackUserId;

          // Try to recover amount if missing in selectedPayment
          const fallbackAmount = getNumberField(fullRec, [
            "montantPaye",
            "montant_paye",
            "amount",
            "montant",
          ]);
          if (typeof fallbackAmount !== "undefined") {
            setSelectedPayment((prev) =>
              prev
                ? ({ ...prev, montantPaye: fallbackAmount } as Paiement)
                : prev,
            );
          }
        }
      } catch (err) {
      }
    }

    if (!resolvedUserId) {
      setPaymentActor(null);
      return null;
    }

    // Conserver l'ID du payeur pour affichage en cas d'indisponibilité de l'API user
    setPaymentPayerId(resolvedUserId);

    // Fallback de nom local: essayer d'identifier l'étudiant ou un parent lié
    // 1) Si c'est un étudiant
    const maybeStudent = studentById[resolvedUserId];
    if (maybeStudent) {
      const fullName = `${maybeStudent.nom || ""} ${
        maybeStudent.prenom || ""
      }`.trim();
      if (fullName) setPaymentPayerName(fullName);
    } else {
      // 2) Sinon, vérifier si l'ID correspond à un parent d'un étudiant connu
      const parentOwner = students.find((s) => {
        const rec = s as unknown as Record<string, unknown>;
        const pid =
          (typeof rec.parent_id === "string" && rec.parent_id) ||
          (typeof rec.parentId === "string" && rec.parentId) ||
          (typeof rec.tuteur_id === "string" && rec.tuteur_id) ||
          (typeof rec.responsable_id === "string" && rec.responsable_id) ||
          undefined;
        return pid === resolvedUserId;
      });
      if (parentOwner) {
        const fullName = `${parentOwner.nom || ""} ${
          parentOwner.prenom || ""
        }`.trim();
        if (fullName) setPaymentPayerName(`Parent de ${fullName}`);
      }
    }

    // If the client already fetched users, use the cached map to avoid calling a protected endpoint
    if (userById && userById[resolvedUserId]) {
      setPaymentActor(userById[resolvedUserId]);
      return userById[resolvedUserId];
    }

    // Avoid calling /users/:id endpoint if current user is not admin (backend protects it)
    if (!isAdmin) {
      setPaymentActor(null);
      setPaymentActorError(null);
      return null;
    }

    try {
      setIsLoadingPaymentActor(true);
      const res = await userService.getProfile(resolvedUserId);
      const maybe = res as unknown;
      let u: User | null = null;
      if (maybe && typeof maybe === "object") {
        const mrec = maybe as Record<string, unknown>;
        u =
          "data" in mrec && typeof mrec.data !== "undefined"
            ? (mrec.data as unknown as User)
            : (mrec as unknown as User);
      }
      setPaymentActor(u || null);
      return u || null;
    } catch (err: unknown) {
      const errRec = err as Record<string, unknown>;
      const status = (errRec.response as Record<string, unknown> | undefined)
        ?.status as number | undefined;
      const srvMsg = (
        errRec.response as { data?: { message?: string } } | undefined
      )?.data?.message;
      if (status === 404) {
        setPaymentActorError(srvMsg || "Utilisateur non trouvé");
      } else if (status === 403) {
        setPaymentActorError(
          srvMsg || "Accès refusé pour récupérer l'utilisateur",
        );
      } else {
        setPaymentActorError(srvMsg || "Impossible de récupérer l'utilisateur");
      }
      setPaymentActor(null);
      return null;
    } finally {
      setIsLoadingPaymentActor(false);
    }
  };

  const handleProcessPayment = async () => {
    // allow processing when either an invoice or a student is selected
    if (!selectedInvoiceForPayment && !selectedStudentForPayment) return;

    // qui_a_paye = the student by default (we record who paid as the student)
    const quiAPaye: string | undefined = selectedStudentForPayment
      ? selectedStudentForPayment.id
      : selectedInvoiceForPayment?.etudiant_id || undefined;

    const studentId = selectedStudentForPayment
      ? selectedStudentForPayment.id
      : selectedInvoiceForPayment?.etudiant_id;
    const studentName = selectedStudentForPayment
      ? `${selectedStudentForPayment.nom || ""} ${
          selectedStudentForPayment.prenom || ""
        }`.trim()
      : undefined;

    const paymentBase: Record<string, unknown> = {
      student_id: studentId,
      student_name: studentName,
      montant_paye: paymentAmount,
      date_paiement: new Date().toISOString(),
      mode_paiement: paymentMethod,
      mode: paymentMethod,
      statut: "pending",
      qui_a_paye: quiAPaye || undefined,
      enregistre_par: user?.id,
    };

    if (selectedInvoiceForPayment && !selectedStudentForPayment) {
      // legacy: tie to selected invoice
      (paymentBase as Record<string, unknown>).facture_id =
        selectedInvoiceForPayment.id;
    }

    try {
      setIsCreatingPayment(true);
      // Build API payload matching backend expectations
      const apiPaymentData: Record<string, unknown> = {
        montantPaye: Number(paymentAmount),
        methode: paymentMethod === "PayPal" ? "paypal" : paymentMethod,
        etudiant_id: studentId,
        details: { student_name: studentName },
        qui_a_paye: paymentBase.qui_a_paye,
        enregistre_par: paymentBase.enregistre_par,
      };
      if (selectedInvoiceForPayment && selectedInvoiceForPayment.id) {
        apiPaymentData.facture_ids = [selectedInvoiceForPayment.id];
      } else if (selectedStudentForPayment && selectedStudentForPayment.id) {
        // Aucun facture sélectionnée: rattacher automatiquement aux factures impayées/partielles de l'étudiant
        const sid = selectedStudentForPayment.id;
        const candidateInvoices = invoices
          .filter((inv) => inv && inv.etudiant_id === sid)
          .filter((inv) => {
            const statut = (inv as unknown as Record<string, unknown>)[
              "statut"
            ] as string;
            const paid = Number(
              (inv as unknown as Record<string, unknown>)["montantPaye"] ?? 0,
            );
            const total = Number(
              (inv as unknown as Record<string, unknown>)["montant_total"] ?? 0,
            );
            const remaining = Number(
              (inv as unknown as Record<string, unknown>)["montantRestant"] ??
                total - paid,
            );
            return (statut !== "payée" && remaining > 0) || remaining > 0;
          })
          .sort((a, b) => {
            const da = getDateField(a as unknown, [
              "date_emission",
              "createdAt",
              "date",
            ])?.getTime();
            const db = getDateField(b as unknown, [
              "date_emission",
              "createdAt",
              "date",
            ])?.getTime();
            return (da || 0) - (db || 0);
          });
        const ids = candidateInvoices.map((i) => i.id).filter(Boolean);
        if (ids.length > 0) {
          apiPaymentData.facture_ids = ids;
        }
      }

      const createdPaymentResponse: { data?: { id?: string } } =
        await createPaymentMutation.mutateAsync({
          id:
            selectedInvoiceForPayment?.id ||
            selectedStudentForPayment?.id ||
            "",
          paymentData: apiPaymentData,
        });

      if (createdPaymentResponse.data.id) {
        // Après création, ne générer des factures que si le paiement n'est rattaché à AUCUNE facture
        const hasAnyLinkedInvoices = Array.isArray(
          (apiPaymentData as Record<string, unknown>)[
            "facture_ids"
          ] as unknown[],
        )
          ? (
              (apiPaymentData as Record<string, unknown>)[
                "facture_ids"
              ] as unknown[]
            ).length > 0
          : false;
        if (!hasAnyLinkedInvoices) {
          try {
            const sid = (paymentBase.student_id as string) || "";
            const stud = sid ? studentById[sid] : undefined;
            const parentId = stud
              ? getStringField(stud as unknown, [
                  "parent_id",
                  "parentId",
                  "tuteur_id",
                  "responsable_id",
                ]) ||
                (stud["parent"] && typeof stud["parent"] === "object"
                  ? getStringField(stud["parent"], ["id", "_id"]) || undefined
                  : undefined)
              : undefined;

            const payload = {
              student_id: sid,
              parent_id: parentId as string | undefined,
              montant_paye: paymentAmount,
              mode_paiement: paymentMethod,
              payment_id: createdPaymentResponse.data.id,
              qui_a_paye: String(paymentBase.qui_a_paye || user?.id || ""),
              enregistre_par: String(
                paymentBase.enregistre_par || user?.id || "",
              ),
            };

            await factureService.generateAfterPayment(payload);
            toast({
              title: "Factures générées",
              description:
                "Les factures ont été générées à partir du paiement enregistré.",
            });
          } catch (genErr) {
            toast({
              title: "Erreur génération facture",
              description:
                "Impossible de générer automatiquement les factures après le paiement.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      const errRec = (error ?? {}) as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      const status = errRec.response?.status;
      const backendMsg = errRec.response?.data?.message || errRec.message;
      toast({
        title: status ? `Erreur ${status}` : "Erreur",
        description:
          backendMsg ||
          "La requête de paiement a échoué. Veuillez vérifier les champs obligatoires.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
      setIsPaymentModalOpen(false);
      // reset modal state
      setSelectedInvoiceForPayment(null);
      setSelectedStudentForPayment(null);
      setPaymentAmount(0);
      // selectedPayer state removed
    }
  };

  const filteredInvoices = invoices.filter((invoice: Facture) => {
    const matchesSearch =
      invoice.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.etudiant_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Synthèse basée sur le backend
  // - totalAmount: somme des montants de toutes les factures
  // - paidAmount: somme des montants effectivement encaissés (paiements)
  // - pendingAmount: total facturé - encaissé (>= 0)
  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + (Number(invoice.montant_total) || 0),
    0,
  );
  const paidAmount = payments.reduce((sum, p) => {
    const n = getNumberField(p as unknown, [
      "montantPaye",
      "montant_paye",
      "amount",
      "montant",
    ]);
    return sum + (typeof n === "number" ? n : 0);
  }, 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  // Export CSVs (Factures et Paiements)
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toCsv = (rows: Array<Record<string, unknown>>, headers?: string[]) => {
    if (!rows.length) return "";
    const keys = headers && headers.length ? headers : Object.keys(rows[0]);
    const esc = (v: unknown) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const head = keys.join(",");
    const body = rows
      .map((r) =>
        keys.map((k) => esc((r as Record<string, unknown>)[k])).join(","),
      )
      .join("\n");
    return `${head}\n${body}`;
  };

  const handleExport = () => {
    // Factures CSV
    const factureRows = invoices.map((inv) => ({
      id: inv.id,
      numero: inv.numero || "",
      etudiant_id: inv.etudiant_id || "",
      statut: inv.statut || "",
      montant_total: inv.montant_total || 0,
      createdAt: (inv as unknown as Record<string, unknown>).createdAt || "",
    }));
    const facturesCsv = toCsv(factureRows, [
      "id",
      "numero",
      "etudiant_id",
      "statut",
      "montant_total",
      "createdAt",
    ]);
    downloadBlob(
      new Blob([facturesCsv], { type: "text/csv;charset=utf-8;" }),
      `export_factures_${new Date().toISOString().slice(0, 10)}.csv`,
    );

    // Paiements CSV
    const paiementRows = payments.map((p) => ({
      id: (p as unknown as Record<string, unknown>).id || "",
      etudiant_id: getStringField(p, ["etudiant_id", "student_id"]) || "",
      montant:
        getNumberField(p as unknown, [
          "montantPaye",
          "montant_paye",
          "amount",
          "montant",
        ]) || 0,
      methode:
        getStringField(p, ["mode", "methode", "mode_paiement", "method"]) || "",
      date:
        getDateField(p, [
          "date",
          "date_paiement",
          "payment_date",
          "createdAt",
        ])?.toISOString() || "",
    }));
    const paiementsCsv = toCsv(paiementRows, [
      "id",
      "etudiant_id",
      "montant",
      "methode",
      "date",
    ]);
    downloadBlob(
      new Blob([paiementsCsv], { type: "text/csv;charset=utf-8;" }),
      `export_paiements_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  // Filter payments based on search term and status
  const filteredPayments = payments.filter((payment: Paiement) => {
    const student =
      studentById[getStringField(payment, ["etudiant_id", "student_id"]) || ""];
    const studentName = student
      ? `${student.nom || ""} ${student.prenom || ""}`.trim()
      : "";

    const matchesSearch =
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStringField(payment, ["mode", "methode", "mode_paiement", "method"])
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getStringField(payment, ["status"])
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(getNumberField(payment, ["montantPaye", "montant_paye"])).includes(
        searchTerm,
      );

    const matchesStatus =
      statusFilter === "all" ||
      getStringField(payment, ["status"])?.toLowerCase() ===
        statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Filtres supplémentaires: date (de/à), montant (min/max), élève, méthode
  const paymentsFilteredForTable = useMemo(() => {
    const fromDate = paymentDateFrom
      ? new Date(paymentDateFrom + "T00:00:00")
      : undefined;
    const toDate = paymentDateTo
      ? new Date(paymentDateTo + "T23:59:59.999")
      : undefined;

    const list = filteredPayments.filter((p) => {
      // Date
      const d = getDateField(p, [
        "date",
        "date_paiement",
        "datePaiement",
        "payment_date",
        "paymentDate",
        "paidAt",
        "paid_at",
        "createdAt",
        "created_at",
        "timestamp",
        "time",
      ]);
      if (fromDate && (!d || d < fromDate)) return false;
      if (toDate && (!d || d > toDate)) return false;

      // Élève
      const sid =
        getStringField(p as unknown, ["etudiant_id", "student_id"]) || "";
      if (
        filterStudentId !== "all" &&
        filterStudentId &&
        sid !== filterStudentId
      )
        return false;

      // Méthode
      const method =
        getStringField(p as unknown, [
          "mode",
          "methode",
          "mode_paiement",
          "method",
        ]) || "";
      if (
        filterMethod !== "all" &&
        filterMethod &&
        method.toLowerCase() !== filterMethod.toLowerCase()
      )
        return false;

      return true;
    });

    // Tri par date décroissante
    list.sort((a, b) => {
      const da =
        getDateField(a, [
          "date",
          "date_paiement",
          "datePaiement",
          "payment_date",
          "paymentDate",
          "paidAt",
          "paid_at",
          "createdAt",
          "created_at",
          "timestamp",
          "time",
        ])?.getTime() || 0;
      const db =
        getDateField(b, [
          "date",
          "date_paiement",
          "datePaiement",
          "payment_date",
          "paymentDate",
          "paidAt",
          "paid_at",
          "createdAt",
          "created_at",
          "timestamp",
          "time",
        ])?.getTime() || 0;
      return db - da; // desc
    });

    return list;
  }, [
    filteredPayments,
    paymentDateFrom,
    paymentDateTo,
    filterStudentId,
    filterMethod,
  ]);

  // Pagination
  const totalPayments = paymentsFilteredForTable.length;
  const totalPages = Math.max(1, Math.ceil(totalPayments / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const visiblePayments = paymentsFilteredForTable.slice(startIdx, endIdx);

  // Réinitialiser la page lorsqu'un filtre change
  useEffect(() => {
    setPage(1);
  }, [
    paymentDateFrom,
    paymentDateTo,
    filterStudentId,
    filterMethod,
    statusFilter,
    searchTerm,
  ]);

  // Fournir au modal des détails une version « live » de l'étudiant sélectionné,
  // recalculée à partir de studentsWithPayment après tout refetch.
  const selectedStudentForDetailsLive: Student | null =
    selectedStudentForDetails
      ? (() => {
          const found = studentsWithPayment.find(
            (s: StudentWithPayment) => s.id === selectedStudentForDetails.id,
          );
          if (!found) return selectedStudentForDetails;
          const rec = found as unknown as Record<string, unknown>;
          const email =
            typeof rec.email === "string" ? (rec.email as string) : "";
          const telephone =
            typeof rec.telephone === "string"
              ? (rec.telephone as string)
              : undefined;
          const rawClasse =
            typeof rec.classe === "object" && rec.classe !== null
              ? (rec.classe as { nom?: string })
              : undefined;
          const classe =
            rawClasse && typeof rawClasse.nom === "string"
              ? ({ nom: rawClasse.nom } as { nom: string })
              : undefined;
          const status =
            typeof rec.status === "string" ? (rec.status as string) : undefined;
          const balance =
            typeof rec.balance === "number"
              ? (rec.balance as number)
              : undefined;
          const paymentStatus =
            typeof rec.paymentStatus === "object" && rec.paymentStatus !== null
              ? (rec.paymentStatus as Student["paymentStatus"])
              : undefined;
          return {
            id: (found as unknown as { id?: string }).id || "",
            nom: (found as unknown as { nom: string }).nom,
            prenom: (found as unknown as { prenom: string }).prenom,
            email,
            telephone,
            classe_id:
              (found as unknown as { classe_id?: string }).classe_id || "",
            classe,
            status,
            balance,
            paymentStatus,
          } as Student;
        })()
      : null;

  const filterSchema = z.object({
    paymentDateFrom: z.string().optional(),
    paymentDateTo: z.string().optional(),
    filterStudentId: z.string().optional(),
    filterMethod: z.string().optional(),
  });

  const filterForm = useForm<z.infer<typeof filterSchema>>({
    defaultValues: {
      paymentDateFrom: "",
      paymentDateTo: "",
      filterStudentId: "all",
      filterMethod: "all",
    },
  });

  useEffect(() => {
    filterForm.setValue("paymentDateFrom", paymentDateFrom);
  }, [paymentDateFrom, filterForm]);

  useEffect(() => {
    filterForm.setValue("paymentDateTo", paymentDateTo);
  }, [paymentDateTo, filterForm]);

  useEffect(() => {
    filterForm.setValue("filterStudentId", filterStudentId);
  }, [filterStudentId, filterForm]);

  useEffect(() => {
    filterForm.setValue("filterMethod", filterMethod);
  }, [filterMethod, filterForm]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            Gestion des Paiements
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Suivez les paiements et factures de vos étudiants
          </p>
        </div>
        {canManagePayments && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none"
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        )}
      </motion.div>

      {!user ? (
        <div className="text-red-600 font-bold p-4 bg-red-50/50 rounded-md border border-red-200">
          Vous n'êtes pas connecté. Veuillez vous authentifier.
        </div>
      ) : !canManagePayments && !isAdmin && !isComptable ? (
        <div className="text-red-600 font-bold p-4 bg-red-50/50 rounded-md border border-red-200">
          Accès refusé. Vous n'avez pas la permission nécessaire pour accéder à
          cette page.
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Facturé
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currencyFormatter.format(totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {filteredInvoices.length} factures
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Montant Encaissé
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {currencyFormatter.format(paidAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((paidAmount / totalAmount) * 100)}% du total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  En Attente
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {currencyFormatter.format(pendingAmount)}
                </div>
                <p className="text-xs text-muted-foreground">À encaisser</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter bar for payments and invoices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher paiements ou factures..."
                className="w-full pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="enregistré">Enregistré</SelectItem>
                <SelectItem value="pending">En Attente</SelectItem>
                <SelectItem value="annulé">Annulé</SelectItem>
                <SelectItem value="validé">Validé</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Liste des Paiements */}
          {canManagePayments && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Liste des Paiements</CardTitle>
                <CardDescription>
                  Tous les paiements enregistrés dans le système.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPayments ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : paymentsFilteredForTable.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun paiement trouvé.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Barre de filtres avancés */}
                    <Form {...filterForm}>
                      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <FormField
                          control={filterForm.control}
                          name="paymentDateFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Date de
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={filterForm.control}
                          name="paymentDateTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Date à
                              </FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={filterForm.control}
                          name="filterStudentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Etudiant
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tous les élèves" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all">Tous</SelectItem>
                                  {students.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                      {(s.nom || "") + " " + (s.prenom || "")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={filterForm.control}
                          name="filterMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                Méthode
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Toutes les méthodes" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all">Toutes</SelectItem>
                                  {availableMethods.map((m) => (
                                    <SelectItem key={m} value={m}>
                                      {m}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                    <div className="rounded-md border overflow-x-auto">
                      <Table className="min-w-full divide-y divide-border">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="hidden sm:table-cell h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              ID Étudiant
                            </TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              Nom
                            </TableHead>
                            <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                              Frais Net Dû
                            </TableHead>
                            <TableHead className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visiblePayments.map((payment) => {
                            const student =
                              studentById[
                                getStringField(payment, [
                                  "etudiant_id",
                                  "student_id",
                                ]) || ""
                              ];
                            const studentName = student
                              ? `${student.nom || ""} ${
                                  student.prenom || ""
                                }`.trim()
                              : "N/A";
                            const status = getStringField(payment, ["status"]);
                            const statusConfigEntry =
                              status &&
                              status in statusConfig &&
                              statusConfig[status as keyof typeof statusConfig];
                            const StatusIcon = statusConfigEntry?.icon;

                            return (
                              <TableRow
                                key={payment.id}
                                onClick={() => openPaymentDetails(payment)}
                                className="cursor-pointer border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                              >
                                <TableCell className="hidden sm:table-cell p-4 align-middle font-medium">
                                  <div className="font-mono text-sm">
                                    {student?.user_id || student?.id || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell className="p-4 align-middle">
                                  <div className="font-medium">
                                    {student
                                      ? `${student.prenom} ${student.nom}`
                                      : "Étudiant inconnu"}
                                  </div>
                                </TableCell>
                                <TableCell className="p-4 align-middle">
                                  <div className="font-semibold text-green-600">
                                    {currencyFormatter.format(
                                      student?.frais_payment || 0,
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="p-4 align-middle text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent row click from opening details again
                                      openPaymentDetails(payment);
                                    }}
                                    className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                    title="Détails"
                                  >
                                    <span className="hidden sm:inline">
                                      Détails
                                    </span>
                                    <FileText className="h-4 w-4 sm:hidden" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                      <div className="text-sm text-muted-foreground">
                        Affiche {totalPayments === 0 ? 0 : startIdx + 1}–
                        {Math.min(endIdx, totalPayments)} sur {totalPayments}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Précédent
                        </Button>
                        {/* Numéros de pages */}
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((num) => (
                            <Button
                              key={num}
                              variant={
                                num === currentPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setPage(num)}
                            >
                              {num}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Suivi des Paiements Étudiant (aligné sur StudentPaymentsAndInvoices) */}

          {/* Search and Filters */}

          {/* Modal de détails de paiement */}
          <Dialog
            open={isPaymentDetailOpen}
            onOpenChange={setIsPaymentDetailOpen}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Détails du Paiement</DialogTitle>
              </DialogHeader>

              {selectedPayment && (
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        Informations Générales
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            ID Paiement:
                          </span>
                          <span className="font-medium">
                            {selectedPayment.id || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Montant:
                          </span>
                          <span className="font-medium text-green-600">
                            {currencyFormatter.format(
                              getNumberField(selectedPayment, [
                                "montantPaye",
                                "montant_paye",
                                "amount",
                                "montant",
                              ]) || 0,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Méthode:
                          </span>
                          <span className="font-medium">
                            {getStringField(selectedPayment, [
                              "mode",
                              "methode",
                              "mode_paiement",
                              "method",
                            ]) || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <span className="font-medium">
                            {getStringField(selectedPayment, ["status"]) ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">
                            {getDateField(selectedPayment, [
                              "date",
                              "date_paiement",
                              "datePaiement",
                              "payment_date",
                              "paymentDate",
                              "paidAt",
                              "paid_at",
                              "createdAt",
                              "created_at",
                              "timestamp",
                              "time",
                            ])?.toLocaleString("fr-FR") || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informations étudiant */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        Informations Étudiant
                      </h3>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const studentId = getStringField(selectedPayment, [
                            "etudiant_id",
                            "student_id",
                          ]);
                          const student = studentId
                            ? studentById[studentId]
                            : undefined;
                          const studentName = student
                            ? `${student.nom || ""} ${student.prenom || ""}`.trim()
                            : "N/A";

                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Nom:
                                </span>
                                <span className="font-medium">
                                  {studentName}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  ID Étudiant:
                                </span>
                                <span className="font-medium">
                                  {studentId || "N/A"}
                                </span>
                              </div>
                              {student && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Classe:
                                    </span>
                                    <span className="font-medium">
                                      {getStringField(student, [
                                        "classe",
                                        "classe_nom",
                                      ]) || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Email:
                                    </span>
                                    <span className="font-medium">
                                      {getStringField(student, ["email"]) ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Informations de traçabilité */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Traçabilité</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Enregistré par:
                          </span>
                          <span className="font-medium">
                            {getStringField(selectedPayment, [
                              "enregistre_par",
                              "recordedBy_user_id",
                            ]) || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Qui a payé:
                          </span>
                          <span className="font-medium">
                            {getStringField(selectedPayment, [
                              "qui_a_paye",
                              "payer_user_id",
                            ]) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Date de création:
                          </span>
                          <span className="font-medium">
                            {getDateField(selectedPayment, [
                              "createdAt",
                              "created_at",
                              "timestamp",
                            ])?.toLocaleString("fr-FR") || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Dernière modification:
                          </span>
                          <span className="font-medium">
                            {getDateField(selectedPayment, [
                              "updatedAt",
                              "updated_at",
                            ])?.toLocaleString("fr-FR") || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Factures liées */}
                  {(() => {
                    const factureIds = selectedPayment.facture_ids || [];
                    const relatedInvoices = factureIds
                      .map((id) => invoiceById[id])
                      .filter(Boolean);

                    if (relatedInvoices.length > 0) {
                      return (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            Factures Liées
                          </h3>
                          <div className="space-y-2">
                            {relatedInvoices.map((invoice) => (
                              <div
                                key={invoice.id}
                                className="p-3 border rounded-lg bg-muted/50"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Numéro:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {invoice.numero || "N/A"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Montant:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {currencyFormatter.format(
                                        Number(invoice.montant_total) || 0,
                                      )}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Statut:
                                    </span>
                                    <span className="ml-2 font-medium">
                                      {invoice.statut || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Détails supplémentaires */}
                  {(() => {
                    const details = selectedPayment.details;
                    const description = getStringField(selectedPayment, [
                      "description",
                    ]);
                    const notes = getStringField(selectedPayment, ["notes"]);

                    if (details || description || notes) {
                      return (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">
                            Détails Supplémentaires
                          </h3>
                          <div className="space-y-2 text-sm">
                            {description && (
                              <div>
                                <span className="text-muted-foreground">
                                  Description:
                                </span>
                                <p className="mt-1 p-2 bg-muted/50 rounded">
                                  {description}
                                </p>
                              </div>
                            )}
                            {notes && (
                              <div>
                                <span className="text-muted-foreground">
                                  Notes:
                                </span>
                                <p className="mt-1 p-2 bg-muted/50 rounded">
                                  {notes}
                                </p>
                              </div>
                            )}
                            {details && typeof details === "object" && (
                              <div>
                                <span className="text-muted-foreground">
                                  Détails techniques:
                                </span>
                                <pre className="mt-1 p-2 bg-muted/50 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <DialogFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrintPaymentDetails}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentDetailOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
