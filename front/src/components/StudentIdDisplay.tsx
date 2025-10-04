import React from "react";
import { useStudentInfo } from "@/hooks/useStudentInfo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentIdDisplayProps {
  studentId: string;
  variant?: "default" | "badge" | "text";
  className?: string;
}

export const StudentIdDisplay: React.FC<StudentIdDisplayProps> = ({
  studentId,
  variant = "default",
  className = "",
}) => {
  const { data: student, isLoading, error } = useStudentInfo(studentId);

  if (isLoading) {
    return <Skeleton className="h-4 w-20" />;
  }

  if (error || !student) {
    return (
      <span className={`text-red-500 text-sm ${className}`}>
        ID: {studentId}
      </span>
    );
  }

  const studentIdText = `N° ${student.id}`;

  switch (variant) {
    case "badge":
      return (
        <Badge variant="outline" className={`text-xs ${className}`}>
          {studentIdText}
        </Badge>
      );
    case "text":
      return (
        <span className={`text-sm text-muted-foreground ${className}`}>
          {studentIdText}
        </span>
      );
    default:
      return (
        <span className={`font-medium ${className}`}>
          {studentIdText}
        </span>
      );
  }
};

export default StudentIdDisplay;
