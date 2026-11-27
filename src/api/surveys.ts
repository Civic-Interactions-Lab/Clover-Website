import { BASE_ENDPOINT } from "./endpoints";
import { apiFetch } from "./request";
import type { Survey, SurveyQuestion } from "@/pages/dashboard/ui/components/SurveyPreview";

export interface AdminSurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  created_at: string;
  submitted_at: string;
  answers: { questionId: string; value: string }[];
  survey: { id: string; title: string | null; description: string | null } | null;
  user: { id: string; first_name: string | null; pid: string | null } | null;
}

export async function listAdminSurveys(): Promise<{ surveys?: Survey[]; error?: string }> {
  return get<{ surveys: Survey[] }>("/admin/surveys");
}

export async function getAdminSurvey(surveyId: string): Promise<{ survey?: Survey; error?: string }> {
  return get<{ survey: Survey }>(`/admin/surveys/${encodeURIComponent(surveyId)}`);
}

export async function createAdminSurvey(input: Pick<Survey, "title" | "description" | "is_active" | "questions">): Promise<{ survey?: Survey; error?: string }> {
  return send<{ survey: Survey }>("/admin/surveys", "POST", input);
}

export async function updateAdminSurvey(
  surveyId: string,
  input: Pick<Survey, "title" | "description" | "is_active" | "questions">,
): Promise<{ survey?: Survey; error?: string }> {
  return send<{ survey: Survey }>(`/admin/surveys/${encodeURIComponent(surveyId)}`, "PUT", input);
}

export async function listAdminSurveyResponses(surveyId?: string): Promise<{ responses?: AdminSurveyResponse[]; error?: string }> {
  const query = surveyId ? `?surveyId=${encodeURIComponent(surveyId)}` : "";
  return get<{ responses: AdminSurveyResponse[] }>(`/admin/survey-responses${query}`);
}

export async function getCompletedSurvey(surveyId: string, userId: string): Promise<{
  survey?: Survey;
  user?: { id: string; first_name: string | null; pid: string | null };
  answers?: { questionId: string; value: string }[];
  error?: string;
}> {
  return get<{ survey: Survey; user: { id: string; first_name: string | null; pid: string | null }; answers: { questionId: string; value: string }[] }>(
    `/admin/surveys/${encodeURIComponent(surveyId)}/responses/${encodeURIComponent(userId)}`,
  );
}

export async function submitParticipantSurvey(
  surveyId: string,
  answers: { questionId: string; value: string }[],
  userId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return send<{ success: boolean }>(`/survey/${encodeURIComponent(surveyId)}/responses${query}`, "POST", { answers });
}

export type { SurveyQuestion };

async function get<T>(path: string): Promise<T & { error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}${path}`);
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not load survey data." } as T & { error: string };
    return value as T & { error?: string };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not load survey data." } as T & { error: string };
  }
}

async function send<T>(path: string, method: string, body: unknown): Promise<T & { error?: string }> {
  try {
    const response = await apiFetch(`${BASE_ENDPOINT}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const value = await response.json();
    if (!response.ok) return { error: value.error || "Could not save survey data." } as T & { error: string };
    return value as T & { error?: string };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save survey data." } as T & { error: string };
  }
}
