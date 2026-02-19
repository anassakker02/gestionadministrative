import React, { useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Search,
  ArrowRight,
  Plus,
  Filter,
  FileText,
  Printer,
  BookOpen,
  Receipt,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { factureService } from "@/services/factureService";
import { Facture } from "@/types/facture";
import { studentService } from "@/services/studentService";
import { Student } from "@/types/student";
import {
  getAllPaiements,
  createPaiement,
  type Paiement,
} from "@/api/paiementsApi";
import { getFacturesByStudent } from "@/api/facturesApi";
import { getClasses, type Classe } from "@/api/classesApi";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentFeesOverview from "./StudentFeesOverview";

interface AggregatedStudent {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  classe_id?: string;
  classe?: {
    nom: string;
  };
  status?: string;
  balance?: number;

  paymentStatus?: {
    totalMontantDu: number;
    totalPaid: number;
    remainingAmount: number;
    paymentWarningStatus: string;
  };
  totalPaid: number;
  lastPaymentDate?: Date;
}

// Schéma de validation pour le paiement
const paymentSchema = z.object({
  etudiant: z.string().min(1, "L'étudiant est requis"),
  montant: z.number().min(1, "Le montant doit être supérieur à 0"),
  methode: z.string().min(1, "La méthode de paiement est requise"),
  reference: z.string().optional(),
  date: z.string().min(1, "La date de paiement est requise"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Helpers de parsing de dates (faible complexité)
function parsePrimitiveDate(val: unknown): Date | undefined {
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function parseFirestoreLikeDate(val: unknown): Date | undefined {
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
}

const PaymentDashboard: React.FC = () => {
  const { user, isAdmin, isComptable, isSubAdmin } = useAuth();
  const queryClient = useQueryClient();
  const canManagePayments = isAdmin || isComptable || isSubAdmin;
  const navigate = useNavigate();

  const [searchTermStudent, setSearchTermStudent] = useState<string>("");
  const studentsSectionRef = useRef<HTMLDivElement | null>(null);

  // États pour les modals et filtres
  const [selectedStudent, setSelectedStudent] =
    useState<AggregatedStudent | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [yearFilter, setYearFilter] = useState("2025");
  const [monthFilter, setMonthFilter] = useState("Tous les mois");
  const [activeTab, setActiveTab] = useState<"overview" | "payments">(
    "overview",
  );

  // Formulaire de paiement
  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      etudiant: "",
      montant: 0,
      methode: "",
      reference: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Récupérer les données des factures pour les statistiques
  const { data: facturesData } = useQuery({
    queryKey: ["factures-dashboard"],
    queryFn: factureService.getFactures,
    enabled: canManagePayments,
  });

  const factures = useMemo(() => facturesData?.data || [], [facturesData]);

  // Récupérer les paiements pour agrégation des montants payés
  const { data: paymentsResp } = useQuery({
    queryKey: ["payments-dashboard"],
    queryFn: () => getAllPaiements(),
    enabled: canManagePayments,
  });
  const payments: Paiement[] = useMemo(
    () => paymentsResp?.data || [],
    [paymentsResp],
  );

  // Charger les classes (pour filtre Classe)
  const { data: classesResp } = useQuery<
    Classe[] | { data: Classe[] } | undefined
  >({
    queryKey: ["classes", "dashboard"],
    queryFn: getClasses,
    enabled: canManagePayments,
  });
  const classesList: Classe[] = useMemo(() => {
    if (Array.isArray(classesResp)) return classesResp;
    const inner = (classesResp as { data?: Classe[] } | undefined)?.data;
    return Array.isArray(inner) ? inner : [];
  }, [classesResp]);
  const classNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of classesList) if (c?.id) m[String(c.id)] = String(c.nom);
    return m;
  }, [classesList]);

  // Récupérer les données des étudiants avec le statut de paiement
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students-payment-status"],
    queryFn: studentService.getAllStudents,
    enabled: canManagePayments,
  });

  const students: Student[] = useMemo(
    () => (studentsData?.data as Student[]) || [],
    [studentsData],
  );
  const studentById = useMemo(() => {
    const m: Record<string, Student> = {};
    for (const s of students) if (s?.id) m[String(s.id)] = s;
    return m;
  }, [students]);

  const getStringField = React.useCallback((obj: unknown, keys: string[]) => {
    if (typeof obj !== "object" || obj === null) return undefined;
    const rec = obj as Record<string, unknown>;
    for (const k of keys) {
      const v = rec[k];
      if (typeof v === "string") return v;
      if (typeof v === "number") return String(v);
    }
    return undefined;
  }, []);
  const getNumberField = React.useCallback(
    (obj: unknown, keys: string[]) => {
      const s = getStringField(obj, keys);
      if (s === undefined) return undefined;
      const n = Number(s);
      return Number.isNaN(n) ? undefined : n;
    },
    [getStringField],
  );

  const getDateField = React.useCallback((obj: unknown, keys: string[]) => {
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
  }, []);

  const getArrayStringField = React.useCallback(
    (obj: unknown, keys: string[]) => {
      if (typeof obj !== "object" || obj === null) return undefined;
      const rec = obj as Record<string, unknown>;
      for (const k of keys) {
        const v = rec[k];
        if (Array.isArray(v)) {
          const arr = (v as unknown[]).filter((x) => typeof x === "string");
          return arr as unknown as string[];
        }
      }
      return undefined;
    },
    [],
  );

  const filteredFactures: Facture[] = useMemo(() => factures, [factures]);
  const invoiceById = useMemo(() => {
    const idx: Record<string, Facture> = {} as Record<string, Facture>;
    for (const f of filteredFactures) {
      if (f?.id) idx[f.id] = f;
    }
    return idx;
  }, [filteredFactures]);

  const resolveStudentIdForPayment = React.useCallback(
    (p: Paiement): string | undefined => {
      let sid = getStringField(p, [
        "etudiant_id",
        "student_id",
        "etudiantId",
        "studentId",
      ]);
      if (!sid) {
        const singleF = getStringField(p, [
          "facture_id",
          "invoice_id",
          "factureId",
        ]);
        if (singleF && invoiceById[singleF])
          sid = invoiceById[singleF].etudiant_id;
      }
      if (!sid) {
        const ids = getArrayStringField(p, ["facture_ids", "invoice_ids"]);
        if (ids?.length) {
          for (const fid of ids) {
            if (invoiceById[fid]) {
              sid = invoiceById[fid].etudiant_id;
              break;
            }
          }
        }
      }
      return sid;
    },
    [invoiceById, getStringField, getArrayStringField],
  );

  const paymentsByStudent = useMemo(() => {
    const map: Record<string, Paiement[]> = {};
    for (const p of payments || []) {
      const sid = resolveStudentIdForPayment(p) || "unknown";
      if (!map[sid]) map[sid] = [];
      map[sid].push(p);
    }
    return map;
  }, [payments, resolveStudentIdForPayment]);

  // Requêtes pour l'étudiant sélectionné
  const selectedStudentPaymentsMemo = useMemo(() => {
    if (!selectedStudent?.id) return [] as Paiement[];
    return paymentsByStudent[selectedStudent.id] || [];
  }, [paymentsByStudent, selectedStudent?.id]);

  const studentPaymentsTotal = useMemo(() => {
    const map: Record<string, { totalPaid: number; lastPaymentDate?: Date }> =
      {};
    for (const p of payments) {
      const sid = resolveStudentIdForPayment(p);
      if (sid) {
        const amount =
          getNumberField(p, [
            "montantPaye",
            "montant_paye",
            "amount",
            "montant",
          ]) || 0;
        const payDate = getDateField(p, [
          "date",
          "date_paiement",
          "payment_date",
        ]);
        if (!map[sid]) {
          map[sid] = { totalPaid: 0 };
        }
        map[sid].totalPaid += amount;
        if (
          payDate &&
          (!map[sid].lastPaymentDate || payDate > map[sid].lastPaymentDate!)
        ) {
          map[sid].lastPaymentDate = payDate;
        }
      }
    }
    return map;
  }, [payments, resolveStudentIdForPayment, getNumberField, getDateField]);

  const studentsAggregated = useMemo<AggregatedStudent[]>(() => {
    return students.map((s) => ({
      ...s,
      totalPaid: studentPaymentsTotal[s.id]?.totalPaid || 0,
      lastPaymentDate: studentPaymentsTotal[s.id]?.lastPaymentDate,
    }));
  }, [students, studentPaymentsTotal]);

  const filteredStudentsForTable = useMemo<AggregatedStudent[]>(() => {
    if (!searchTermStudent) return studentsAggregated;
    const searchTermLower = searchTermStudent.toLowerCase();
    return studentsAggregated.filter((student) => {
      const fullName = `${student.nom} ${student.prenom}`.toLowerCase();
      const studentId = student.id.toLowerCase();
      return (
        fullName.includes(searchTermLower) ||
        studentId.includes(searchTermLower)
      );
    });
  }, [studentsAggregated, searchTermStudent]);

  const handleViewDetails = (student: AggregatedStudent) => {
    navigate(`/students/${student.id}/payments`);
  };

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    if (!selectedStudent) return;

    try {
      const paymentData: Paiement = {
        etudiant_id: selectedStudent.id,
        student_id: selectedStudent.id,
        montantPaye: data.montant,
        methode: data.methode,
        mode: data.methode,
        reference: data.reference,
        date: data.date,
        status: "Confirmé",
        notes: data.notes,
        qui_a_paye: `${selectedStudent.prenom} ${selectedStudent.nom}`,
        enregistre_par: user ? `${user.prenom} ${user.nom}` : undefined,
        recordedBy_user_id: user?.id,
        facture_ids: [],
        description: "Paiement scolarité",
      };

      await createPaiement(paymentData);

      toast({
        title: "Paiement créé",
        description: "Le paiement a été enregistré avec succès.",
      });

      setIsPaymentDialogOpen(false);
      paymentForm.reset();
      queryClient.invalidateQueries({ queryKey: ["payments-dashboard"] });
      if (selectedStudent?.id) {
        queryClient.invalidateQueries({
          queryKey: ["payments", selectedStudent.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["invoices", selectedStudent.id],
        });
      }
    } catch (error) {
      console.error("Erreur création paiement:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du paiement.",
        variant: "destructive",
      });
    }
  };

  const handleInvoiceClick = async (payment: any) => {
    try {
      const invoiceData = {
        numero_facture: `#${Math.random().toString(36).substr(2, 9)}`,
        etudiant_id: selectedStudent?.id,
        montant_total: payment.montantPaye,
        montantPaye: payment.montantPaye,
        montantRestant: 0,
        statut: "payée",
        date_creation: new Date().toISOString(),
        date_echeance: new Date().toISOString(),
        description: payment.description || "Frais de scolarité",
        currency: "EUR",
        student: selectedStudent,
        payment: payment,
        enregistre_par: payment.enregistre_par,
      };

      setCurrentInvoice(invoiceData);
      setIsInvoiceDialogOpen(true);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération de la facture.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatMoney = React.useCallback((n?: number) => {
    const v = Number(n || 0);
    return `${v.toLocaleString()} MAD`;
  }, []);

  const formatCurrencyEUR = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Données pour l'étudiant sélectionné
  const selectedStudentPaymentsData = selectedStudentPaymentsMemo;
  const selectedStudentInvoicesData = useMemo(() => {
    if (!selectedStudent?.id) return [] as Facture[];
    return factures.filter(
      (facture: Facture) => facture.etudiant_id === selectedStudent.id,
    );
  }, [factures, selectedStudent?.id]);

  // Calculer le total des paiements pour l'année
  const totalPaid = useMemo(() => {
    return selectedStudentPaymentsData
      .filter((p) => {
        const paymentDate = new Date(p.date || p.createdAt || "");
        return paymentDate.getFullYear().toString() === yearFilter;
      })
      .reduce((sum, p) => sum + (p.montantPaye || 0), 0);
  }, [selectedStudentPaymentsData, yearFilter]);

  // Paiements filtrés par année et mois
  const filteredPayments = useMemo(() => {
    return selectedStudentPaymentsData.filter((p) => {
      const paymentDate = new Date(p.date || p.createdAt || "");
      const paymentYear = paymentDate.getFullYear().toString();
      const paymentMonth = paymentDate.getMonth() + 1;

      const yearMatch =
        yearFilter === "Toutes les années" || paymentYear === yearFilter;
      const monthMatch =
        monthFilter === "Tous les mois" ||
        (monthFilter === "Janvier" && paymentMonth === 1) ||
        (monthFilter === "Février" && paymentMonth === 2) ||
        (monthFilter === "Mars" && paymentMonth === 3) ||
        (monthFilter === "Avril" && paymentMonth === 4) ||
        (monthFilter === "Mai" && paymentMonth === 5) ||
        (monthFilter === "Juin" && paymentMonth === 6) ||
        (monthFilter === "Juillet" && paymentMonth === 7) ||
        (monthFilter === "Août" && paymentMonth === 8) ||
        (monthFilter === "Septembre" && paymentMonth === 9) ||
        (monthFilter === "Octobre" && paymentMonth === 10) ||
        (monthFilter === "Novembre" && paymentMonth === 11) ||
        (monthFilter === "Décembre" && paymentMonth === 12);

      return yearMatch && monthMatch;
    });
  }, [selectedStudentPaymentsData, yearFilter, monthFilter]);

  // Années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    selectedStudentPaymentsData.forEach((p) => {
      const paymentDate = new Date(p.date || p.createdAt || "");
      years.add(paymentDate.getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [selectedStudentPaymentsData]);

  const stats = useMemo(() => {
    const totalCollected = payments.reduce(
      (sum: number, p: Paiement) =>
        sum +
        (getNumberField(p, [
          "montantPaye",
          "montant_paye",
          "amount",
          "montant",
        ]) || 0),
      0,
    );

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const paymentsThisMonth = payments
      .filter((p) => {
        const payDate = getDateField(p, [
          "date",
          "date_paiement",
          "payment_date",
        ]);
        return (
          payDate &&
          payDate.getMonth() === currentMonth &&
          payDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => {
        const n = getNumberField(p, [
          "montantPaye",
          "montant_paye",
          "amount",
          "montant",
        ]);
        return sum + (typeof n === "number" ? n : 0);
      }, 0);

    const studentsOverdueCount = studentsAggregated.filter((student) => {
      // Logic to determine if a student has overdue payments
      // For simplicity, we'll assume a student is overdue if they have a balance
      // You'll need to define `student.paymentStatus?.totalMontantDu` or similar if you have invoice data for comparison
      return student.totalPaid < (student.paymentStatus?.totalMontantDu || 0);
    }).length;

    return {
      totalStudents: students.length,
      totalCollected,
      paymentsThisMonth,
      studentsOverdue: studentsOverdueCount,
    };
  }, [payments, students, studentsAggregated, getNumberField, getDateField]);

  if (!canManagePayments) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">
              Accès refusé. Vous n'avez pas la permission d'accéder au tableau
              de bord des paiements.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Tableau de Bord
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Vue d'ensemble des frais scolaires -{" "}
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Onglets */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "overview" | "payments")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Frais Scolaires
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Paiements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StudentFeesOverview />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 justify-center">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Étudiants
                </CardTitle>
                <Users className="h-4 w-4 text-blue-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-blue-100">
                  {/* Placeholder for change, integrate real data if available */}
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Revenus Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(stats.totalCollected)}
                </div>
                <p className="text-xs text-green-100">
                  {/* Placeholder for change, integrate real data if available */}
                  +18.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Étudiants en Retard
                </CardTitle>
                <Calendar className="h-4 w-4 text-red-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.studentsOverdue}
                </div>
                <p className="text-xs text-red-100">
                  {/* Placeholder for change, integrate real data if available */}
                  -1.2% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments Section */}
          {/* <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Paiements Récents</CardTitle>
          <CardDescription>
            Les 5 derniers paiements effectués.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment, index) => {
              const student = studentById[resolveStudentIdForPayment(payment) || ""];
              const amount = getNumberField(payment, ["montantPaye", "montant_paye", "amount", "montant"]) || 0;
              const payDate = getDateField(payment, ["date", "date_paiement", "payment_date"]);
              const description = student ? `${student.nom} ${student.prenom}` : "Paiement Inconnu";

              return (
                <div key={index} className="flex items-center">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-muted">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payDate ? payDate.toLocaleDateString('fr-FR') : "N/A"}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    {formatMoney(amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card> */}

          {/* Section de détails des paiements */}
          {canManagePayments && (
            <div className="mt-6 space-y-6">
              {/* Liste des Étudiants */}
              <Card ref={studentsSectionRef}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Liste des Étudiants</CardTitle>
                  <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou numéro..."
                      className="w-full pl-9"
                      value={searchTermStudent}
                      onChange={(e) => setSearchTermStudent(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px] hidden sm:table-cell">
                            N° Étudiant
                          </TableHead>
                          <TableHead>Nom Complet</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Classe
                          </TableHead>
                          <TableHead className="text-right">
                            Total Payé
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingStudents ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              Chargement des étudiants...
                            </TableCell>
                          </TableRow>
                        ) : filteredStudentsForTable.length > 0 ? (
                          filteredStudentsForTable.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium hidden sm:table-cell">
                                {student.id}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{`${student.nom} ${student.prenom}`}</div>
                                <div className="text-xs text-muted-foreground md:hidden">
                                  {classNameById[
                                    String(student.classe_id || "")
                                  ] || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {classNameById[
                                  String(student.classe_id || "")
                                ] || "N/A"}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                {formatMoney(student.totalPaid)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDetails(student)}
                                    className="text-primary hover:text-primary-foreground h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
                                    title="Voir Paiements"
                                  >
                                    <span className="hidden sm:inline">
                                      Voir Paiements
                                    </span>
                                    <ArrowRight className="h-4 w-4 sm:ml-2" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              Aucun étudiant trouvé.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Détails des paiements de l'étudiant sélectionné */}
              {selectedStudent && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(null)}
                        >
                          ← Retour
                        </Button>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedStudent.prenom} {selectedStudent.nom}
                          </CardTitle>
                          <CardDescription>
                            {classNameById[
                              String(selectedStudent.classe_id || "")
                            ] || "N/A"}{" "}
                            • {selectedStudent.email}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setIsPaymentDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter Paiement
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Facture Annuelle Globale */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Facture Annuelle Globale
                        </h3>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <Select
                            value={yearFilter}
                            onValueChange={setYearFilter}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Toutes les années">
                                Toutes les années
                              </SelectItem>
                              {availableYears.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          Total payé pour l'année {yearFilter}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrencyEUR(totalPaid)}
                        </span>
                      </div>
                    </div>

                    {/* Historique des Paiements Individuels */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold">
                            Historique des Paiements Individuels
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <Select
                            value={monthFilter}
                            onValueChange={setMonthFilter}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Tous les mois">
                                Tous les mois
                              </SelectItem>
                              <SelectItem value="Janvier">Janvier</SelectItem>
                              <SelectItem value="Février">Février</SelectItem>
                              <SelectItem value="Mars">Mars</SelectItem>
                              <SelectItem value="Avril">Avril</SelectItem>
                              <SelectItem value="Mai">Mai</SelectItem>
                              <SelectItem value="Juin">Juin</SelectItem>
                              <SelectItem value="Juillet">Juillet</SelectItem>
                              <SelectItem value="Août">Août</SelectItem>
                              <SelectItem value="Septembre">
                                Septembre
                              </SelectItem>
                              <SelectItem value="Octobre">Octobre</SelectItem>
                              <SelectItem value="Novembre">Novembre</SelectItem>
                              <SelectItem value="Décembre">Décembre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Méthode</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPayments.length > 0 ? (
                              filteredPayments.map((payment, index) => (
                                <TableRow key={payment.id || index}>
                                  <TableCell>
                                    {formatDate(
                                      payment.date || payment.createdAt || "",
                                    )}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {formatMoney(payment.montantPaye || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {payment.methode || payment.mode || "N/A"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleInvoiceClick(payment)
                                      }
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Facture
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="h-24 text-center text-gray-500"
                                >
                                  Aucun paiement trouvé pour les critères
                                  sélectionnés.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Modal de création de paiement */}
          <Dialog
            open={isPaymentDialogOpen}
            onOpenChange={(open) => {
              setIsPaymentDialogOpen(open);
              if (open && selectedStudent) {
                paymentForm.reset({
                  etudiant: `${selectedStudent.prenom} ${selectedStudent.nom}`,
                  montant: 0,
                  methode: "",
                  reference: "",
                  date: new Date().toISOString().split("T")[0],
                  notes: "",
                });
              }
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau paiement</DialogTitle>
                <DialogDescription>
                  Enregistrer un nouveau paiement pour l'étudiant sélectionné.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="etudiant">Étudiant</Label>
                    <Input
                      id="etudiant"
                      {...paymentForm.register("etudiant")}
                      disabled
                      className="bg-gray-50"
                    />
                    {paymentForm.formState.errors.etudiant && (
                      <p className="text-sm text-red-500">
                        {paymentForm.formState.errors.etudiant.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="montant">Montant (MAD)</Label>
                    <Input
                      id="montant"
                      type="number"
                      step="0.01"
                      {...paymentForm.register("montant", {
                        valueAsNumber: true,
                      })}
                    />
                    {paymentForm.formState.errors.montant && (
                      <p className="text-sm text-red-500">
                        {paymentForm.formState.errors.montant.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="methode">Méthode de paiement</Label>
                    <Select
                      onValueChange={(value) =>
                        paymentForm.setValue("methode", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                        <SelectItem value="Virement">Virement</SelectItem>
                        <SelectItem value="Carte bancaire">
                          Carte bancaire
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentForm.formState.errors.methode && (
                      <p className="text-sm text-red-500">
                        {paymentForm.formState.errors.methode.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      {...paymentForm.register("reference")}
                      placeholder="Référence du paiement"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date de paiement</Label>
                    <Input
                      id="date"
                      type="date"
                      {...paymentForm.register("date")}
                    />
                    {paymentForm.formState.errors.date && (
                      <p className="text-sm text-red-500">
                        {paymentForm.formState.errors.date.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Enregistré par</Label>
                    <Input
                      value={user ? `${user.prenom} ${user.nom}` : ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    {...paymentForm.register("notes")}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPaymentDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Enregistrer le paiement
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal de facture */}
          <Dialog
            open={isInvoiceDialogOpen}
            onOpenChange={setIsInvoiceDialogOpen}
          >
            <DialogContent className="max-w-4xl h-[90vh]">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>
                    Facture {currentInvoice?.numero_facture}
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsInvoiceDialogOpen(false)}
                  >
                    ×
                  </Button>
                </div>
              </DialogHeader>

              {currentInvoice && (
                <div className="space-y-6 overflow-y-auto">
                  {/* En-tête de la facture */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-lg font-semibold">
                          Facture Payée
                        </span>
                      </div>
                      <p className="text-gray-600">
                        Facture #{currentInvoice.numero_facture}
                      </p>
                      <p className="text-gray-600">
                        Date: {formatDate(currentInvoice.date_creation)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrencyEUR(currentInvoice.montant_total)}
                      </p>
                      <Badge className="bg-green-100 text-green-800">
                        {currentInvoice.statut}
                      </Badge>
                    </div>
                  </div>

                  {/* Informations de l'étudiant */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      Informations de l'étudiant
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nom complet</p>
                        <p className="font-medium">
                          {currentInvoice.student?.prenom}{" "}
                          {currentInvoice.student?.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">
                          {currentInvoice.student?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Classe</p>
                        <p className="font-medium">
                          {classNameById[
                            String(currentInvoice.student?.classe_id || "")
                          ] || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Téléphone</p>
                        <p className="font-medium">
                          {currentInvoice.student?.telephone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Détails du paiement */}
                  <div>
                    <h3 className="font-semibold mb-3">Détails du paiement</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Date de paiement</TableHead>
                            <TableHead>Méthode</TableHead>
                            <TableHead className="text-right">
                              Montant
                            </TableHead>
                            <TableHead className="text-right">
                              Enregistré par
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>{currentInvoice.description}</TableCell>
                            <TableCell>
                              {formatDate(
                                currentInvoice.payment?.date ||
                                  currentInvoice.payment?.createdAt ||
                                  "",
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {currentInvoice.payment?.methode ||
                                  currentInvoice.payment?.mode ||
                                  "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrencyEUR(currentInvoice.montant_total)}
                            </TableCell>
                            <TableCell className="text-right">
                              {currentInvoice.payment?.enregistre_par || "—"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Résumé */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total payé</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrencyEUR(currentInvoice.montant_total)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Montant restant</span>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrencyEUR(currentInvoice.montantRestant)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button onClick={() => setIsInvoiceDialogOpen(false)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentDashboard;
