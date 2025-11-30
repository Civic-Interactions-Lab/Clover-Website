import { useState } from "react";
import { UserMode, UserRole } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomTooltip } from "@/components/CustomTooltip";
import StatCard from "@/components/StatCard";
import SuggestionTable from "@/pages/dashboard/ui/components/SuggestionTable";
import CollapsibleChartSection from "@/components/CollapsibleChartSection";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";
import Loading from "@/components/Loading";
import NoData from "@/components/NoData";
import AccuracyPieChart from "./AccuracyPieChart";
import DecisionLineChart from "./DecisionLineChart";
import AccuracyDistributionBarChart from "./AccuracyDistributionBarChart";
import ResponseTimeBarChart from "./ResponseTimeBarChart";
import AccuracyTimeLineChart from "./AccuracyTimeLineChart";
import LearningProgressChart from "./LearningProgressChart";
import ResponseTimeLineChart from "./ResponseTimeLineChart";
import MinuteDecisionChart from "./MinuteDecisionChart";
import { UserActivityLogItem } from "@/types/suggestion.ts";

interface ActivityStatsSectionProps {
  userActivity: any[];
  progressData: {
    totalInteractions: number;
    correctSuggestions: number;
    accuracyPercentage: number;
    totalAccepted: number;
    totalRejected: number;
  };
  loading: boolean;

  // Context props
  userMode?: UserMode;
  userName?: string;
  role?: UserRole;
  selectedClassTitle?: string;

  showRealtimeToggle?: boolean;
  showLearningProgress?: boolean;
  onRealtimeToggle?: (enabled: boolean) => void;

  // For instructor views, they might have additional data
  allActivity?: any[];
  classActivity?: any[];
  classId?: string;

  onSuggestionClick?: (
    logItem: UserActivityLogItem,
    index: number,
    allLogItems: UserActivityLogItem[],
  ) => void;
}

const ActivityStatsSection = ({
  userActivity,
  progressData,
  loading,
  userMode,
  userName,
  role = UserRole.STUDENT,
  selectedClassTitle,
  showRealtimeToggle = true,
  showLearningProgress = true,
  onRealtimeToggle,
  allActivity,
  classActivity,
  classId,
  onSuggestionClick,
}: ActivityStatsSectionProps) => {
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  const [pieChartData, setPieChartData] = useState<{
    mode: "total" | "accepted" | "rejected";
    statData: {
      total: number;
      correct: number;
      accuracy: number;
      title: string;
    };
  } | null>(null);

  const handleRealtimeToggle = (enabled: boolean) => {
    setIsRealtimeEnabled(enabled);
    onRealtimeToggle?.(enabled);
  };

  const statData = pieChartData?.statData || {
    total: progressData.totalInteractions,
    correct: progressData.correctSuggestions,
    accuracy:
      progressData.totalInteractions > 0
        ? (progressData.correctSuggestions / progressData.totalInteractions) *
          100
        : 0,
    title: "Total",
  };

  const currentMode = pieChartData?.mode || "total";

  // Determine which data to use for charts based on role and selection
  const getChartData = () => {
    if (role === UserRole.INSTRUCTOR && classId === "all" && allActivity) {
      return allActivity;
    }
    if (role === UserRole.INSTRUCTOR && classActivity) {
      return classActivity;
    }
    return userActivity;
  };

  const getResponseTimeData = () => {
    if (role === UserRole.INSTRUCTOR && allActivity) {
      return allActivity;
    }
    return userActivity;
  };

  const chartData = getChartData();
  const responseTimeData = getResponseTimeData();

  const filteredLogItems = userActivity.filter(
    (logItem) =>
      ACCEPT_EVENTS.includes(logItem.event) ||
      REJECT_EVENTS.includes(logItem.event),
  );

  const sortedLogItems = filteredLogItems.sort(
    (a, b) =>
      new Date(b.createdAt || b.createdAt).getTime() -
      new Date(a.createdAt || a.createdAt).getTime(),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading activity data..." />
      </div>
    );
  }

  // Show no data state if there are no interactions
  if (progressData.totalInteractions === 0) {
    return (
      <Card className="p-6">
        <NoData role={role} userName={userName} />
      </Card>
    );
  }

  // Get tooltip content based on role
  const getTooltipContent = (type: "total" | "correct" | "accuracy") => {
    const context =
      role === UserRole.INSTRUCTOR
        ? `across ${classId === "all" ? "all classes" : selectedClassTitle || "selected class"}`
        : "";

    switch (type) {
      case "total":
        return `Total ${currentMode === "total" ? "interactions with " : currentMode} suggestions${context}.`;
      case "correct":
        return `Number of ${currentMode} suggestions that were correct.`;
      case "accuracy":
        return `Accuracy rate for ${currentMode} suggestions.`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard
          title={statData.title}
          value={statData.total}
          tooltipContent={getTooltipContent("total")}
        />
        <StatCard
          title="Correct"
          value={statData.correct}
          tooltipContent={getTooltipContent("correct")}
        />
        <StatCard
          title="Accuracy"
          value={`${statData.accuracy.toFixed(1)}%`}
          tooltipContent={getTooltipContent("accuracy")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <AccuracyPieChart
          progressData={progressData}
          onDataChange={setPieChartData}
        />
        <DecisionLineChart activities={chartData} />
      </div>

      {/* Accuracy Distribution Chart */}
      <CollapsibleChartSection
        title="Accuracy Distribution"
        defaultExpanded={false}
      >
        <AccuracyDistributionBarChart activities={chartData} />
      </CollapsibleChartSection>

      {/* Second Row Charts */}
      <CollapsibleChartSection
        title="Response Time & Accuracy Over Time"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ResponseTimeBarChart
            userActivity={responseTimeData}
            title="Average Response Time"
          />
          <AccuracyTimeLineChart userActivity={responseTimeData} />
        </div>
      </CollapsibleChartSection>

      {/* Decisions Per Minute */}
      <CollapsibleChartSection
        title="Decisions Per Minute"
        defaultExpanded={false}
      >
        <MinuteDecisionChart
          activities={chartData}
          title="Decisions Per Minute"
        />
      </CollapsibleChartSection>

      {/* Learning Progress Chart - conditionally shown */}
      {showLearningProgress && role === UserRole.STUDENT && (
        <CollapsibleChartSection
          title="Learning Progress"
          defaultExpanded={false}
        >
          <LearningProgressChart
            userActivity={userActivity}
            windowSize={20}
            title="Learning Progress"
          />
        </CollapsibleChartSection>
      )}

      {/* Response Time Trends */}
      <CollapsibleChartSection
        title="Response Time Trends"
        defaultExpanded={false}
      >
        <ResponseTimeLineChart
          userActivity={responseTimeData}
          title="Response Time Trends"
        />
      </CollapsibleChartSection>

      {/* Activity Table */}
      <Card className="p-6">
        <div className="flex items-center mb-3 gap-3 justify-between">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-[#50B498]">
                {role === UserRole.INSTRUCTOR
                  ? "Class Activity Table"
                  : "User Activity Table"}
              </h2>
            }
            children={
              <div className="space-y-2">
                <p className="text-sm">
                  This table shows recent interactions with code suggestions.
                </p>
                <p className="text-xs text-muted-foreground">
                  Click on any row to view detailed suggestion information.
                </p>
              </div>
            }
          />
          {showRealtimeToggle && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="realtime-switch">Realtime Updates</Label>
              <Switch
                id="realtime-switch"
                checked={isRealtimeEnabled}
                onCheckedChange={handleRealtimeToggle}
              />
            </div>
          )}
        </div>
        <SuggestionTable
          logItems={sortedLogItems}
          mode={userMode as UserMode}
          defaultItemsPerPage={10}
          onRowClick={onSuggestionClick}
        />
      </Card>
    </div>
  );
};

export default ActivityStatsSection;
