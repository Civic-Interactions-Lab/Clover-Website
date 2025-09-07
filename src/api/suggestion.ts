import {
  BaseSuggestion,
  SuggestionData,
  UserActivityLogItem,
} from "../types/suggestion";
import { AI_SUGGESTION_ENDPOINT, LOG_ENDPOINT } from "./endpoints";
import { UserMode } from "../types/user";
import { MODE_CONFIG } from "@/types/mode";

/**
 * Fetches a suggestion by its ID.
 * @param {string} suggestionId - The ID of the suggestion to fetch.
 * @returns {Promise<{ data?: CodeSuggestion; error?: string }>} - The response from the server or an error message.
 */
export async function getSuggestionByModeAndId(
  logItem: UserActivityLogItem,
  mode: UserMode
): Promise<{ data?: SuggestionData; error?: string }> {
  const config = MODE_CONFIG[mode];

  if (!config) {
    return { error: "Invalid mode" };
  }

  try {
    const response = await fetch(
      `${AI_SUGGESTION_ENDPOINT}/${config.route}/${config.getId(logItem)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );

    const backendData = await response.json();

    if (!response.ok) {
      return {
        error:
          backendData.message ||
          `Failed to get suggestion data: ${response.status} ${response.statusText}`,
      };
    }

    const base: BaseSuggestion = {
      id: backendData.id,
      createdAt: backendData.created_at,
      prompt: backendData.prompt,
      hasBug: backendData.has_bug,
      duration: backendData.duration,
      model: backendData.model || "",
      vendor: backendData.vendor || "",
      language: backendData.language || "",
      refinedPrompt: backendData.refined_prompt,
      explanations: backendData.explanations,
    };

    return { data: config.transform(backendData, base) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export interface UserDiffsResponse {
  userId: string;
  groups: GroupDiff[];
}

export interface GroupDiff {
  groupId: string;
  language: string;
  prompt: string;
  steps: RenderedStep[];
  eventTime: string;
  fileName: string;
}

export interface RenderedStep {
  suggestionId: string;
  event: string;
  shownBug: boolean;
  appended: string;
  createdAt: string;
  diff: string;
  after: string;
}

export async function getUserDiffsByTime(
  userId: string,
  startTime: string,
  endTime: string
): Promise<{ data?: UserDiffsResponse; error?: string }> {
  try {
    const url = new URL(`${LOG_ENDPOINT}/diffs/${userId}`);
    const queryParams = new URLSearchParams({
      start: startTime,
      end: endTime,
    });
    url.search = queryParams.toString();
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return { error: `Request failed with status ${response.status}` };
    }

    const data = (await response.json()) as UserDiffsResponse;
    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
