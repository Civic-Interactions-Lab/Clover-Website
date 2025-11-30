import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { UserMode, UserWithActivity } from "@/types/user";
import { getAllUsers, getUserActivity } from "@/api/user";
import { UserActivityLogItem } from "@/types/suggestion";
import {
  calculateProgress,
  getEmptyProgressData,
} from "@/utils/calculateProgress";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { UseAllUsersOptions } from "@/types/data";
import { isOnline } from "@/utils/timeConverter";

export const useAllUsersWithActivity = (options?: UseAllUsersOptions) => {
  const { search = "", enabled = true } = options || {};

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["allUsers", { search }],
    queryFn: async () => {
      const { data, error } = await getAllUsers({
        page: 1,
        limit: 500, // Fetch more users
        search,
      });
      if (error) throw new Error(error);
      return data!;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    retry: 2,
  });

  const users = useMemo(() => usersData?.users || [], [usersData]);

  const activityQueries = useQueries({
    queries: users.map((user) => ({
      queryKey: ["userActivity", user.id, "all"],
      queryFn: async () => {
        if (!user.settings?.mode) {
          return {
            userId: user.id,
            activities: [],
            progressData: getEmptyProgressData(),
          };
        }

        try {
          const { logs, error } = await getUserActivity(
            user.id,
            user.settings.mode as UserMode,
          );

          if (error || !logs) {
            return {
              userId: user.id,
              activities: [],
              progressData: getEmptyProgressData(),
            };
          }

          const logArray = logs as UserActivityLogItem[];

          const progressData =
            logArray.length > 0
              ? calculateProgress(logArray)
              : getEmptyProgressData();

          return {
            userId: user.id,
            activities: logArray,
            progressData,
          };
        } catch (err) {
          console.warn(`Failed to fetch activity for user ${user.id}:`, err);
          return {
            userId: user.id,
            activities: [],
            progressData: getEmptyProgressData(),
          };
        }
      },
      enabled: enabled && !!user.id && !!user.settings?.mode,
      staleTime: QUERY_INTERVALS.staleTime,
      retry: 1,
    })),
  });

  const usersWithActivity = useMemo(() => {
    return users.map((user, index): UserWithActivity => {
      const activityQuery = activityQueries[index];
      const activityData = activityQuery?.data;

      if (!activityData) {
        return {
          ...user,
          totalAccepted: 0,
          totalRejected: 0,
          totalInteractions: 0,
          correctSuggestions: 0,
          correctAccepts: 0,
          correctRejects: 0,
          accuracyPercentage: 0,
          lastActivity: null,
          activityMode: (user.settings?.mode as UserMode) || null,
        };
      }

      // Get the last activity timestamp
      const lastActivity =
        activityData.activities.length > 0
          ? activityData.activities.reduce(
              (latest, activity) =>
                new Date(activity.createdAt) > new Date(latest)
                  ? activity.createdAt
                  : latest,
              activityData.activities[0].createdAt,
            )
          : null;

      return {
        ...user,
        totalAccepted: activityData.progressData.totalAccepted,
        totalRejected: activityData.progressData.totalRejected,
        totalInteractions: activityData.progressData.totalInteractions,
        correctSuggestions: activityData.progressData.correctSuggestions,
        correctAccepts: activityData.progressData.correctAccepts,
        correctRejects: activityData.progressData.correctRejects,
        accuracyPercentage: activityData.progressData.accuracyPercentage,
        lastActivity,
        activityMode: (user.settings?.mode as UserMode) || null,
      };
    });
  }, [users, activityQueries]);

  const isLoading =
    usersLoading || activityQueries.some((query) => query.isLoading);
  const isFetching = activityQueries.some((query) => query.isFetching);

  const error =
    usersError?.message ||
    activityQueries.find((query) => query.error)?.error?.message ||
    null;

  return {
    users: usersWithActivity,
    isLoading,
    isFetching,
    error,
    totalUsers: usersWithActivity.length,
  };
};

export const useAllUsersWithActivityAndSearch = (
  initialSearch = "",
  initialLimit = 10,
) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [limit, setLimit] = useState(initialLimit);

  // Fetch ALL users (no server-side pagination)
  const {
    users: allUsers,
    isLoading,
    isFetching,
    error,
    totalUsers: allUsersCount,
  } = useAllUsersWithActivity({
    search,
  });

  // Prioritize online users first, then by recent activity
  const sortedUsers = useMemo(() => {
    return [...allUsers].sort((a, b) => {
      const aOnline = isOnline(a.lastActivity);
      const bOnline = isOnline(b.lastActivity);

      // First priority: online status (online users first)
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // Second priority: recent activity (most recent first)
      const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;

      return bTime - aTime;
    });
  }, [allUsers]);

  // Client-side pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, page, limit]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedUsers.length / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const pagination = {
    page,
    limit,
    total: sortedUsers.length,
    totalPages,
  };

  const handleSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    // Sorted users
    users: paginatedUsers,
    pagination,
    totalUsers: sortedUsers.length,
    limit,

    // Loading states
    isLoading,
    isFetching,
    error,

    // Search
    search,
    handleSearch,

    // Pagination
    page,
    hasNextPage,
    hasPreviousPage,
    handlePageChange,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    handleLimitChange,
  };
};

export type { UserWithActivity };
