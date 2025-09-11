import { AUTH_ENDPOINT } from "@/api/endpoints";

/**
 * Function to log in a user
 * TODO: Wrap this in a try-catch block to match other api functions
 * @param {string} firstName - The first name of the user
 * @param {string} lastName - The last name of the user
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<{ data?: any; error?: string }>} - The response from the server or an error message
 * @throws {Error} - Throws an error if the request fails
 */
export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  isConsent?: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        isConsent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(data);
      return { error: data.message };
    }

    return { success: !!data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ userId?: string; error?: string }> {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Login failed" };
    }

    return { userId: data.userId };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 *
 * @param firstName
 * @param lastName
 * @param email
 * @param id
 * @returns
 */
export async function checkAndRegisterUser(
  firstName: string,
  lastName: string,
  email: string,
  id: string
): Promise<{ error?: string }> {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        id,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error };
    }

    return { error: undefined };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
