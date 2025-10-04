import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEtudiantById } from "../api/etudiantsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import StudentPaymentsAndInvoices from "@/components/StudentPaymentsAndInvoices";
import { useAuth } from "@/contexts/AuthContext";
import { getAllPaiements } from "../api/paiementsApi";
import type { Paiement } from "../api/paiementsApi";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Helpers: format currency and dates safely
const formatCurrencyMAD = (val: unknown) => {
  const num = typeof val === "number" ? val : Number(val);
  if (!isFinite(num)) return "N/A";
  try {
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toLocaleString()} MAD`;
  }
};

const formatDateSafe = (input: unknown) => {
  if (!input) return "N/A";
  
  // Gérer les objets Firestore avec _seconds
  if (typeof input === 'object' && input !== null && '_seconds' in input) {
    const firestoreDate = input as { _seconds: number };
    const dt = new Date(firestoreDate._seconds * 1000);
    return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleDateString("fr-FR");
  }
  
  // Gérer les chaînes de date
  if (typeof input === 'string') {
    // Essayer différents formats de date
    const formats = [
      input, // Format original
      input.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1'), // YYYY-MM-DD vers DD/MM/YYYY
      input.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2'), // DD/MM/YYYY vers YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const dt = new Date(format);
      if (!isNaN(dt.getTime())) {
        return dt.toLocaleDateString("fr-FR");
      }
    }
  }
  
  // Gérer les autres types
  const dt = new Date(input as string | number | Date);
  return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleDateString("fr-FR");
};

const StudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isSubAdmin } = useAuth();
  const navigate = useNavigate();
  const canViewStudentDetails = isAdmin || isSubAdmin;

  const {
    data: student,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["etudiant", id],
    queryFn: () =>
      id ? getEtudiantById(id) : Promise.reject(new Error("no-id")),
    enabled: !!id,
  });

  // Récupérer les paiements (hook TOUJOURS appelé, activé seulement si id présent)
  const { data: paymentsData } = useQuery({
    queryKey: ["paiements", id],
    queryFn: () =>
      id ? getAllPaiements(id) : Promise.reject(new Error("no-id")),
    enabled: !!id,
  });

  // Les informations du parent sont déjà incluses dans la réponse de l'étudiant
  // Pas besoin de requête séparée

  if (!user || (!canViewStudentDetails && user.id !== id)) {
    return (
      <div className="text-red-600 font-bold p-4">
        Accès refusé. Vous n'avez pas la permission nécessaire pour accéder à
        cette page.
      </div>
    );
  }

  if (isLoading) return <div>Chargement des détails de l'étudiant...</div>;
  if (error)
    return <div>Erreur lors du chargement des détails de l'étudiant</div>;
  if (!student && !isLoading) return <div>Étudiant non trouvé.</div>;

  const studentData = student.data; // Access the data property

  const payments = (paymentsData?.data ?? []) as Partial<Paiement>[];
  const totalPaid = payments.reduce((sum: number, p: Partial<Paiement>) => {
    const raw =
      (p.montantPaye as number | string | undefined) ??
      (p["montant_paye"] as number | string | undefined) ??
      0;
    const num = typeof raw === "number" ? raw : Number(raw);
    return sum + (isFinite(num) ? num : 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-foreground">
        Détails de l'Étudiant: {studentData.nom} {studentData.prenom}
      </h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Informations Générales</CardTitle>
          {(isAdmin || isSubAdmin) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/students/${id}/edit-info`)}
            >
              Modifier
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nom Complet
            </p>
            <p className="text-lg font-semibold">
              {studentData.nom} {studentData.prenom}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-lg">{studentData.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date de Naissance
            </p>
            <p className="text-lg">
              {formatDateSafe(studentData.date_naissance || studentData.dateNaissance || studentData.birth_date || studentData.birthDate)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nationalité
            </p>
            <p className="text-lg">{studentData.nationalite}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Classe</p>
            <p className="text-lg">
              {studentData.classe?.nom || studentData.classe_id || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Bourse</p>
            <p className="text-lg">
              {studentData.bourse?.nom || studentData.bourse_id || "N/A"}
            </p>
          </div>
          {/* Parent / Responsable */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Parent / Responsable
            </p>
            <div className="text-lg">
              {(() => {
                // Utiliser les informations du parent déjà incluses dans la réponse de l'étudiant
                if (studentData.parent) {
                  const p = studentData.parent as {
                    nom?: string;
                    prenom?: string;
                    email?: string;
                    telephone?: string;
                  };
                  return (
                    <div>
                      <p className="font-semibold">
                        {p.nom} {p.prenom}
                      </p>
                      <p className="text-sm">Email: {p.email || "N/A"}</p>
                      <p className="text-sm">
                        Téléphone: {p.telephone || "N/A"}
                      </p>
                    </div>
                  );
                }
                if (studentData.parents && studentData.parents.length > 0) {
                  const p = studentData.parents[0] as {
                    nom?: string;
                    prenom?: string;
                    email?: string;
                    telephone?: string;
                  };
                  return (
                    <div>
                      <p className="font-semibold">
                        {p.nom} {p.prenom}
                      </p>
                      <p className="text-sm">Email: {p.email || "N/A"}</p>
                      <p className="text-sm">
                        Téléphone: {p.telephone || "N/A"}
                      </p>
                    </div>
                  );
                }
                if (studentData.parent_id || studentData.parentId) {
                  return (
                    <p className="text-sm">
                      ID: {studentData.parent_id || studentData.parentId}
                    </p>
                  );
                }
                return <p className="text-sm">Aucun parent renseigné</p>;
              })()}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Frais à payer
            </p>
            <p className="text-lg">
              {formatCurrencyMAD(studentData.frais_payment)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Montant Payé
            </p>
            <p className="text-lg">{formatCurrencyMAD(totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Exonérations
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(studentData.exemptions) &&
              studentData.exemptions.length > 0 ? (
                (
                  studentData.exemptions as Array<{
                    type?: string;
                    value?: string | number;
                    reason?: string;
                  }>
                ).map((exemption) => (
                  <Badge
                    key={`${exemption.type}-${exemption.value}`}
                    variant="outline"
                  >
                    {exemption.type}: {exemption.value} ({exemption.reason})
                  </Badge>
                ))
              ) : (
                <p className="text-lg">Aucune</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau simple récapitulatif étudiant + total payé */}
      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif Étudiant</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Champ
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  Valeur
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Nom Complet
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {studentData.nom} {studentData.prenom}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Email
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {studentData.email || "N/A"}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Classe
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {studentData.classe?.nom || studentData.classe_id || "N/A"}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Frais à payer
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrencyMAD(studentData.frais_payment)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total payé
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrencyMAD(totalPaid)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      
    </motion.div>
  );
};

export default StudentDetails;
