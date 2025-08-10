import { toCamelCase } from "@/lib/utils";
import { CONSENT_ENDPOINT } from "./endpoints";
import { ConsentForm } from "@/types/consent";

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
