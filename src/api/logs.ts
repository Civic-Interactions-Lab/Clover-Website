import { BASE_ENDPOINT } from "./endpoints";
import { apiFetch } from "./request";

export interface TypingLogExport {
  id: string;
  created_at: string;
  raw_text: string;
  line_suggestion_id: string | null;
  user_id: string;
  event: string;
  line_suggestions?: {
    id: string;
    correct_line: string | null;
    incorrect_line: string | null;
    shown_bug: boolean | null;
    bug_percentage: number | null;
    line_suggestions_group?: {
      filename: string | null;
      language: string | null;
    } | null;
  } | null;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    pid: string | null;
    email: string;
  };
}

export interface TerminalLogExport {
  id: string;
  start_time: string;
  end_time: string;
  output: string;
  user_id: string;
}

export interface UserSuggestionExportLog {
  id: string;
  created_at: string;
  event: string | null;
  duration: number;
  user_id: string;
  line_suggestion: {
    id: string;
    incorrect_line: string | null;
    correct_line: string | null;
    shown_bug: boolean | null;
    line_index: number | null;
    line_suggestions_group?: {
      prompt: string | null;
      suggestions: unknown;
      model: string | null;
      vendor: string | null;
      language: string | null;
      filename: string | null;
    } | null;
  } | null;
}

export interface UserTimelineLog {
  id: string;
  client_timestamp: number;
  snapshot: string | null;
  line_suggestion_id: string | null;
  user_id: string;
  event: string;
  line_suggestions?: {
    id: string;
    correct_line: string | null;
    incorrect_line: string | null;
    shown_bug: boolean | null;
  };
}

export async function getUserTypingTimeline(
  userId: string,
  offset: number,
  limit: number,
  events: string[],
): Promise<{ logs?: UserTimelineLog[]; total?: number; hasMore?: boolean; error?: string }> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    events: events.join(","),
  });
  return get(`/logs/timeline/${encodeURIComponent(userId)}?${params}`);
}

export async function getUserTypingExport(
  userId: string,
): Promise<{ typingLogs?: TypingLogExport[]; terminalLogs?: TerminalLogExport[]; error?: string }> {
  return get(`/logs/typing/user/${encodeURIComponent(userId)}`);
}

export async function getClassTypingExport(
  classId: string,
): Promise<{ typingLogs?: TypingLogExport[]; error?: string }> {
  return get(`/logs/typing/class/${encodeURIComponent(classId)}`);
}

export async function getUserSuggestionExport(
  userId: string,
): Promise<{ logs?: UserSuggestionExportLog[]; error?: string }> {
  return get(`/logs/suggestion-export/${encodeURIComponent(userId)}`);
}

async function get<T extends object>(path: string): Promise<T & { error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}${path}`);
    const value = await response.json();
    if (!response.ok) {
      return { error: value.error || "Could not load log data." } as T & { error: string };
    }
    return value as T & { error?: string };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not load log data.",
    } as T & { error: string };
  }
}
