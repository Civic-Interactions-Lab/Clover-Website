import { useQuery } from "@tanstack/react-query";
import { getAllClasses } from "../api/classes";
import QUERY_INTERVALS from "@/constants/queryIntervals";
import { useCallback, useState } from "react";
import { useUser } from "@/context/UserContext";
import { UseAllClassesOptions } from "@/types/data";

export const useAllClasses = (options?: UseAllClassesOptions) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    userId,
    enabled = true,
    includeStudents = false,
  } = options || {};

  const { data, isLoading, error, refetch, isFetching, isRefetching } =
    useQuery({
      queryKey: [
        "allClasses",
        { page, limit, search, userId, includeStudents },
      ],
      queryFn: async () => {
        const { data, error } = await getAllClasses({
          page,
          limit,
          search,
          userId,
          includeStudents,
        });
        if (error) {
          throw new Error(error);
        }
        return data!;
      },
      enabled,
      staleTime: QUERY_INTERVALS.staleTime,
      gcTime: QUERY_INTERVALS.gcTime,
      retry: QUERY_INTERVALS.retry,
      retryDelay: QUERY_INTERVALS.retryDelay,
      placeholderData: (previousData) => previousData,
    });

  return {
    classes: data?.classes || [],
    pagination: data?.pagination,
    isLoading,
    error: error?.message || null,
    refetch,
    isFetching,
    isRefetching,
    hasNextPage: data?.pagination
      ? data.pagination.page < data.pagination.totalPages
      : false,
    hasPreviousPage: data?.pagination ? data.pagination.page > 1 : false,
    totalClasses: data?.pagination?.total || 0,
  };
};
