import React from "react";
import { useStudentInfo } from "@/hooks/useStudentInfo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";

interface StudentHeaderProps {
  studentId: string;
  title?: string;
  showIcon?: boolean;
  className?: string;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  studentId,
  title = "Étudiant",
  showIcon = true,
  className = "",
}) => {
  const { data: student, isLoading, error } = useStudentInfo(studentId);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showIcon && <Skeleton className="h-6 w-6 rounded" />}
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showIcon && <GraduationCap className="h-6 w-6 text-red-500" />}
        <div>
          <h2 className="text-xl font-semibold text-red-500">Étudiant non trouvé</h2>
          <p className="text-sm text-muted-foreground">ID: {studentId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && <GraduationCap className="h-6 w-6 text-blue-600" />}
      <div>
        <h2 className="text-xl font-semibold">
          {title}: {student.prenom} {student.nom}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            N° {student.user_id || student.id}
          </Badge>
          {student.classe_id && (
            <Badge variant="secondary" className="text-xs">
              Classe: {student.classe_id}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;
