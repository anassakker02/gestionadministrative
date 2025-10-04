import React from "react";
import { StudentNameDisplay } from "./StudentNameDisplay";
import { Badge } from "@/components/ui/badge";

interface PaymentStudentInfoProps {
  studentId: string;
  showDetails?: boolean;
}

export const PaymentStudentInfo: React.FC<PaymentStudentInfoProps> = ({
  studentId,
  showDetails = false,
}) => {
  if (!studentId) {
    return (
      <div className="text-gray-500 text-sm">
        <Badge variant="outline">Aucun étudiant</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <StudentNameDisplay 
        studentId={studentId} 
        showId={true}
        showClass={showDetails}
        compact={true}
      />
    </div>
  );
};

export default PaymentStudentInfo;
