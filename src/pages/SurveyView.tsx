import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SurveyPreview, {
  Participant,
  Survey,
} from "./dashboard/ui/components/SurveyPreview";
import { supabase } from "@/supabaseClient";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { CopyButton } from "./Download";

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
      <div className="min-h-screen flex items-center justify-center space-x-6">
        <Card className="max-w-2xl pt-2 gap-3">
          <CardContent className="text-center py-8 m-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Submitted</h2>
            <p className="text-muted-foreground">
              Thank you for completing the survey. Your response has been
              recorded.
            </p>
          </CardContent>
        </Card>
        {survey.type === "POST_SURVEY" && (
          <div className="max-w-4xl pt-2 gap-3 w-1/2">
            <div className="flex-1 flex flex-col justify-center items-center py-8">
              <h2 className="text-xl font-semibold mb-2">
                Would you like to do a one on one session?
              </h2>
              <p className="text-muted-foreground">Schedule Here</p>
              <iframe
                src={`https://calendly.com/ian-tyler-applebaum/user-study?utm_campaign=${user.pid + "|" + user.pid}&utm_source=CLOVER`}
                width="100%"
                height="700px"
              ></iframe>
            </div>
          </div>
        )}
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
