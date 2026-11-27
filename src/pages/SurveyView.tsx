import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SurveyPreview, {
  Participant,
  Survey,
} from "./dashboard/ui/components/SurveyPreview";
import { supabase } from "@/lib/supabaseClient.ts";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { BASE_ENDPOINT } from "@/api/endpoints";
import { createStudyHandoff } from "@/api/auth";
import { Button } from "@/components/ui/button";

const SurveyView = () => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [user, setUser] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get("surveyId");
  const userId = urlParams.get("userId");
  const studySlug = urlParams.get("studySlug");

  useEffect(() => {
    if (surveyId && userId) {
      loadSurveyAndUser();
    } else {
      setLoading(false);
    }
  }, [surveyId, userId]);

  const loadSurveyAndUser = async () => {
    try {
      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) {
        throw new Error("Sign in to complete this survey.");
      }
      const response = await fetch(
        `${BASE_ENDPOINT}/survey/${encodeURIComponent(surveyId!)}/participant?userId=${encodeURIComponent(userId!)}`,
        { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the survey.");
      setSurvey(result.survey as Survey);
      setUser(result.user as Participant);
      setAlreadySubmitted(result.alreadySubmitted === true);
    } catch (error) {
      console.error("Error loading survey and user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
    if (studySlug) void continueToStudy();
  };

  const continueToStudy = async () => {
    if (!studySlug) return;
    setContinuing(true);
    setContinueError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session?.access_token) {
        throw new Error("Sign in again to continue to the study workspace.");
      }
      const handoff = await createStudyHandoff(studySlug, data.session.access_token);
      if (handoff.error) throw new Error(handoff.error);
      if (handoff.surveyId) {
        throw new Error("The pre-survey response is not recorded yet. Submit it again to continue.");
      }
      if (!handoff.handoffCode || !handoff.continueUrl) {
        throw new Error("The study handoff response was incomplete.");
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = handoff.continueUrl;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "handoffCode";
      input.value = handoff.handoffCode;
      form.append(input);
      document.body.append(form);
      form.submit();
    } catch (error) {
      setContinueError(error instanceof Error ? error.message : "Could not start the workspace.");
      setContinuing(false);
    }
  };

  const submitSurvey = async (answers: Record<string, string>) => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error("Sign in to complete this survey.");
    }
    const response = await fetch(`${BASE_ENDPOINT}/survey/${encodeURIComponent(surveyId!)}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to submit survey.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p>Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!surveyId || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Survey Link</h2>
            <p className="text-muted-foreground">
              This survey link is missing required parameters. Please check your
              URL.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
            <p className="text-muted-foreground">
              The survey or user data could not be loaded. Please check your
              access permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Unavailable</h2>
            <p className="text-muted-foreground">
              This survey is not currently open for responses.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl pt-2 gap-3">
          <CardContent className="text-center py-8 m-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {alreadySubmitted && !showSuccess
                ? "Already Submitted"
                : "Survey Submitted"}
            </h2>
            <p className="text-muted-foreground">
              {alreadySubmitted && !showSuccess
                ? "You have already submitted a response for this survey."
                : "Thank you for completing the survey. Your response has been recorded."}
            </p>
            {studySlug && (
              <div className="mt-6 space-y-3">
                {continueError && <p role="alert" className="text-destructive">{continueError}</p>}
                <Button onClick={() => void continueToStudy()} disabled={continuing}>
                  {continuing ? "Starting workspace..." : "Continue to workspace"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-16">
      <SurveyPreview
        survey={survey}
        user={user}
        userId={userId}
        onSuccess={handleSuccess}
        onSubmit={submitSurvey}
      />
    </div>
  );
};

export default SurveyView;
