import { toCamelCase, toSnakeCase } from "@/lib/utils";
import { ErrorLog, ErrorsResponse, GetErrorsParams } from "@/types/error";
import { ERROR_ENDPOINT } from "./endpoints";

export interface UpdateErrorRequest {
  resolved?: boolean;
  resolutionNotes?: string;
  resolvedBy?: string;
}

/**
 * Fetches all errors with pagination, filtering, and search capabilities.
 * @param params - Query parameters for filtering, pagination, and sorting
 * @returns {Promise<{ data?: ErrorsResponse; error?: string }>} - The response from the server or an error message.
 */
export async function getAllErrors(params: GetErrorsParams = {}): Promise<{
  data?: ErrorsResponse;
  error?: string;
}> {
  try {
    // Convert camelCase params to snake_case for API
    const snakeParams = toSnakeCase(params);
    const queryParams = new URLSearchParams();

    Object.entries(snakeParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `${ERROR_ENDPOINT}/${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message ||
          `Failed to fetch errors: ${response.status} ${response.statusText}`,
      };
    }

    if (!data || !Array.isArray(data.errors)) {
      return { error: "Invalid response: expected errors array" };
    }

    // Transform snake_case response to camelCase
    const transformedResponse = toCamelCase(data);

    return { data: transformedResponse };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches a single error by its ID.
 * @param errorId - The ID of the error to fetch
 * @returns {Promise<{ data?: ErrorLog; error?: string }>} - The error details or an error message.
 */
export async function getErrorById(errorId: string): Promise<{
  data?: ErrorLog;
  error?: string;
}> {
  try {
    if (!errorId || errorId.trim() === "") {
      return { error: "Error ID is required" };
    }

    const response = await fetch(`${ERROR_ENDPOINT}/${errorId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const apiResponse = await response.json();

    if (!response.ok) {
      return {
        error:
          apiResponse.message ||
          `Failed to fetch error details: ${response.status} ${response.statusText}`,
      };
    }

    if (!apiResponse || !apiResponse.error) {
      return { error: "Invalid response: expected error data" };
    }

    // Return the error object from the API response
    return { data: toCamelCase(apiResponse.error) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Resolves an error by updating its status.
 * @param errorId - The ID of the error to resolve
 * @param updateData - The data to update (resolved status, notes, etc.)
 * @returns {Promise<{ data?: ErrorLog; error?: string }>} - The updated error or an error message.
 */
export async function resolveError(
  errorId: string,
  updateData: UpdateErrorRequest = { resolved: true }
): Promise<{
  data?: ErrorLog;
  error?: string;
}> {
  try {
    if (!errorId || errorId.trim() === "") {
      return { error: "Error ID is required" };
    }

    // Transform camelCase to snake_case for API
    const apiData = toSnakeCase(updateData);

    const response = await fetch(`${ERROR_ENDPOINT}/${errorId}/resolve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message ||
          `Failed to resolve error: ${response.status} ${response.statusText}`,
      };
    }

    if (!data) {
      return { error: "Invalid response: expected updated error data" };
    }

    return { data: toCamelCase(data) };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
