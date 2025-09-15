import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Plus, BookOpen, Users, Clock } from "lucide-react"

const mockSubjects = [
  {
    id: 1,
    name: "Mathématiques",
    code: "MATH",
    level: "Collège/Lycée",
    teachers: 3,
    classes: 8,
    hoursPerWeek: 4,
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Histoire-Géographie",
    code: "HIST",
    level: "Collège/Lycée", 
    teachers: 2,
    classes: 6,
    hoursPerWeek: 3,
    color: "bg-green-500"
  },
  {
    id: 3,
    name: "Anglais",
    code: "ANG",
    level: "Collège/Lycée",
    teachers: 4,
    classes: 10,
    hoursPerWeek: 3,
    color: "bg-purple-500"
  },
  {
    id: 4,
    name: "Sciences Physiques",
    code: "PHY",
    level: "Lycée",
    teachers: 2,
    classes: 4,
    hoursPerWeek: 3,
    color: "bg-orange-500"
  },
  {
    id: 5,
    name: "Français",
    code: "FR",
    level: "Collège/Lycée",
    teachers: 3,
    classes: 8,
    hoursPerWeek: 4,
    color: "bg-red-500"
  },
  {
    id: 6,
    name: "Éducation Physique",
    code: "EPS",
    level: "Collège/Lycée",
    teachers: 2,
    classes: 12,
    hoursPerWeek: 2,
    color: "bg-yellow-500"
  }
]

export default function Subjects() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Matières</h1>
          <p className="text-muted-foreground">
            Organisez le programme pédagogique de votre établissement
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une matière
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {mockSubjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="hover:shadow-lg transition-all hover:scale-105">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                    <div>
                      <CardTitle className="text-xl">{subject.name}</CardTitle>
                      <CardDescription>Code: {subject.code}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    {subject.level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{subject.teachers}</p>
                    <p className="text-xs text-muted-foreground">Enseignants</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{subject.classes}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{subject.hoursPerWeek}h</p>
                    <p className="text-xs text-muted-foreground">Par semaine</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Voir planning
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}