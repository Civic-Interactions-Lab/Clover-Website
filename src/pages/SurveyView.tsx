import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SurveyPreview, {
  Participant,
  Survey,
} from "./dashboard/ui/components/SurveyPreview";
import { supabase } from "@/supabaseClient";
import { AlertTriangle, CheckCircle } from "lucide-react";

const SurveyView = () => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [user, setUser] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get("surveyId");
  const userId = urlParams.get("userId");

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

      // Load survey data
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .single();

      if (surveyError) throw surveyError;

      // Load survey questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", surveyId)
        .order("question_number");

      if (questionsError) throw questionsError;

      // Load user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, first_name, pid")
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      setSurvey({ ...surveyData, questions: questionsData || [] });
      setUser(userData);

      // Check if user has already submitted
      const { data: existingResponse } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", surveyId)
        .eq("user_id", userId)
        .single();

      if (existingResponse) {
        setAlreadySubmitted(true);
      }
    } catch (error) {
      console.error("Error loading survey and user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
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

  if (showSuccess || alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md pt-2">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Submitted</h2>
            <p className="text-muted-foreground">
              Thank you for completing the survey. Your response has been
              recorded.
            </p>
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
        userId={alreadySubmitted ? undefined : userId} // Pass userId only if not already submitted
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default SurveyView;
