import {
  getUserDiffsByTime,
  RenderedStep,
  UserDiffsResponse,
} from "@/api/suggestion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FastForward,
  FileText,
  GitBranch,
  MessageSquare,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import { useParams } from "react-router-dom";

export default function DiffTimeline() {
  const { userId } = useParams<{ userId: string }>();
  const [diffs, setDiffs] = useState<UserDiffsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const fetchDiffs = async (
    startTime: string,
    startDate: string,
    endTime: string,
    endDate: string
  ) => {
    setLoading(true);
    setError(null);
    setHasQueried(true);

    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    const startDateTime = `${startDate}T${startTime}:00Z`;
    const endDateTime = `${endDate}T${endTime}:59Z`;
    const { data, error } = await getUserDiffsByTime(
      userId,
      startDateTime,
      endDateTime
    );

    if (error) {
      setError(error);
      console.error("Error fetching diffs:", error);
    } else if (data) {
      setDiffs(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading diffs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderContent() {
    if (loading) return null;

    if (!hasQueried) {
      return <EmptyState />;
    }

    if (error) {
      return <ErrorCard error={error} />;
    }

    if (!diffs || diffs.groups.length === 0) {
      return <NoDiffsCard />;
    }

    return <DiffViewerCard diffs={diffs} />;
  }

  const totalSteps =
    diffs?.groups.reduce((sum, g) => sum + g.steps.length, 0) ?? 0;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <DatePickerCard
          timelineLength={totalSteps}
          handleFetchDiffs={fetchDiffs}
        />
        {renderContent()}
      </div>
    </TooltipProvider>
  );
}

function StepLinesBadge({ step }: { step: RenderedStep }) {
  const total = step.lines?.length ?? 0;

  if (total === 0) {
    return (
      <Badge variant="outline" className="font-mono">
        0 lines
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant={total > 0 ? "secondary" : "outline"}
          className="cursor-pointer font-mono"
        >
          {total} lines
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="p-2 space-y-1 max-h-60 overflow-y-auto font-mono text-sm">
        {step.lines?.map((line: string, idx: number) => (
          <div key={idx} className={"text-blue-600"}>
            {line}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const DatePickerCard = ({
  handleFetchDiffs,
  timelineLength,
}: {
  timelineLength: number;
  handleFetchDiffs: (
    startTime: string,
    startDate: string,
    endTime: string,
    endDate: string
  ) => void;
}) => {
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const [startDate, setStartDate] = useState(
    oneYearAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");

  return (
    <Card className=" border-primary dark:border-primary">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Time Range Filter</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1 ">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 ">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 ">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-600"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            onClick={() =>
              handleFetchDiffs(startTime, startDate, endTime, endDate)
            }
          >
            Apply Filter
          </Button>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing {timelineLength} changes
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DiffControls = ({
  stepIndex,
  isPlaying,
  timelineLength,
  hasMoreBugs,
  handlePrevStep,
  handleNextStep,
  handlePlayPause,
  handleReset,
  handleFastForward,
}: {
  stepIndex: number;
  isPlaying: boolean;
  timelineLength: number;
  hasMoreBugs: boolean;
  handlePrevStep: () => void;
  handleNextStep: () => void;
  handlePlayPause: () => void;
  handleReset: () => void;
  handleFastForward: () => void;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={stepIndex === 0}
            onClick={handlePrevStep}
            className="hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Previous Step</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            className="hover:bg-green-50 dark:hover:bg-green-950"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isPlaying ? "Pause" : "Play"} Auto-advance{" "}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset to Start</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={stepIndex === timelineLength - 1}
            onClick={handleNextStep}
            className="hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Next Step</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasMoreBugs}
            onClick={handleFastForward}
            className="hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Skip to Next Bug</TooltipContent>
      </Tooltip>
    </div>
  );
};

const EmptyState = () => {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Select a date range and click <strong>Apply Filter</strong> to view
          diffs
        </p>
      </CardContent>
    </Card>
  );
};

const ErrorCard = ({ error }: { error: string }) => {
  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <p>Error: {error}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const NoDiffsCard = () => {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No diffs available for the selected time range
        </p>
      </CardContent>
    </Card>
  );
};

const DiffViewerCard = ({ diffs }: { diffs: UserDiffsResponse }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1000);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && diffs) {
      interval = setInterval(() => {
        setStepIndex((prev) => {
          const timeline = createTimeline(diffs);
          if (prev >= timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, diffs]);

  const createTimeline = (diffs: UserDiffsResponse | null) => {
    if (!diffs) return [];

    const all = [];
    let lastPrompt = null;

    for (const g of diffs.groups) {
      for (const s of g.steps) {
        const normalizedPrompt = g.prompt.trim();
        const resetFile =
          lastPrompt !== null && normalizedPrompt !== lastPrompt;

        all.push({
          groupId: g.groupId,
          step: s,
          prompt: normalizedPrompt,
          fileName: g.fileName,
          resetFile,
        });

        lastPrompt = normalizedPrompt;
      }
    }

    return all;
  };

  const timeline = useMemo(() => createTimeline(diffs), [diffs]);

  const currentItem = timeline[stepIndex] ?? null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrevStep = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    setStepIndex((i) => Math.min(i + 1, timeline.length - 1));
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleFastForward = () => {
    if (!timeline.length) return;

    const nextIndex = timeline.findIndex(
      (item, idx) => idx > stepIndex && item.step.shownBug
    );

    if (nextIndex !== -1) {
      setStepIndex(nextIndex);
    }

    setIsPlaying(false);
  };

  const { groupId, step, fileName, prompt } = currentItem;
  const [diff] = parseDiff(step.diff);
  console.log("Rendering step:", step.event);

  const hasFutureBug = timeline.some(
    (item, idx) => idx > stepIndex && item.step.shownBug
  );

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <span>Group {groupId}</span>
            </CardTitle>

            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrompt(!showPrompt)}
                className="h-auto p-0 font-normal text-left hover:bg-transparent group"
              >
                <div className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">
                    {showPrompt ? "Hide prompt" : "Show prompt"}
                  </span>
                  {showPrompt ? (
                    <ChevronUp className="w-4 h-4 group-hover:text-primary transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 group-hover:text-primary transition-colors" />
                  )}
                </div>
              </Button>

              {showPrompt && (
                <div className="animate-in slide-in-from-top-2 duration-200 ease-out">
                  <div className="bg-background/50 border border-primary rounded-md p-3 mt-2">
                    <pre className="text-sm font-medium overflow-w-auto whitespace-pre-wrap max-w-96">
                      {prompt}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
            >
              <FileText className="w-3 h-3 mr-1" />
              {fileName}
            </Badge>
            {step.createdAt && (
              <Badge
                variant="secondary"
                className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(step.createdAt)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-muted-foreground">
              {stepIndex + 1} of {timeline.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-white h-2 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${((stepIndex + 1) / timeline.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between mb-6 space-y-2">
          <DiffControls
            stepIndex={stepIndex}
            isPlaying={isPlaying}
            timelineLength={timeline.length}
            hasMoreBugs={hasFutureBug}
            handlePrevStep={handlePrevStep}
            handleNextStep={handleNextStep}
            handlePlayPause={handlePlayPause}
            handleReset={handleReset}
            handleFastForward={handleFastForward}
          />
          <div className="flex items-center space-x-4">
            <Badge
              className={`px-2 ${
                step.event === "SUGGESTION_LINE_ACCEPT"
                  ? "bg-primary text-black dark:text-white"
                  : step.event === "SUGGESTION_LINE_REJECT"
                    ? "bg-beta text-black dark:text-white"
                    : "bg-purple-900 text-white"
              }`}
              variant="secondary"
            >
              {step.event}
            </Badge>
            {step.shownBug && (
              <Badge variant="destructive" className="animate-pulse">
                Bug Detected
              </Badge>
            )}
            <StepLinesBadge step={step} />
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <p className="text-sm font-medium">Speed:</p>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPlaySpeed((speed) => Math.min(2000, speed + 100))}
            disabled={playSpeed >= 2000}
            className="hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="w-12 text-center font-mono">
            {(1000 / playSpeed).toFixed(1)}×
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setPlaySpeed((speed) => Math.max(100, speed - 100))}
            disabled={playSpeed <= 100}
            className="hover:bg-orange-50 dark:hover:bg-green-950"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Diff Display */}
        <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 overflow-hidden shadow-inner">
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Changes in {fileName}
            </p>
          </div>
          <Diff
            viewType="split"
            diffType={diff.type || "modify"}
            hunks={diff.hunks}
          >
            {(hunks) =>
              hunks.map((hunk, index) => <Hunk key={index} hunk={hunk} />)
            }
          </Diff>
        </div>
      </CardContent>
    </Card>
  );
};
