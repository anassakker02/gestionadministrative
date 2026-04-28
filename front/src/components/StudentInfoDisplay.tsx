import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Mail, Phone } from "lucide-react";

interface StudentInfoDisplayProps {
  student: {
    user_id?: string;
    id?: string;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string;
    classe_id?: string;
  };
  title?: string;
}

export const StudentInfoDisplay: React.FC<StudentInfoDisplayProps> = ({
  student,
  title = "Informations de l'étudiant"
}) => {
  const studentId = student.user_id || student.id;
  
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-semibold text-blue-900">
              {student.prenom} {student.nom}
            </div>
            <Badge variant="outline" className="text-xs mt-1">
              N° {studentId}
            </Badge>
          </div>
        </div>
        
        {student.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">{student.email}</span>
          </div>
        )}
        
        {student.telephone && (
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">{student.telephone}</span>
          </div>
        )}
        
        {student.classe_id && (
          <div className="flex items-center gap-3">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            <Badge variant="secondary" className="text-xs">
              Classe: {student.classe_id}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentInfoDisplay;
