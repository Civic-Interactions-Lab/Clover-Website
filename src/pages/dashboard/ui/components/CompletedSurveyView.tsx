import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SurveyPreview, {
  Participant,
  Survey,
  SurveyAnswers,
} from "./SurveyPreview";

const CompletedSurveyView = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get("surveyId");
  const userId = urlParams.get("userId");

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [user, setUser] = useState<Participant | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId || !userId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // 1. Load survey with questions
        const { data: surveyData, error: surveyError } = await supabase
          .from("surveys")
          .select(
            `
            id,
            title,
            description,
            context,
            type,
            created_at,
            questions:survey_questions(
              id,
              survey_id,
              question_type,
              question_number,
              question_text,
              question_options,
              is_required,
              created_at
            )
          `
          )
          .eq("id", surveyId)
          .single();

        if (surveyError) throw surveyError;

        // 2. Load participant
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, first_name, pid")
          .eq("id", userId)
          .single();

        if (userError) throw userError;

        // 3. Load their survey response
        const { data: responseData, error: responseError } = await supabase
          .from("survey_responses")
          .select("answers")
          .eq("survey_id", surveyId)
          .eq("user_id", userId)
          .maybeSingle();

        if (responseError) throw responseError;

        setSurvey(surveyData as Survey);
        setUser(userData as Participant);
        setAnswers(responseData?.answers || {});
      } catch (err) {
        console.error("Error loading completed survey:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [surveyId, userId]);

  if (loading) {
    return (
      <Card className="p-12 flex justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </Card>
    );
  }

  if (!survey || !user) {
    return (
      <Card className="p-12 text-center">
        <CardContent>
          <p className="text-muted-foreground">Survey or user not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <SurveyPreview
      survey={survey}
      user={user}
      readOnly
      initialAnswers={answers}
    />
  );
};

export default CompletedSurveyView;
