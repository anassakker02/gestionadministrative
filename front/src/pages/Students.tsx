import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Search, Plus, Filter, Edit, Trash2, Eye } from "lucide-react"

const mockStudents = [
  {
    id: 1,
    name: "Marie Dubois",
    email: "marie.dubois@email.com",
    class: "3ème A",
    status: "Actif",
    balance: "0€",
    phone: "06 12 34 56 78"
  },
  {
    id: 2,
    name: "Jean Martin",
    email: "jean.martin@email.com", 
    class: "2nde B",
    status: "Actif",
    balance: "-150€",
    phone: "06 87 65 43 21"
  },
  {
    id: 3,
    name: "Sophie Laurent",
    email: "sophie.laurent@email.com",
    class: "1ère S",
    status: "Inactif",
    balance: "+50€",
    phone: "06 98 76 54 32"
  }
]

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Étudiants</h1>
          <p className="text-muted-foreground">
            Gérez les informations de vos étudiants
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un étudiant
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
        </Button>
      </motion.div>

      {/* Students List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6"
      >
        {filteredStudents.map((student, index) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{student.name}</CardTitle>
                    <CardDescription>{student.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={student.status === "Actif" ? "default" : "secondary"}
                      className={student.status === "Actif" ? "bg-success" : ""}
                    >
                      {student.status}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={
                        student.balance.includes("-") 
                          ? "border-destructive text-destructive"
                          : student.balance.includes("+")
                          ? "border-success text-success"
                          : ""
                      }
                    >
                      {student.balance}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Classe:</span> {student.class}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Téléphone:</span> {student.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredStudents.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">Aucun étudiant trouvé</p>
        </motion.div>
      )}
    </div>
  )
}