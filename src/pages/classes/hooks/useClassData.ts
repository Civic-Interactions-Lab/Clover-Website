import { getClassById } from "@/api/classes";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { useQuery } from "@tanstack/react-query";

export function useClassData(
  classId: string | undefined,
  options?: {
    includeStudents?: boolean;
    userId?: string;
    includeAllStatuses?: boolean;
    enabled?: boolean;
  },
) {
  return useQuery({
    queryKey: ["class", classId, options?.includeStudents, options?.userId],
    queryFn: async () => {
      if (!classId) {
        throw new Error("Class ID is required");
      }

      const result = await getClassById(classId, {
        includeStudents: options?.includeStudents,
        userId: options?.userId,
        includeAllStatuses: options?.includeAllStatuses,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!classId && (options?.enabled ?? true),
    staleTime: QUERY_INTERVALS.staleTime,
    gcTime: QUERY_INTERVALS.gcTime,
    retry: (failureCount, error) => {
      if (error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
