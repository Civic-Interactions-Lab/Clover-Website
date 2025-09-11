import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ErrorLevel,
  ErrorLog,
  ErrorsResponse,
  GetErrorsParams,
  SortOrder,
} from "@/types/error";
import { getAllErrors, resolveError } from "@/api/errors";

interface UseErrorsOptions {
  page?: number;
  limit?: number;
  level?: ErrorLevel | "all";
  category?: string | "all";
  userId?: string | "all";
  resolved?: boolean | "all";
  errorCode?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: "createdAt" | "level" | "category" | "errorCode" | "resolved";
  sortOrder?: SortOrder;
  enabled?: boolean;
}

interface UseErrorsReturn {
  errors: ErrorLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  filters: {
    level?: string;
    category?: string;
    userId?: string;
    resolved?: string;
    errorCode?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setLevel: (level: UseErrorsOptions["level"]) => void;
  setCategory: (category: string) => void;
  setUserId: (userId: string) => void;
  setResolved: (resolved: UseErrorsOptions["resolved"]) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: UseErrorsOptions["sortBy"]) => void;
  setSortOrder: (sortOrder: UseErrorsOptions["sortOrder"]) => void;
  setDateRange: (startDate?: string, endDate?: string) => void;
  resetFilters: () => void;
}

export const useErrors = (
  initialOptions: UseErrorsOptions = {}
): UseErrorsReturn => {
  // State for filters and pagination
  const [page, setPage] = useState(initialOptions.page || 1);
  const [limit, setLimit] = useState(initialOptions.limit || 10);
  const [level, setLevel] = useState<UseErrorsOptions["level"]>(
    initialOptions.level || "all"
  );
  const [category, setCategory] = useState(initialOptions.category || "all");
  const [userId, setUserId] = useState(initialOptions.userId || "all");
  const [resolved, setResolved] = useState<UseErrorsOptions["resolved"]>(
    initialOptions.resolved || "all"
  );
  const [errorCode, setErrorCode] = useState(initialOptions.errorCode || "");
  const [action, setAction] = useState(initialOptions.action || "");
  const [startDate, setStartDate] = useState(initialOptions.startDate || "");
  const [endDate, setEndDate] = useState(initialOptions.endDate || "");
  const [search, setSearch] = useState(initialOptions.search || "");
  const [sortBy, setSortBy] = useState<UseErrorsOptions["sortBy"]>(
    initialOptions.sortBy || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<UseErrorsOptions["sortOrder"]>(
    initialOptions.sortOrder || "DESC"
  );

  const queryParams = useMemo((): GetErrorsParams => {
    const params: GetErrorsParams = {
      page,
      limit,
      sortOrder,
    };

    if (sortBy === "createdAt") params.sortBy = "created_at";
    else if (sortBy === "errorCode") params.sortBy = "error_code";
    else params.sortBy = sortBy;

    // Only include filters that aren't 'all' or empty
    if (level !== "all") params.level = level;
    if (category !== "all") params.category = category;
    if (userId !== "all") params.userId = userId;
    if (resolved !== "all") params.resolved = resolved;
    if (errorCode) params.errorCode = errorCode;
    if (action) params.action = action;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (search) params.search = search;

    return params;
  }, [
    page,
    limit,
    level,
    category,
    userId,
    resolved,
    errorCode,
    action,
    startDate,
    endDate,
    search,
    sortBy,
    sortOrder,
  ]);

  const {
    data: errorsResponse,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["errors", queryParams],
    queryFn: async () => {
      try {
        const { data, error } = await getAllErrors(queryParams);

        if (error) {
          console.warn("API Error:", error);
          return {
            errors: [],
            pagination: {
              page: 1,
              limit: limit,
              totalCount: 0,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {
              sortBy: sortBy || "createdAt",
              sortOrder: sortOrder || "DESC",
            },
          } as ErrorsResponse;
        }

        if (!data) {
          return {
            errors: [],
            pagination: {
              page: 1,
              limit: limit,
              totalCount: 0,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            },
            filters: {
              sortBy: sortBy || "createdAt",
              sortOrder: sortOrder || "DESC",
            },
          } as ErrorsResponse;
        }

        const normalizedData = {
          ...data,
          errors: Array.isArray(data.errors) ? data.errors : [],
          pagination: data.pagination || {
            page: 1,
            limit: limit,
            totalCount: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          filters: data.filters || {
            sortBy: sortBy || "createdAt",
            sortOrder: sortOrder || "DESC",
          },
        } as ErrorsResponse;

        return normalizedData;
      } catch (err) {
        return {
          errors: [],
          pagination: {
            page: 1,
            limit: limit,
            totalCount: 0,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
          filters: {
            sortBy: sortBy || "createdAt",
            sortOrder: sortOrder || "DESC",
          },
        } as ErrorsResponse;
      }
    },
    enabled: initialOptions.enabled !== false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Utility functions for date range
  const setDateRange = (newStartDate?: string, newEndDate?: string) => {
    setStartDate(newStartDate || "");
    setEndDate(newEndDate || "");
    setPage(1);
  };

  const resetFilters = () => {
    setPage(1);
    setLevel("all");
    setCategory("all");
    setUserId("all");
    setResolved("all");
    setErrorCode("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setSortBy("createdAt");
    setSortOrder("DESC");
  };

  const setLevelWithReset = (newLevel: UseErrorsOptions["level"]) => {
    setLevel(newLevel);
    setPage(1);
  };

  const setCategoryWithReset = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1);
  };

  const setUserIdWithReset = (newUserId: string) => {
    setUserId(newUserId);
    setPage(1);
  };

  const setResolvedWithReset = (newResolved: UseErrorsOptions["resolved"]) => {
    setResolved(newResolved);
    setPage(1);
  };

  const setSearchWithReset = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  return {
    errors: errorsResponse?.errors || [],
    pagination: errorsResponse?.pagination || {
      page: 1,
      limit: limit,
      totalCount: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
    filters: errorsResponse?.filters || {
      sortBy: sortBy || "createdAt",
      sortOrder: sortOrder || "DESC",
    },
    isLoading,
    error: null,
    refetch,
    setPage,
    setLimit: (newLimit: number) => {
      setLimit(newLimit);
      setPage(1);
    },
    setLevel: setLevelWithReset,
    setCategory: setCategoryWithReset,
    setUserId: setUserIdWithReset,
    setResolved: setResolvedWithReset,
    setSearch: setSearchWithReset,
    setSortBy,
    setSortOrder,
    setDateRange,
    resetFilters,
  };
};

export const useResolveError = () => {
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveErrorMutation = async (
    errorId: string,
    updateData: {
      resolved?: boolean;
      resolutionNotes?: string;
      resolvedBy?: string;
    } = { resolved: true }
  ) => {
    setIsResolving(true);
    setError(null);

    try {
      const { data, error: resolve } = await resolveError(errorId, updateData);
      if (resolve) {
        setError(resolve);
        return null;
      }
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsResolving(false);
    }
  };

  return {
    resolveError: resolveErrorMutation,
    isResolving,
    error,
  };
};
