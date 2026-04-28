import React from "react";
import { useStudentInfo } from "@/hooks/useStudentInfo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentNameDisplayProps {
  studentId: string;
  showId?: boolean;
  showClass?: boolean;
  className?: string;
  compact?: boolean; // Mode compact pour les listes
}

export const StudentNameDisplay: React.FC<StudentNameDisplayProps> = ({
  studentId,
  showId = false,
  showClass = false,
  className = "",
  compact = false,
}) => {
  const { data: student, isLoading, error } = useStudentInfo(studentId);

  if (isLoading) {
    return (
      <div className={`space-y-1 ${className}`}>
        <Skeleton className="h-4 w-32" />
        {showId && <Skeleton className="h-3 w-20" />}
        {showClass && <Skeleton className="h-3 w-16" />}
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-red-500 text-sm">Étudiant non trouvé</div>
        {showId && <Badge variant="outline" className="text-xs">ID: {studentId}</Badge>}
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className="font-medium">
          {student.prenom} {student.nom}
        </div>
        {showId && (
          <div className="text-xs text-muted-foreground">
            N° {student.id}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="font-medium">
        {student.prenom} {student.nom}
      </div>
      {showId && (
        <Badge variant="outline" className="text-xs">
          N° Étudiant: {student.id}
        </Badge>
      )}
      {showClass && student.classe_id && (
        <Badge variant="secondary" className="text-xs">
          Classe: {student.classe_id}
        </Badge>
      )}
    </div>
  );
};

export default StudentNameDisplay;
