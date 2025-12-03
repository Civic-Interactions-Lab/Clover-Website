import { UserMode } from "@/types/user.ts";
import { getClassActivityByInstructorId } from "@/api/classes.ts";
import { useQuery } from "@tanstack/react-query";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { useMemo } from "react";
import {
  calculateProgress,
  getEmptyProgressData,
} from "@/utils/calculateProgress";
import { ActivityLogResponse } from "@/types/suggestion";
import { getEventsForMode } from "@/types/event";

/**
 * Custom hook to fetch and manage class activity logs.
 * It fetches all activity logs for the provided classes and filters them based on the selected class ID.
 * @param instructorId
 * @param selectedClassId - The ID of the selected class to filter activity logs by.
 * @param mode
 * @returns An object containing the following properties:
 */

export const useClassActivity = (
  instructorId?: string | null,
  selectedClassId: string | null = null,
  mode?: UserMode | null,
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["classActivity", instructorId],
    queryFn: async () => {
      if (!instructorId) {
        return [];
      }

      const { data, error } =
        await getClassActivityByInstructorId(instructorId);
      if (error || !data) throw new Error(error);

      return data as ActivityLogResponse;
    },
    enabled: !!instructorId,
    staleTime: QUERY_INTERVALS.staleTime,
    gcTime: QUERY_INTERVALS.gcTime,
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
  });

  const filteredClassActivity = useMemo(() => {
    if (!data || !data.length) return [];

    let filtered = [...data];

    if (mode) {
      const { accept, reject } = getEventsForMode(mode);
      const allowedEvents = [...accept, ...reject];
      filtered = filtered.filter((log) => allowedEvents.includes(log.event));
    }

    if (selectedClassId === "non-class") {
      filtered = filtered.filter((activity) => !activity.classId);
    } else if (selectedClassId && selectedClassId !== "all") {
      filtered = filtered.filter(
        (activity) => activity.classId === selectedClassId,
      );
    }

    return filtered;
  }, [data, selectedClassId, mode]);

  const progressData = useMemo(() => {
    if (!filteredClassActivity.length) {
      return getEmptyProgressData();
    }

    return calculateProgress(filteredClassActivity);
  }, [filteredClassActivity]);

  return {
    allActivity: data || [],
    classActivity: filteredClassActivity,
    progressData,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isEmpty: !isLoading && filteredClassActivity.length === 0,
  };
};
