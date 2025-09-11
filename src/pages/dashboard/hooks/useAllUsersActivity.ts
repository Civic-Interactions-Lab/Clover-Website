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

export const useAllUsersWithActivity = (options?: UseAllUsersOptions) => {
  const { page = 1, limit = 50, search = "", enabled = true } = options || {};

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["allUsers", { page, limit, search }],
    queryFn: async () => {
      const { data, error } = await getAllUsers({ page, limit, search });
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
            user.settings.mode as UserMode
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
              activityData.activities[0].createdAt
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
    pagination: usersData?.pagination,
    isLoading,
    isFetching,
    error,
    hasNextPage: usersData?.pagination
      ? usersData.pagination.page < usersData.pagination.totalPages
      : false,
    hasPreviousPage: usersData?.pagination
      ? usersData.pagination.page > 1
      : false,
    totalUsers: usersData?.pagination?.total || 0,
  };
};

export const useAllUsersWithActivityAndSearch = (
  initialSearch = "",
  initialLimit = 10
) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [limit, setLimit] = useState(initialLimit);

  const {
    users,
    pagination,
    isLoading,
    isFetching,
    error,
    hasNextPage,
    hasPreviousPage,
    totalUsers,
  } = useAllUsersWithActivity({
    page,
    limit,
    search,
  });

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      return (
        new Date(b.lastActivity as any).getTime() -
        new Date(a.lastActivity as any).getTime()
      );
    });
  }, [users]);

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
    if (pagination) {
      setPage(pagination.totalPages);
    }
  }, [pagination]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    // Data
    users: sortedUsers,
    pagination,
    totalUsers,
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
