import { BASE_ENDPOINT } from "./endpoints";
import { apiFetch } from "./request";

export type UserDataExport = Record<string, Record<string, unknown>[]>;

export async function getUserDataExport(userId: string): Promise<{ data?: UserDataExport; error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}/data/${encodeURIComponent(userId)}`);
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not export user data." };
    return { data: value as UserDataExport };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not export user data." };
  }
}

export async function getAdminTableData(table: string): Promise<{ data?: Record<string, unknown>[]; error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}/data/table/${encodeURIComponent(table)}`);
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not load table data." };
    return { data: Array.isArray(value.data) ? value.data : [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not load table data." };
  }
}
