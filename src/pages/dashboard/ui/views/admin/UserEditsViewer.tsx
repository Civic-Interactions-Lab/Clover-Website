import {
  getUserDiffsByTime,
  RenderedStep,
  UserDiffsResponse,
} from "@/api/suggestion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/context/UserContext";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  GitBranch,
  MessageSquare,
  Pause,
  Play,
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
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [showPrompt, setShowPrompt] = useState(false);

  const [startDate, setStartDate] = useState("2025-09-01");
  const [endDate, setEndDate] = useState("2025-09-04");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");

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
  }, [isPlaying, playSpeed, diffs]);

  const fetchDiffs = async () => {
    setLoading(true);
    setError(null);

    const startDateTime = `${startDate}T${startTime}:00Z`;
    const endDateTime = `${endDate}T${endTime}:59Z`;
    console.log(userId);
    const { data, error } = await getUserDiffsByTime(
      userId || "",
      startDateTime,
      endDateTime
    );

    if (error) {
      setError(error);
      console.error("Error fetching diffs:", error);
    } else if (data) {
      setDiffs(data);
      setStepIndex(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiffs();
  }, []);

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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (timeline.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No diffs available for the selected time range
          </p>
          <Button onClick={fetchDiffs} className="mt-4">
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentItem = timeline[stepIndex];
  const { groupId, step, fileName, prompt } = currentItem;
  const [diff] = parseDiff(step.diff);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        {/* Time Range Controls */}
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
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
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
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 ">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button onClick={fetchDiffs}>Apply Filter</Button>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Showing {timeline.length} changes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 ">
          <CardHeader className="">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
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

            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
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
                    {isPlaying ? "Pause" : "Play"} Auto-advance
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
                      disabled={stepIndex === timeline.length - 1}
                      onClick={handleNextStep}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Step</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-4">
                <Badge
                  className={`${
                    step.event === "file_edit"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
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
                <Badge variant="outline" className="font-mono">
                  {step.lines} lines
                </Badge>
              </div>
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
      </div>
    </TooltipProvider>
  );
}
