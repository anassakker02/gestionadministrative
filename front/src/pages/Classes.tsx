import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Plus, Users, BookOpen, Calendar } from "lucide-react"

const mockClasses = [
  {
    id: 1,
    name: "3ème A",
    level: "Collège",
    students: 28,
    capacity: 30,
    teacher: "Mme Martin",
    room: "Salle 204",
    schedule: "8h-17h"
  },
  {
    id: 2,
    name: "2nde B",
    level: "Lycée",
    students: 32,
    capacity: 35,
    teacher: "M. Dubois",
    room: "Salle 105",
    schedule: "8h-17h"
  },
  {
    id: 3,
    name: "1ère S",
    level: "Lycée",
    students: 25,
    capacity: 30,
    teacher: "Mme Laurent",
    room: "Salle 301",
    schedule: "8h-17h"
  }
]

export default function Classes() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Classes</h1>
          <p className="text-muted-foreground">
            Organisez et gérez vos classes scolaires
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Créer une classe
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {mockClasses.map((classe, index) => (
          <motion.div
            key={classe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-lg transition-all hover:scale-105">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{classe.name}</CardTitle>
                    <CardDescription>{classe.level}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    {classe.students}/{classe.capacity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{classe.teacher}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{classe.room}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{classe.schedule}</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all"
                      style={{ width: `${(classe.students / classe.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {classe.students} étudiants sur {classe.capacity}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}