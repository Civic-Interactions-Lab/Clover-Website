import { getUserActivity } from "@/api/user";
import {
  calculateProgress,
  getEmptyProgressData,
} from "@/utils/calculateProgress";
import { UserActivityLogItem } from "@/types/suggestion";
import { UserMode } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient.ts";
import { RealtimePostgresChangesFilter } from "@supabase/supabase-js";

export const useUserActivity = (
  userId?: string | null,
  mode?: UserMode | null,
  selectedClassId: string | null = null,
  isRealtimeEnabled?: boolean,
) => {
  useEffect(() => {
    if (!isRealtimeEnabled) return;
    const changesConfig: RealtimePostgresChangesFilter<any> = {
      event: "INSERT",
      schema: "public",
      table: "suggestions_log",
    };

    if (userId) {
      changesConfig.filter = `user_id=eq.${userId}`;
    }

    const channel = supabase
      .channel(`user-activity-${userId}`)
      .on("postgres_changes", changesConfig, (payload) => {
        const newLog = payload.new;
        console.log("[Realtime] New log:", newLog);
        // updateLocalActivityLog(newLog);
        refetch();
      })
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] Successfully connected!");
        } else if (status === "TIMED_OUT") {
          console.error("[Realtime] Connection timed out.");
        } else if (err) {
          console.error("[Realtime] Connection error:", err.message);
        }
      });

    return () => {
      console.log("Component unmounted");
      supabase.removeChannel(channel);
    };
  }, [userId, isRealtimeEnabled]);

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
