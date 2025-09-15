import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Plus, Users, BookOpen, Calendar } from "lucide-react"
import { useQuery } from "@tanstack/react-query";
import { getClasses } from "../api/classesApi";
import CreateClassModal from "@/components/CreateClassModal";
import { useState } from "react";

export default function Classes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });

  if (isLoading) {
    return <div>Chargement des classes...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement des classes: {error.message}</div>;
  }

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
        <Button className="bg-gradient-primary hover:opacity-90 shadow-glow" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une classe
        </Button>
      </motion.div>

      <CreateClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {classes?.map((classe, index) => (
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
                    <CardTitle className="text-xl">{classe.nom}</CardTitle>
                    <CardDescription>{classe.niveau}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    {classe.nombreEtudiants}/{classe.capacite}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{classe.description}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Année Scolaire: {classe.annee_scolaire}</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all"
                      style={{ width: `${(classe.nombreEtudiants / classe.capacite) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {classe.nombreEtudiants} étudiants sur {classe.capacite}
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