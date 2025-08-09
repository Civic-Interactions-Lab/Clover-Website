import { toCamelCase } from "@/lib/utils";
import { CONSENT_ENDPOINT } from "./endpoints";

export interface ConsentFormBlock {
  id: string;
  formId: number;
  type: string;
  content: any;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentForm {
  id: number;
  title: string;
  subtitle: string;
  studyTitle: string;
  researchLead: string;
  institution: string;
  irbNumber: string;
  blocks: ConsentFormBlock[];
  createdAt: string;
  updatedAt: string;
}

interface ConsentFormResponse {
  success: boolean;
  data: ConsentForm;
}

export async function getConsentForm(): Promise<{
  consentForm?: ConsentForm;
  error?: string;
}> {
  try {
    const response = await fetch(CONSENT_ENDPOINT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const rawData: ConsentFormResponse | { error: string } =
      await response.json();

    if (!response.ok) {
      return {
        error:
          (rawData as { error: string }).error ||
          "Failed to fetch consent form",
      };
    }

    const camelCaseData = toCamelCase((rawData as ConsentFormResponse).data);
    return { consentForm: camelCaseData };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}
