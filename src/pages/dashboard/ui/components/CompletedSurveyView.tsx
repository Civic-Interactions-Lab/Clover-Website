import { useEffect, useState } from "react";
import { getCompletedSurvey } from "@/api/surveys";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SurveyPreview, { Participant, Survey } from "./SurveyPreview";

const CompletedSurveyView = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get("surveyId");
  const userId = urlParams.get("userId");

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [user, setUser] = useState<Participant | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!surveyId || !userId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        const { survey, user: participant, answers, error } =
          await getCompletedSurvey(surveyId, userId);
        if (error) throw new Error(error);
        if (!survey || !participant) throw new Error("Survey response not found.");

        setSurvey(survey as Survey);
        setUser({
          id: participant.id,
          first_name: participant.first_name ?? "",
          pid: participant.pid ?? "",
        });

        // Convert [{ questionId, value }] array to Record<string, string>
        const answersArray: { questionId: string; value: string }[] =
          answers ?? [];
        const answersMap: Record<string, string> = {};
        answersArray.forEach(({ questionId, value }) => {
          answersMap[questionId] = value;
        });
        setAnswers(answersMap);
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
