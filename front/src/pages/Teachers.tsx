import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Search, Plus, Filter, Edit, Trash2, Eye, Mail, Phone } from "lucide-react"

const mockTeachers = [
  {
    id: 1,
    name: "Mme Marie Martin",
    email: "marie.martin@ynov.com",
    subject: "Mathématiques",
    classes: ["3ème A", "2nde B"],
    status: "Actif",
    phone: "06 12 34 56 78",
    experience: "8 ans"
  },
  {
    id: 2,
    name: "M. Jean Dubois",
    email: "jean.dubois@ynov.com", 
    subject: "Histoire-Géographie",
    classes: ["1ère S", "Terminale A"],
    status: "Actif",
    phone: "06 87 65 43 21",
    experience: "12 ans"
  },
  {
    id: 3,
    name: "Mme Sophie Laurent",
    email: "sophie.laurent@ynov.com",
    subject: "Anglais",
    classes: ["2nde A", "2nde B", "1ère S"],
    status: "Congé",
    phone: "06 98 76 54 32",
    experience: "5 ans"
  }
]

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTeachers = mockTeachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Enseignants</h1>
          <p className="text-muted-foreground">
            Gérez le corps enseignant de votre établissement
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un enseignant
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
            placeholder="Rechercher un enseignant..."
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

      {/* Teachers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6"
      >
        {filteredTeachers.map((teacher, index) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{teacher.name}</CardTitle>
                    <CardDescription>{teacher.subject}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={teacher.status === "Actif" ? "default" : "secondary"}
                      className={teacher.status === "Actif" ? "bg-success" : "bg-warning"}
                    >
                      {teacher.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{teacher.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Expérience:</span> {teacher.experience}
                      </p>
                      <div>
                        <span className="text-sm font-medium">Classes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.classes.map((classe) => (
                            <Badge key={classe} variant="outline" className="text-xs">
                              {classe}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
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

      {filteredTeachers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">Aucun enseignant trouvé</p>
        </motion.div>
      )}
    </div>
  )
}