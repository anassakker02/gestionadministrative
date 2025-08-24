import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Search, Plus, Filter, Download, CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react"

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
    invoice: "INV-2024-001"
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
    invoice: "INV-2024-002"
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
    invoice: "INV-2024-003"
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
    invoice: "INV-2024-004"
  }
]

const statusConfig = {
  "Payé": {
    variant: "default" as const,
    className: "bg-success text-success-foreground",
    icon: CheckCircle
  },
  "En retard": {
    variant: "destructive" as const,
    className: "bg-destructive text-destructive-foreground",
    icon: AlertCircle
  },
  "En attente": {
    variant: "secondary" as const,
    className: "bg-warning text-warning-foreground",
    icon: Clock
  }
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoice.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const paidAmount = filteredPayments.filter(p => p.status === "Payé").reduce((sum, payment) => sum + payment.amount, 0)
  const pendingAmount = totalAmount - paidAmount

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Paiements</h1>
          <p className="text-muted-foreground">
            Suivez les paiements et factures de vos étudiants
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Sur {filteredPayments.length} factures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Encaissé</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">€{paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((paidAmount / totalAmount) * 100)}% du total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">€{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              À encaisser
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un paiement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Payé">Payé</SelectItem>
            <SelectItem value="En retard">En retard</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Payments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid gap-6"
      >
        {filteredPayments.map((payment, index) => {
          const statusInfo = statusConfig[payment.status]
          const StatusIcon = statusInfo.icon
          
          return (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{payment.student}</CardTitle>
                      <CardDescription>{payment.class} • {payment.invoice}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusInfo.className}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {payment.status}
                      </Badge>
                      <div className="text-right">
                        <div className="text-xl font-bold">€{payment.amount}</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date d'échéance</p>
                      <p className="font-medium">{new Date(payment.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {payment.paymentDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date de paiement</p>
                        <p className="font-medium">{new Date(payment.paymentDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    )}
                    {payment.method && (
                      <div>
                        <p className="text-sm text-muted-foreground">Méthode</p>
                        <p className="font-medium">{payment.method}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      Voir facture
                    </Button>
                    {payment.status !== "Payé" && (
                      <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                        Enregistrer paiement
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredPayments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">Aucun paiement trouvé</p>
        </motion.div>
      )}
    </div>
  )
}