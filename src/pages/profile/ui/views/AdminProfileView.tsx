import {
  Calendar,
  Mail,
  UserIcon,
  Edit,
  Plus,
  FileText,
  Settings,
  CopyIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import { InfoCardTitle, InfoField } from "@/components/CardComponents";
import { User } from "@/types/user";
import EditUserButton from "@/components/EditUserButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ActivityStatsCards from "../components/ActivityStatsCards";
import { useState, useEffect } from "react";
import NewSurveyDialog from "@/pages/dashboard/ui/components/NewSurveyDialog";
import CustomSelect from "@/components/CustomSelect";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface AdminProfileViewProps {
  userData: User;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const AdminProfileView = ({ userData }: AdminProfileViewProps) => {
  const navigate = useNavigate();

  const [showNewSurveyDialog, setShowNewSurveyDialog] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const [loadingSurveys, setLoadingSurveys] = useState(false);

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

  const handleSurveyCreated = (surveyId: string) => {
    navigate(`/survey/${surveyId}`);
  };

  const handleEditSurvey = () => {
    if (selectedSurveyId) {
      navigate(`/survey/${selectedSurveyId}`);
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

  return (
    <>
      <NewSurveyDialog
        open={showNewSurveyDialog}
        onOpenChange={setShowNewSurveyDialog}
        onSurveyCreated={handleSurveyCreated}
      />

      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Basic Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="grid md:grid-cols-3 lg:grid-cols-1 gap-6">
              <Card className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <UserAvatar
                    firstName={userData.firstName}
                    avatarUrl={userData.avatarUrl}
                    size="xl"
                  />
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {userData.firstName} {userData.lastName}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      pid: {userData.pid}
                    </p>
                    <div className="flex flex-row items-center gap-2">
                      <RoleBadge role={userData.role} />
                      <StatusBadge status={userData.status} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Basic Information */}
              <Card className="py-3 col-span-2 hidden md:block lg:hidden">
                <div className="flex items-center justify-between pr-4">
                  <InfoCardTitle title="Details" icon={UserIcon} />
                  <EditUserButton user={userData} />
                </div>
                <CardContent className="flex flex-col gap-4">
                  <InfoField
                    label="Email"
                    value={
                      userData.email.includes("@anonymous.com")
                        ? "Anonymous"
                        : userData.email
                    }
                    icon={Mail}
                  />
                  <InfoField
                    label="Joined"
                    value={new Date(userData.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                    icon={Calendar}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Content - Detailed Information */}
          <div className="lg:col-span-3 gap-y-6 flex flex-col">
            {/* Basic Information */}
            <Card className="py-3 md:hidden lg:block">
              <div className="flex items-center justify-between pr-4">
                <InfoCardTitle title="Details" icon={UserIcon} />
                <EditUserButton user={userData} />
              </div>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField
                  label="Email"
                  value={
                    userData.email.includes("@anonymous.com")
                      ? "Anonymous"
                      : userData.email
                  }
                  icon={Mail}
                />
                <InfoField
                  label="Joined"
                  value={new Date(userData.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                  icon={Calendar}
                />
              </CardContent>
            </Card>

            {/* Admin Actions Panel */}
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
                        onClick={() => navigate("/consent")}
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
                            value={selectedSurveyId}
                            onValueChange={setSelectedSurveyId}
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
                          disabled={!selectedSurveyId}
                          variant={`${selectedSurveyId ? "default" : "outline"}`}
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

            <ActivityStatsCards user={userData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfileView;
