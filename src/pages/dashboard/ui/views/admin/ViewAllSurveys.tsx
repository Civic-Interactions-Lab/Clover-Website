import { supabase } from "@/supabaseClient";
import { useState, useEffect } from "react";
import { SurveyAnswers } from "../../components/SurveyPreview";
import SurveyResult from "../../components/SurveyResult";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { BarChart3, Table2, Eye, FileText, AlertTriangle } from "lucide-react";
import CustomSelect from "@/components/CustomSelect.tsx";

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
  description?: string | null;
  type?: string | null;
  created_at?: string;
  questions?: any[];
};

interface SurveyResultData {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, any>;
  created_at: string;
}

const ViewAllSurveys = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all");
  const [pidFilter, setPidFilter] = useState<string>("");
  const [questionsMap, setQuestionsMap] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState("table");
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [resultResponses, setResultResponses] = useState<SurveyResultData[]>(
    [],
  );
  const [loadingResults, setLoadingResults] = useState(false);

  const navigate = useNavigate();

  // Fetch survey list for dropdown
  useEffect(() => {
    const loadSurveys = async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title, description, type, created_at");
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
      `,
      );

      if (selectedSurveyId !== "all") {
        query = query.eq("survey_id", selectedSurveyId);
      }
      if (pidFilter.trim()) {
        query = query.eq("user.pid", pidFilter.trim());
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
        })),
      );
    };

    loadSurveyAndUser();
  }, [selectedSurveyId, pidFilter]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (surveyResponses.length === 0) return;

      const surveyIds = [
        ...new Set(surveyResponses.map((r) => r.survey?.id).filter(Boolean)),
      ];

      const { data, error } = await supabase
        .from("survey_questions")
        .select("*")
        .in("survey_id", surveyIds)
        .order("question_number", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      const grouped = (data ?? []).reduce(
        (acc, question) => {
          if (!acc[question.survey_id]) {
            acc[question.survey_id] = [];
          }
          acc[question.survey_id].push(question);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      setQuestionsMap(grouped);
    };

    loadQuestions();
  }, [surveyResponses]);

  // Load full survey data for results view
  const loadSurveyForResults = async (surveyId: string) => {
    try {
      setLoadingResults(true);

      // Load survey details
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

      // Load all responses for this survey
      const { data: responsesData, error: responsesError } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", surveyId)
        .order("created_at", { ascending: false });

      if (responsesError) throw responsesError;

      setSelectedSurvey({ ...surveyData, questions: questionsData || [] });
      setResultResponses(responsesData || []);

      console.log("Survey Response", JSON.stringify(responsesData, null, 2));
    } catch (error) {
      console.error("Error loading survey for results:", error);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "results" && selectedSurveyId !== "all" && !selectedSurvey) {
      loadSurveyForResults(selectedSurveyId);
    }
  };

  const handleSurveySelection = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setSelectedSurvey(null); // Reset selected survey when changing filter
    if (surveyId !== "all" && activeTab === "results") {
      loadSurveyForResults(surveyId);
    }
  };

  const formatDataForDownload = () => {
    return surveyResponses.map((response, index) => {
      const surveyId = response.survey?.id;
      const questions = surveyId ? questionsMap[surveyId] || [] : [];

      const row: Record<string, any> = {
        "No.": index + 1,
        "User Name": response.user?.first_name || "N/A",
        PID: response.user?.pid || "N/A",
        "Survey Type": response.survey?.type || "N/A",
        "Survey Title": response.survey?.title || "N/A",
      };

      questions.forEach((question) => {
        const questionId = question.id;
        const answer = response.answers?.[questionId];

        if (answer === null || answer === undefined) {
          row[question.question_text] = "No Answer";
        } else if (typeof answer === "object" && answer !== null) {
          const values = Object.values(answer);
          row[question.question_text] =
            values.length > 0 ? values[0] : "No Answer";
        } else {
          row[question.question_text] = answer;
        }
      });

      return row;
    });
  };

  const getDownloadFilename = () => {
    const surveyType = surveyResponses[0]?.survey?.type || "all-surveys";
    const date = new Date().toISOString().split("T")[0];
    return `survey-responses-${surveyType}-${date}`;
  };

  const renderResultsTab = () => {
    if (selectedSurveyId === "all") {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a Survey</h2>
            <p className="text-muted-foreground">
              Please select a survey from the dropdown to view its results and
              analytics.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (loadingResults) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p>Loading survey results...</p>
          </div>
        </div>
      );
    }

    if (!selectedSurvey) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
            <p className="text-muted-foreground">
              Could not load the selected survey. Please try again.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (resultResponses.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Responses Yet</h2>
            <p className="text-muted-foreground">
              This survey hasn't received any responses yet. Results will appear
              here once participants start submitting their responses.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <SurveyResult
        survey={selectedSurvey as any}
        responses={resultResponses}
        className="max-w-none"
      />
    );
  };

  const surveyOptions = [
    { value: "all", label: "All Surveys" },
    ...surveys.map((survey) => ({
      value: survey.id,
      label: survey.title ?? "Untitled",
    })),
  ];

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6 space-x-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              <span className="hidden lg:block">Responses Table</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden lg:block">Analytics & Charts</span>
            </TabsTrigger>
          </TabsList>

          {/* Download Button - only show on table tab */}
          {activeTab === "table" && (
            <DownloadFormattedFile
              data={formatDataForDownload()}
              filename={getDownloadFilename()}
            />
          )}
        </div>

        {/* Filter Controls */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center mb-6">
          <CustomSelect
            value={selectedSurveyId}
            onValueChange={handleSurveySelection}
            options={surveyOptions}
            placeholder="Filter by Survey"
            className="w-[250px]"
          />

          {/* PID Search - only show on table tab */}
          {activeTab === "table" && (
            <>
              <Input
                placeholder="Search by PID"
                value={pidFilter}
                onChange={(e) => setPidFilter(e.target.value)}
                className="w-[200px]"
              />

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSurveyId("all");
                  setPidFilter("");
                  setSelectedSurvey(null);
                }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </Card>

        <TabsContent value="table" className="mt-0">
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveyResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>{response.survey?.title}</TableCell>
                    <TableCell>{response.survey?.type}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {response.survey?.description}
                    </TableCell>
                    <TableCell>{response.user?.first_name}</TableCell>
                    <TableCell>{response.user?.pid}</TableCell>
                    <TableCell>
                      {new Date(response.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate(
                            `/dashboard/admin-surveys/completed?surveyId=${response.survey?.id}&userId=${response.user?.id}`,
                          );
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {surveyResponses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No survey responses found with the current filters.
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          {renderResultsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ViewAllSurveys;
