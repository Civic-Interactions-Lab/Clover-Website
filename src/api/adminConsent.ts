import { BASE_ENDPOINT } from "./endpoints";
import { apiFetch } from "./request";
import type { ConsentForm, ConsentFormBlock } from "@/types/consent";

export async function getAdminConsentForm(): Promise<{ data?: Record<string, any>; error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}/admin/consent`);
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not load the consent form." };
    return { data: value.data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not load the consent form." };
  }
}

export async function updateAdminConsentForm(formId: number, updates: Record<string, string>): Promise<{ error?: string }> {
  return request(`/admin/consent/forms/${formId}`, "PUT", updates);
}

export async function createAdminConsentBlock(
  formId: number,
  block: Pick<ConsentFormBlock, "type" | "content" | "sortOrder">,
): Promise<{ block?: Record<string, any>; error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}/admin/consent/forms/${formId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: block.type, content: block.content, sort_order: block.sortOrder }),
    });
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not create the consent block." };
    return { block: value.block };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the consent block." };
  }
}

export async function updateAdminConsentBlock(
  blockId: string,
  updates: { content?: unknown; sortOrder?: number },
): Promise<{ error?: string }> {
  return request(`/admin/consent/blocks/${encodeURIComponent(blockId)}`, "PUT", {
    ...(updates.content !== undefined ? { content: updates.content } : {}),
    ...(updates.sortOrder !== undefined ? { sort_order: updates.sortOrder } : {}),
  });
}

export async function deleteAdminConsentBlock(blockId: string): Promise<{ error?: string }> {
  return request(`/admin/consent/blocks/${encodeURIComponent(blockId)}`, "DELETE");
}

export function mapAdminConsentForm(value: Record<string, any>): ConsentForm {
  return {
    id: value.id,
    title: value.title,
    principalInvestigator: value.principal_investigator,
    institution: value.institution,
    irbProtocol: value.irb_protocol,
    email: value.email ?? "",
    phone: value.phone ?? "",
    faculty: value.faculty ?? "",
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    blocks: (value.blocks ?? []).map((block: Record<string, any>) => ({
      id: block.id,
      formId: block.form_id,
      type: block.type,
      content: block.content,
      sortOrder: block.sort_order,
      createdAt: block.created_at,
      updatedAt: block.updated_at,
    })),
  };
}

async function request(path: string, method: string, body?: unknown): Promise<{ error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}${path}`, {
      method,
      ...(body !== undefined ? {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      } : {}),
    });
    if (!response.ok) {
      const value = await response.json().catch(() => ({}));
      return { error: value.error || "Could not update consent data." };
    }
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update consent data." };
  }
}
