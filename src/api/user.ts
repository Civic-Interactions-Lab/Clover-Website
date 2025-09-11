import { User, UserMode, UserSettings } from "../types/user";
import { USER_ENDPOINT, LOG_ENDPOINT } from "./endpoints";
import { ActivityLogResponse } from "../types/suggestion";
import { MODE_CONFIG } from "@/types/mode";
import { UsersPaginationParams, UsersResponse } from "@/types/data";

/**
 * Function to save user settings to the database.
 * TODO: add an error to the promise if the request fails
 * @param {SettingsData} payload - The payload containing user ID and settings to be saved
 * @returns {Promise<boolean>} - Returns true if the settings were saved successfully, false otherwise
 */
export async function saveUserSettings(
  userId: string,
  settings: UserSettings
): Promise<{ success?: boolean; error?: string }> {
  console.log("Saving user settings:", userId, settings);
  try {
    const response = await fetch(`${USER_ENDPOINT}/${userId}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message ||
          `Failed to get user data: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Function to get the user data from the database.
 * @param {string} userId - The ID of the user whose data is to be fetched
 * @returns {Promise<{ data?: User; error?: string }>} - The response from the server or an error message
 */
export async function getUserData(
  userId: string
): Promise<{ data?: User; error?: string }> {
  try {
    const response = await fetch(`${USER_ENDPOINT}/${userId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message ||
          `Failed to get user data: ${response.status} ${response.statusText}`,
      };
    }

    if (!data) {
      return { error: "Invalid response: expected user data" };
    }

    return {
      data: data.user,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Function to get the user activity logs from the database.
 * @param {string} userId - The ID of the user whose activity logs are to be fetched
 * @returns {Promise<{ data?: UserActivityLogItem[] | null; error?: string }>} - The response from the server or an error message
 */
export async function getUserActivity(
  userId: string,
  mode: UserMode
): Promise<{ logs?: ActivityLogResponse; error?: string }> {
  const config = MODE_CONFIG[mode];

  console.log(
    "Fetching user activity for:",
    userId,
    "Mode:",
    mode,
    "Config:",
    config
  );

  try {
    const url = `${LOG_ENDPOINT}/suggestion/${userId}/${config.route}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        error:
          data.message ||
          `Failed to get user activity: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    return { logs: data.logs as ActivityLogResponse };
  } catch (err) {
    console.error("Error fetching user activity:", err);
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function getAllUsers(params: UsersPaginationParams = {}): Promise<{
  data?: UsersResponse;
  error?: string;
}> {
  try {
    const url = new URL(`${USER_ENDPOINT}/`);

    if (params.page) url.searchParams.append("page", params.page.toString());
    if (params.limit) url.searchParams.append("limit", params.limit.toString());
    if (params.search) url.searchParams.append("search", params.search);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          data.message ||
          `Failed to get users: ${response.status} ${response.statusText}`,
      };
    }

    if (!data.users || !Array.isArray(data.users)) {
      return { error: "Invalid response: expected users array" };
    }

    if (!data.pagination) {
      return { error: "Invalid response: expected pagination data" };
    }

    return { data: data as UsersResponse };
  } catch (err) {
    console.error("Error fetching users:", err);
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Function to delete a user from the database.
 * @param {string} userID - The ID of the user to be deleted
 * @returns {Promise<{ success?: boolean; error?: string }>} - The response from the server or an error message
 */
export async function deleteUser(userID: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${USER_ENDPOINT}/${userID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error:
          data.message ||
          `Failed to delete user: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Function to update a user's data in the database.
 * @param {string} userId - The ID of the user to be updated
 * @param {User} payload - The payload containing user data to be updated
 * @returns {Promise<{ success?: boolean; error?: string }>} - The response from the server or an error message
 */
export async function updateUser(
  userId: string,
  payload: User
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const backendPayload = {
      ...payload,
      first_name: payload.firstName,
      last_name: payload.lastName,
      avatar_url: payload.avatarUrl,
    };

    const response = await fetch(`${USER_ENDPOINT}/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error:
          data.message ||
          `Failed to update user: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function updateUserPassword(
  userId: string,
  password: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${USER_ENDPOINT}/${userId}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(password),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error:
          data.message ||
          `Failed to update user: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
