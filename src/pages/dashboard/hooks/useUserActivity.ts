import { getUserActivity } from "@/api/user";
import {
  calculateProgress,
  getEmptyProgressData,
} from "@/utils/calculateProgress";
import { UserActivityLogItem } from "@/types/suggestion";
import { UserMode } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { useMemo } from "react";

export const useUserActivity = (
  userId?: string | null,
  mode?: UserMode | null,
  selectedClassId: string | null = null,
  isRealtimeEnabled?: boolean,
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userActivity", userId, mode],
    queryFn: async () => {
      if (!userId || !mode) {
        return [];
      }

      const { logs, error } = await getUserActivity(userId, mode as UserMode);
      if (error || !logs) throw new Error(error);

      const logArray = logs as UserActivityLogItem[];

      return logArray;
    },
    enabled: !!userId,
    staleTime: QUERY_INTERVALS.staleTime,
    gcTime: QUERY_INTERVALS.gcTime,
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchInterval: isRealtimeEnabled ? 30_000 : false,
  });

  const filteredUserActivity = useMemo(() => {
    if (!data || !data.length) return [];

    let filtered = [...data];

    if (selectedClassId === "non-class") {
      filtered = filtered.filter((activity) => !activity.classId);
    } else if (selectedClassId && selectedClassId !== "all") {
      filtered = filtered.filter(
        (activity) => activity.classId === selectedClassId,
      );
    }

    return filtered;
  }, [data, selectedClassId]);

  const progressData = useMemo(() => {
    if (!filteredUserActivity.length) {
      return getEmptyProgressData();
    }

    return calculateProgress(filteredUserActivity);
  }, [filteredUserActivity]);

  return {
    userActivity: filteredUserActivity,
    progressData,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    isEmpty: !isLoading && filteredUserActivity.length === 0,
  };
};
