// types/typing.ts

import { UserMode } from "@/types/user";
import { LOG_ENDPOINT } from "./endpoints";

/**
 * Individual typing log entry
 */
export interface TypingLogEntry {
  id: string;
  userId: string;
  typedNumber: number;
  acceptedNumber: number;
  suggestionId?: string;
  suggestionLineId?: string;
  suggestionSelectionItemId?: string;
  createdAt: string;
}

/**
 * Response from the typing logs API
 */
export interface TypingLogsResponse {
  totalTyped: number;
  totalAccepted: number;
  typingRate: number;
  logs: TypingLogEntry[];
}

/**
 * Interval types for time-based queries
 */
export type IntervalType = "days" | "weeks" | "months" | "hours" | "minutes";

/**
 * Parameters for fetching typing logs
 */
export interface TypingLogsParams {
  userId: string;
  mode: UserMode;
  intervalType?: "days" | "weeks" | "months" | "hours" | "minutes";
  intervalCount?: number;
}

/**
 * Fetches typing logs and statistics from the server.
 * @param {TypingLogsParams} params - The parameters for the request
 * @returns {Promise<{ data?: TypingLogsResponse; error?: string }>} - The response from the server or an error message.
 */
export async function getTypingLogs({
  userId,
  mode,
  intervalType = "days",
  intervalCount = 30,
}: TypingLogsParams): Promise<{
  data?: TypingLogsResponse;
  error?: string;
}> {
  const userMode =
    mode === UserMode.CODE_BLOCK
      ? "block"
      : mode === UserMode.LINE_BY_LINE
        ? "line"
        : "selection";

  try {
    const params = new URLSearchParams({
      mode: userMode,
      interval_type: intervalType,
      interval_count: intervalCount.toString(),
    });

    const response = await fetch(
      `${LOG_ENDPOINT}/typing/${userId}?${params.toString()}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          data.message ||
          `Failed to get typing logs: ${response.status} ${response.statusText}`,
      };
    }

    if (!data) {
      return { error: "Invalid response: expected typing logs data" };
    }

    return { data: data as TypingLogsResponse };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
