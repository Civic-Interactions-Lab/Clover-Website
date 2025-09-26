import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { SurveyAnswers } from "../../components/SurveyPreview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import SurveyView from "@/pages/SurveyView";
import { useNavigate } from "react-router-dom";

type SurveyResponse = {
  id: string;
  created_at: string;
  answers: SurveyAnswers;
  survey: {
    title: string | null;
    type: string | null;
    description: string | null;
    id?: string;
  } | null;
  user: {
    id: string;
    first_name: string | null;
    pid?: string | null;
  } | null;
};

type Survey = {
  id: string;
  title: string | null;
};

const ViewAllSurveys = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [pidFilter, setPidFilter] = useState<string>("");

  const navigate = useNavigate();

  // Fetch survey list for dropdown
  useEffect(() => {
    const loadSurveys = async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title");
      if (error) {
        console.error(error);
        return;
      }
      setSurveys(data ?? []);
    };
    loadSurveys();
  }, []);

  // Fetch survey responses with filters
  useEffect(() => {
    const loadSurveyAndUser = async () => {
      let query = supabase.from("survey_responses").select(
        `
        id,
        created_at,
        answers,
        survey:survey_id (
          id,
          title,
          type,
          description 
        ),
        user:user_id (
          id,
          first_name,
          pid
        )
      `
      );

      if (selectedSurveyId) {
        query = query.eq("survey_id", selectedSurveyId);
      }
      if (pidFilter.trim()) {
        query = query.eq("user.pid", pidFilter.trim()); // filter by pid
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      setSurveyResponses(
        (data ?? []).map((response: any) => ({
          ...response,
          survey: Array.isArray(response.survey)
            ? response.survey[0]
            : response.survey,
          user: Array.isArray(response.user) ? response.user[0] : response.user,
        }))
      );
    };

    loadSurveyAndUser();
  }, [selectedSurveyId, pidFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Survey Dropdown */}
        <Select
          onValueChange={(val) =>
            setSelectedSurveyId(val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Survey" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Surveys</SelectItem>
            {surveys.map((survey) => (
              <SelectItem key={survey.id} value={survey.id}>
                {survey.title ?? "Untitled"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* PID Search */}
        <Input
          placeholder="Search by PID"
          value={pidFilter}
          onChange={(e) => setPidFilter(e.target.value)}
          className="w-[200px]"
        />

        <Button
          variant="outline"
          onClick={() => {
            setSelectedSurveyId(null);
            setPidFilter("");
          }}
        >
          Clear Filters
        </Button>
      </Card>

      {/* Results Table */}
      <Card className="p-4">
        <div className="flex justify-end mb-2">
          <p className="text-sm text-muted-foreground">
            Count: {surveyResponses.length}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Survey Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead>PID</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveyResponses.map((response) => (
              <TableRow
                key={response.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  navigate(
                    `/dashboard/admin-surveys/completed?surveyId=${response.survey?.id}&userId=${response.user?.id}`
                  );
                }}
              >
                <TableCell>{response.survey?.title}</TableCell>
                <TableCell>{response.survey?.type}</TableCell>
                <TableCell>{response.survey?.description}</TableCell>
                <TableCell>{response.user?.first_name}</TableCell>
                <TableCell>{response.user?.pid}</TableCell>
                <TableCell>
                  {new Date(response.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ViewAllSurveys;
{
  /* <SurveyPreview
        survey={survey}
        user={user}
        userId={alreadySubmitted ? undefined : userId}
        onSuccess={handleSuccess}
      /> */
}
