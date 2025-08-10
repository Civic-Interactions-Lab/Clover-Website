import {
  BaseSuggestion,
  SuggestionData,
  UserActivityLogItem,
} from "../types/suggestion";
import { AI_SUGGESTION_ENDPOINT } from "./endpoints";
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
