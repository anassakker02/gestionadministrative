import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Calendar, Clock, Plus, Filter } from "lucide-react"

const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00", 
  "10:00 - 11:00",
  "11:15 - 12:15",
  "12:15 - 13:15",
  "13:15 - 14:15",
  "14:15 - 15:15",
  "15:30 - 16:30",
  "16:30 - 17:30"
]

const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]

const mockSchedule = {
  "Lundi": {
    "08:00 - 09:00": { subject: "Mathématiques", class: "3ème A", teacher: "Mme Martin", room: "Salle 204" },
    "09:00 - 10:00": { subject: "Français", class: "2nde B", teacher: "M. Dupont", room: "Salle 105" },
    "10:00 - 11:00": { subject: "Anglais", class: "1ère S", teacher: "Mme Laurent", room: "Salle 301" },
    "14:15 - 15:15": { subject: "Histoire", class: "3ème A", teacher: "M. Dubois", room: "Salle 202" }
  },
  "Mardi": {
    "08:00 - 09:00": { subject: "Sciences", class: "2nde B", teacher: "M. Bernard", room: "Lab 1" },
    "09:00 - 10:00": { subject: "Mathématiques", class: "1ère S", teacher: "Mme Martin", room: "Salle 204" },
    "11:15 - 12:15": { subject: "EPS", class: "3ème A", teacher: "M. Moreau", room: "Gymnase" }
  },
  "Mercredi": {
    "08:00 - 09:00": { subject: "Anglais", class: "2nde B", teacher: "Mme Laurent", room: "Salle 301" },
    "09:00 - 10:00": { subject: "Français", class: "3ème A", teacher: "M. Dupont", room: "Salle 105" }
  },
  "Jeudi": {
    "08:00 - 09:00": { subject: "Histoire", class: "1ère S", teacher: "M. Dubois", room: "Salle 202" },
    "10:00 - 11:00": { subject: "Sciences", class: "3ème A", teacher: "M. Bernard", room: "Lab 1" },
    "14:15 - 15:15": { subject: "Mathématiques", class: "2nde B", teacher: "Mme Martin", room: "Salle 204" }
  },
  "Vendredi": {
    "09:00 - 10:00": { subject: "EPS", class: "2nde B", teacher: "M. Moreau", room: "Gymnase" },
    "11:15 - 12:15": { subject: "Anglais", class: "3ème A", teacher: "Mme Laurent", room: "Salle 301" },
    "15:30 - 16:30": { subject: "Français", class: "1ère S", teacher: "M. Dupont", room: "Salle 105" }
  }
}

const subjectColors = {
  "Mathématiques": "bg-blue-100 text-blue-800 border-blue-200",
  "Français": "bg-red-100 text-red-800 border-red-200",
  "Anglais": "bg-purple-100 text-purple-800 border-purple-200",
  "Histoire": "bg-green-100 text-green-800 border-green-200",
  "Sciences": "bg-orange-100 text-orange-800 border-orange-200",
  "EPS": "bg-yellow-100 text-yellow-800 border-yellow-200"
}

export default function Schedule() {
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedTeacher, setSelectedTeacher] = useState("all")

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Emploi du Temps</h1>
          <p className="text-muted-foreground">
            Planifiez et organisez les cours de votre établissement
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un cours
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-4 items-center"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres:</span>
        </div>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sélectionner une classe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les classes</SelectItem>
            <SelectItem value="3ème A">3ème A</SelectItem>
            <SelectItem value="2nde B">2nde B</SelectItem>
            <SelectItem value="1ère S">1ère S</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sélectionner un enseignant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les enseignants</SelectItem>
            <SelectItem value="Mme Martin">Mme Martin</SelectItem>
            <SelectItem value="M. Dubois">M. Dubois</SelectItem>
            <SelectItem value="Mme Laurent">Mme Laurent</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Schedule Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning Hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                {/* Header */}
                <div className="p-3 font-medium text-center border-b">
                  <Clock className="h-4 w-4 mx-auto mb-1" />
                  Horaires
                </div>
                {daysOfWeek.map((day) => (
                  <div key={day} className="p-3 font-medium text-center border-b">
                    {day}
                  </div>
                ))}

                {/* Time slots and courses */}
                {timeSlots.map((timeSlot) => (
                  <>
                    <div key={timeSlot} className="p-3 text-sm text-center bg-muted/50 font-medium">
                      {timeSlot}
                    </div>
                    {daysOfWeek.map((day) => {
                      const course = mockSchedule[day]?.[timeSlot]
                      return (
                        <div key={`${day}-${timeSlot}`} className="p-2 min-h-[80px] border border-border">
                          {course && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className={`p-2 rounded-md border ${subjectColors[course.subject] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                            >
                              <div className="font-medium text-xs mb-1">{course.subject}</div>
                              <div className="text-xs mb-1">{course.class}</div>
                              <div className="text-xs text-muted-foreground">{course.teacher}</div>
                              <div className="text-xs text-muted-foreground">{course.room}</div>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Légende des matières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(subjectColors).map(([subject, colorClass]) => (
                <Badge
                  key={subject}
                  variant="outline"
                  className={colorClass}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}