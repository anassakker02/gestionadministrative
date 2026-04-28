import { useQuery } from "@tanstack/react-query";
import { studentService } from "@/services/studentService";

export const useStudentInfo = (studentId: string) => {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await studentService.getStudent(studentId);
      return response.data;
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStudentsInfo = (studentIds: string[]) => {
  return useQuery({
    queryKey: ["students", studentIds],
    queryFn: async () => {
      if (!studentIds.length) return {};
      
      const students = await Promise.all(
        studentIds.map(async (id) => {
          try {
            const response = await studentService.getStudent(id);
            return { id, data: response.data };
          } catch (error) {
            console.error(`Erreur lors de la récupération de l'étudiant ${id}:`, error);
            return { id, data: null };
          }
        })
      );
      
      return students.reduce((acc, { id, data }) => {
        acc[id] = data;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: studentIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
