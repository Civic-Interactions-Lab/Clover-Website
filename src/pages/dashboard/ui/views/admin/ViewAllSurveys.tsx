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
import { Card, CardContent } from "@/components/ui/card";
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
import { InfoCardTitle } from "@/components/CardComponents";
import { CopyIcon, Edit, FileText, Plus, Settings } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import CustomSelect from "@/components/CustomSelect";
import { toast } from "sonner";
import NewSurveyDialog from "../../components/NewSurveyDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
  const [selectedEditSurveyId, setSelectedEditSurveyId] = useState<string>("");
  const [pidFilter, setPidFilter] = useState<string>("");

  const [showNewSurveyDialog, setShowNewSurveyDialog] = useState(false);

  const [loadingSurveys, setLoadingSurveys] = useState(false);

  const navigate = useNavigate();

  // Fetch surveys on component mount
  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title, description, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSurveys(data || []);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoadingSurveys(false);
    }
  };

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

  const handleEditSurvey = () => {
    if (selectedEditSurveyId) {
      navigate(`/dashboard/admin-surveys/survey/${selectedEditSurveyId}`);
    }
  };

  const surveyOptions = surveys.map((survey) => ({
    value: survey.id,
    label: survey.title || "Untitled Survey",
  }));

  const handleCopyToClipboard = () => {
    if (!selectedSurveyId) return;
    navigator.clipboard.writeText(selectedSurveyId);
    toast.success("Copied to clipboard");
  };

  const handleSurveyCreated = (surveyId: string) => {
    navigate(`/dashboard/admin-surveys/survey/${surveyId}`);
  };

  return (
    <div className="space-y-4">
      <NewSurveyDialog
        open={showNewSurveyDialog}
        onOpenChange={setShowNewSurveyDialog}
        onSurveyCreated={handleSurveyCreated}
      />
      <Card>
        <InfoCardTitle title="Admin Controls" icon={Settings} />
        <CardContent className="space-y-6">
          {/* Consent Management Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <FileText className="h-4 w-4" />
              <h4 className="font-medium">Consent Management</h4>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h5 className="font-medium mb-1">Consent Forms</h5>
                  <p className="text-sm text-muted-foreground">
                    View and manage consent form templates
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/dashboard/admin-surveys/consent")}
                  className="shrink-0 w-full sm:w-32"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Consent
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-300 dark:bg-gray-700" />

          {/* Survey Management Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Edit className="h-4 w-4" />
              <h4 className="font-medium">Survey Management</h4>
            </div>

            {/* Create New Survey */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h5 className="font-medium mb-1">Create New Survey</h5>
                  <p className="text-sm text-muted-foreground">
                    Start building a new survey from scratch
                  </p>
                </div>
                <Button
                  onClick={() => setShowNewSurveyDialog(true)}
                  className="w-full sm:w-auto shrink-0"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Survey
                </Button>
              </div>
            </div>

            {/* Edit Existing Survey */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Edit Existing Survey
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Modify or update an existing survey
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
                  <div className="flex-1 space-y-2">
                    <CustomSelect
                      value={selectedEditSurveyId}
                      onValueChange={setSelectedEditSurveyId}
                      options={surveyOptions}
                      placeholder={
                        loadingSurveys
                          ? "Loading surveys..."
                          : surveys.length === 0
                            ? "No surveys available"
                            : "Choose a survey to edit"
                      }
                      className="w-full"
                      disabled={loadingSurveys || surveys.length === 0}
                    />
                    {selectedSurveyId && (
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {selectedSurveyId}
                        </p>

                        <CopyIcon
                          className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary"
                          onClick={handleCopyToClipboard}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleEditSurvey}
                    disabled={!selectedEditSurveyId}
                    variant={`${selectedEditSurveyId ? "default" : "outline"}`}
                    size="sm"
                    className="w-full sm:w-32 shrink-0 mb-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Survey
                  </Button>
                </div>

                {surveys.length === 0 && !loadingSurveys && (
                  <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    No surveys found. Create your first survey above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Filter Card */}

      {/* Results Table */}
      <Card className="p-4">
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center bg-background/80">
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
        <div className="flex justify-end mb-2 pt-3">
          <p className="text-sm text-muted-foreground">
            Count: {surveyResponses.length}
          </p>
        </div>
        <Separator />
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
