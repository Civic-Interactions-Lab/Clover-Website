import { CLASS_ENDPOINT, LOG_ENDPOINT } from "./endpoints";
import {
  ClassData,
  ClassInfo,
  EnrollmentStatus,
  PaginatedClassResponse,
  UserSettings,
} from "./types/user";

/**
 * * Creates a new class in the database.
 * @param {UserClass} newClass - The class object to be created
 * @returns {Promise<{ data?: { id: string }; error?: string }>} - The response from the server
 */
export const createClass = async (
  newClass: ClassInfo
): Promise<{ id?: string; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          data.message ||
          `Failed to create class: ${response.status} ${response.statusText}`,
      };
    }

    if (!data?.id) {
      return { error: "Invalid response: expected class ID" };
    }

    return { id: data.id }; // Return ID directly
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

export const updateClass = async (
  classId: string,
  updates: Partial<ClassInfo>
): Promise<{ id?: string; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/${classId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          data.message ||
          `Failed to update class: ${response.status} ${response.statusText}`,
      };
    }

    if (!data?.id) {
      return { error: "Invalid response: expected class ID" };
    }

    return { id: data.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

export const deleteClass = async (
  classId: string
): Promise<{ success?: boolean; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/${classId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          data.message ||
          `Failed to delete class: ${response.status} ${response.statusText}`,
      };
    }

    if (!data?.success) {
      return { error: "Invalid response: expected success confirmation" };
    }

    return { success: data.success };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

/**
 * Fetches all classes from the database for an instructor.
 * @param {string} instructorId - The ID of the instructor
 * @param {boolean} includeStudents - Whether to include enrolled students data
 * @returns {Promise<{ data?: ClassData[]; error?: string }>} - The response from the server
 */
export const getClassesByInstructor = async (
  instructorId: string,
  includeStudents: boolean = false
): Promise<{ data?: ClassData[]; error?: string }> => {
  try {
    const url = new URL(`${CLASS_ENDPOINT}/instructor/${instructorId}`);
    if (includeStudents) {
      url.searchParams.append("includeStudents", "true");
    }

    const response = await fetch(url.toString());

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.message ||
          `Failed to fetch classes: ${response.status} ${response.statusText}`,
      };
    }

    if (!data) {
      return { error: "Invalid response: expected list of classes" };
    }

    return { data: data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

/**
 * Registers a user to a class in the database.
 * @param {string} classId - The ID of the class
 * @param {string} studentId - The ID of the student
 * @returns {Promise<{ data?: UserClass[]; error?: string }>} - The response from the server or an error message.
 */
export const registerUserClass = async (
  userId: string,
  classId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, classId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error ||
          `Failed to register: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

export const unregisterUserClass = async (
  userId: string,
  classId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/unregister`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        classId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

/**
 * Function to get the classes of a user from the database.
 * @param {string} userId - The ID of the user whose classes are to be fetched
 * @returns {Promise<{ data?: UserClassInfo[]; error?: string }>} - The response from the server or an error message
 */
export async function getClassesbyStudent(studentId: string): Promise<{
  data?: ClassData[];
  error?: string;
}> {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/students/${studentId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          `Failed to get user classes: ${response.status} ${response.statusText}`,
      };
    }

    return { data: data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Fetches all activity logs for a specific class from the database.
 * @param {string} classId - The ID of the class
 * @returns {Promise<{ data?: UserActivityLogItem[]; error?: string }>} - The response from the server or an error message.
 */

export interface InstructorLogResponse {
  id: string;
  event: string;
  duration: number;
  userId: string;
  classId?: string;
  createdAt: string;
  hasBug?: boolean;
  suggestionId?: string;
  lineSuggestionId?: string;
  selectionSuggestionItemId?: string;
  type: string;
  classTitle?: string;
  classCode?: string;
}

export async function getClassActivityByInstructorId(
  instructorId: string
): Promise<{ data: InstructorLogResponse[]; error?: string }> {
  console.log("Fetching class activity for instructor:", instructorId);

  try {
    const response = await fetch(`${LOG_ENDPOINT}/instructor/${instructorId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: [],
        error:
          result?.error ||
          `Failed to get logs by instructor: ${response.status} ${response.statusText}`,
      };
    }

    const logs = result.data || result;

    if (!Array.isArray(logs)) {
      return { data: [] };
    }

    return { data: logs };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Updates the enrollment status of a student in a class via backend API.
 * @param {string} classId - The ID of the class
 * @param {string} studentId - The ID of the student
 * @param {EnrollmentStatus} newStatus - The new enrollment status
 * @returns {Promise<{ success: boolean; error?: string }>} - The response from the server or an error message.
 **/
export const updateStudentEnrollmentStatus = async (
  classId: string,
  studentId: string,
  newStatus: EnrollmentStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${CLASS_ENDPOINT}/enrollment-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: studentId,
        classId,
        status: newStatus,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error ||
          `Failed to update enrollment status: ${response.status} ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
};

export async function getAllClasses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  includeStudents?: boolean;
}): Promise<{
  data?: PaginatedClassResponse;
  error?: string;
}> {
  console.log("Fetching all classes from API...");

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set("page", params.page.toString());
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.search && params.search.trim())
      queryParams.set("search", params.search.trim());
    if (params?.userId) queryParams.set("user_id", params.userId);
    if (params?.includeStudents) queryParams.set("includeStudents", "true");

    const url = `${CLASS_ENDPOINT}/${queryParams.toString() ? "?" + queryParams.toString() : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error:
          data.error ||
          `Failed to get all classes: ${response.status} ${response.statusText}`,
      };
    }

    if (!data.classes || !Array.isArray(data.classes) || !data.pagination) {
      return {
        error: "Invalid response: expected classes array and pagination object",
      };
    }

    console.log("Fetched classes from API", JSON.stringify(data, null, 2));

    return { data };
  } catch (err) {
    console.error(`Failed to get all classes:`, err);
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function updateClassStudentsSettings(
  classId: string,
  studentIds: string[],
  settings: UserSettings
): Promise<{ data?: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${CLASS_ENDPOINT}/${classId}/students/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds,
          settings,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `Failed to update settings: ${response.status}`,
      };
    }

    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function getClassById(
  classId: string,
  options?: {
    includeStudents?: boolean;
    userId?: string;
  }
): Promise<{
  data?: ClassData;
  error?: string;
}> {
  try {
    const searchParams = new URLSearchParams();

    if (options?.includeStudents) {
      searchParams.append("includeStudents", "true");
    }

    if (options?.userId) {
      searchParams.append("user_id", options.userId);
    }

    const queryString = searchParams.toString();
    const url = `${CLASS_ENDPOINT}/${classId}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        error:
          responseData.error ||
          `Failed to get class: ${response.status} ${response.statusText}`,
      };
    }

    return { data: responseData.class };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
