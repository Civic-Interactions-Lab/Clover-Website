import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient.ts";
import { User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomSelect from "@/components/CustomSelect";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Keyboard,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Clock,
  Hash,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  CodeXml,
  SkipForward,
  SkipBack,
  Bot,
  RefreshCw,
  Loader2,
  MousePointer,
  Copy,
  Clipboard,
} from "lucide-react";

type LogEventData = {
  id: string;
  client_timestamp: number;
  snapshot: string;
  line_suggestion_id: string | null;
  user_id: string;
  event: string;
  line_suggestions?: {
    id: string;
    correct_line: string | null;
    incorrect_line: string | null;
    shown_bug: boolean | null;
  } | null;
};

type TimelineEvent = {
  id: string;
  timestamp: number; // bigint ms
  type: "typing" | "suggestion_event" | "other";
  content: string;
  event: string;
  suggestionData?: {
    correctLine: string | null;
    incorrectLine: string | null;
    shownBug: boolean | null;
  };
};

interface TypingLogsProps {
  userId: string;
}

const focusEvents = [
  "TYPED",
  "SUGGESTION_SHOWN",
  "SUGGESTION_TAB_CLICKED",
  "RUN",
  "SUGGESTION_GENERATED",
  "MOUSE_CLICKED",
  "MOUSE_SELECTED",
  "COPIED",
  "PASTED",
  "SUGGESTION_REQUESTED",
  "SUGGESTION_RECEIVED",
  "SUGGESTION_FETCHED",
  "SUGGESTION_CACHED",
];

const eventSelectOptions = [
  { value: "SUGGESTION_SHOWN", label: "Suggestion Shown" },
  { value: "SUGGESTION_TAB_CLICKED", label: "Tab Accept" },
  { value: "RUN", label: "Run Command" },
  { value: "SUGGESTION_GENERATED", label: "Generated" },
  { value: "TYPED", label: "Typed" },
];

const TypingLogs = ({ userId }: TypingLogsProps) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [selectedEventType, setSelectedEventType] =
    useState<string>("SUGGESTION_SHOWN");

  const [totalRecordsFound, setTotalRecordsFound] = useState(0);
  const [fetchCancelled, setFetchCancelled] = useState(false);
  const [batchesFetched, setBatchesFetched] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) throw error;
        setCurrentUser(data as User);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      }
    };
    fetchUser();
  }, [userId]);

  const fetchLogs = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    setFetchCancelled(false);
    setTotalRecordsFound(0);
    setBatchesFetched(0);
    setLoadingProgress("Initializing...");

    try {
      const allLogs: LogEventData[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMoreData = true;
      let totalFetched = 0;

      while (hasMoreData && !fetchCancelled) {
        const currentBatch = Math.floor(from / batchSize) + 1;
        setBatchesFetched(currentBatch);
        setLoadingProgress(
          `Fetching batch ${currentBatch}... (${totalFetched.toLocaleString()} records so far)`,
        );

        const { data, error } = await supabase
          .from("log_event")
          .select(
            `
            id,
            client_timestamp,
            snapshot,
            line_suggestion_id,
            user_id,
            event,
            line_suggestions:line_suggestion_id (
              id,
              correct_line,
              incorrect_line,
              shown_bug
            )
          `,
          )
          .eq("user_id", userId)
          .in("event", focusEvents)
          .order("client_timestamp", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;

        const logs = data as unknown as LogEventData[];
        allLogs.push(...logs);
        totalFetched += logs.length;
        setTotalRecordsFound(totalFetched);

        hasMoreData = logs.length === batchSize;
        from += batchSize;

        if (hasMoreData) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      if (fetchCancelled) return;

      setLoadingProgress(
        `Processing ${totalFetched.toLocaleString()} records...`,
      );

      const timelineEvents: TimelineEvent[] = allLogs.map((log) => ({
        id: log.id,
        timestamp: log.client_timestamp,
        type:
          log.event === "TYPED"
            ? "typing"
            : log.event.startsWith("SUGGESTION")
              ? "suggestion_event"
              : "other",
        content: log.snapshot ?? "",
        event: log.event,
        suggestionData: log.line_suggestions
          ? {
              correctLine: log.line_suggestions.correct_line ?? null,
              incorrectLine: log.line_suggestions.incorrect_line ?? null,
              shownBug: log.line_suggestions.shown_bug ?? null,
            }
          : undefined,
      }));

      setTimeline(timelineEvents);
      setCurrentLogIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  };

  const cancelFetch = () => {
    setFetchCancelled(true);
    setLoading(false);
    setLoadingProgress("");
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeDifference = (currentIndex: number) => {
    if (currentIndex === 0) return "start";
    const diffMs =
      timeline[currentIndex].timestamp - timeline[currentIndex - 1].timestamp;
    if (diffMs < 1000) return `+${diffMs}ms`;
    if (diffMs < 60000) return `+${(diffMs / 1000).toFixed(1)}s`;
    if (diffMs < 3600000) return `+${(diffMs / 60000).toFixed(1)}m`;
    return `+${(diffMs / 3600000).toFixed(1)}h`;
  };

  const goToNextLog = () => {
    if (currentLogIndex < timeline.length - 1)
      setCurrentLogIndex(currentLogIndex + 1);
  };
  const goToPreviousLog = () => {
    if (currentLogIndex > 0) setCurrentLogIndex(currentLogIndex - 1);
  };
  const goToFirstLog = () => setCurrentLogIndex(0);
  const goToLastLog = () => setCurrentLogIndex(timeline.length - 1);

  const goToNextEventOfType = (eventType: string) => {
    const idx = timeline.findIndex(
      (e, i) => i > currentLogIndex && e.event === eventType,
    );
    if (idx !== -1) setCurrentLogIndex(idx);
  };

  const goToPreviousEventOfType = (eventType: string) => {
    for (let i = currentLogIndex - 1; i >= 0; i--) {
      if (timeline[i].event === eventType) {
        setCurrentLogIndex(i);
        return;
      }
    }
  };

  const hasNextEventOfType = (eventType: string) =>
    timeline.some((e, i) => i > currentLogIndex && e.event === eventType);

  const hasPreviousEventOfType = (eventType: string) =>
    timeline.some((e, i) => i < currentLogIndex && e.event === eventType);

  const formatSnapshot = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto border">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="text-slate-500 w-8 text-right pr-2 select-none flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-slate-100 whitespace-pre">{line || " "}</span>
          </div>
        ))}
      </div>
    );
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case "TYPED":
        return Keyboard;
      case "SUGGESTION_TAB_CLICKED":
        return CheckCircle;
      case "SUGGESTION_SHOWN":
        return Eye;
      case "SUGGESTION_GENERATED":
        return Bot;
      case "SUGGESTION_REQUESTED":
        return Bot;
      case "SUGGESTION_RECEIVED":
        return Bot;
      case "SUGGESTION_FETCHED":
        return Bot;
      case "SUGGESTION_CACHED":
        return Bot;
      case "RUN":
        return CodeXml;
      case "MOUSE_CLICKED":
      case "MOUSE_SELECTED":
        return MousePointer;
      case "COPIED":
        return Copy;
      case "PASTED":
        return Clipboard;
      default:
        return FileText;
    }
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case "SUGGESTION_TAB_CLICKED":
        return "border-green-200 dark:border-green-800";
      case "SUGGESTION_SHOWN":
        return "border-yellow-500 dark:border-yellow-300";
      case "SUGGESTION_GENERATED":
      case "SUGGESTION_REQUESTED":
      case "SUGGESTION_RECEIVED":
      case "SUGGESTION_FETCHED":
      case "SUGGESTION_CACHED":
        return "border-blue-200 dark:border-blue-800";
      case "RUN":
        return "border-purple-200 dark:border-purple-800";
      case "MOUSE_CLICKED":
      case "MOUSE_SELECTED":
        return "border-orange-200 dark:border-orange-800";
      case "COPIED":
      case "PASTED":
        return "border-pink-200 dark:border-pink-800";
      case "TYPED":
      default:
        return "border-gray-400 dark:border-gray-600";
    }
  };

  const getEventDisplayName = (event: string) => {
    const map: Record<string, string> = {
      TYPED: "Typed",
      SUGGESTION_TAB_CLICKED: "Tab Accept",
      SUGGESTION_SHOWN: "Suggestion Shown",
      SUGGESTION_GENERATED: "Generated",
      SUGGESTION_REQUESTED: "Requested",
      SUGGESTION_RECEIVED: "Received",
      SUGGESTION_FETCHED: "Fetched",
      SUGGESTION_CACHED: "Cached",
      RUN: "Run Command",
      MOUSE_CLICKED: "Mouse Click",
      MOUSE_SELECTED: "Mouse Select",
      COPIED: "Copied",
      PASTED: "Pasted",
    };
    return map[event] ?? event;
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (loading) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousLog();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextLog();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentLogIndex, timeline.length, loading]);

  if (!userId) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="size-5" />
            <p>No user ID provided. Please select a user to view logs.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <XCircle className="size-5" />
            <p>Error: {error}</p>
          </div>
          <button
            onClick={fetchLogs}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-3 pb-6 px-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Keyboard className="size-6 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-2xl font-bold">Event Timeline</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="size-4" />
              <span>
                {currentUser ? `PID: ${currentUser.pid}` : `ID: ${userId}`}
              </span>
              <span>•</span>
              <Hash className="size-4" />
              <span>{timeline.length.toLocaleString()} Events</span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="size-4" />
          <span className="hidden md:inline">Reload</span>
        </button>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Loading Event Logs
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-2">
                    {loadingProgress}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
                    <span>Batches: {batchesFetched}</span>
                    <span>•</span>
                    <span>Records: {totalRecordsFound.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={cancelFetch}
                    className="mt-3 text-sm underline text-blue-600 hover:text-blue-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {timeline.length === 0 && !loading ? (
          <div className="text-center py-12">
            <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No events found for this user.
            </p>
          </div>
        ) : timeline.length > 0 && !loading ? (
          <>
            {/* Navigation */}
            <Card className="bg-muted/40">
              <CardContent className="p-4 pt-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToFirstLog}
                      disabled={currentLogIndex === 0}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-primary/90"
                    >
                      <ChevronsLeft className="size-4" />
                      <span className="hidden sm:inline">First</span>
                    </button>
                    <button
                      onClick={goToPreviousLog}
                      disabled={currentLogIndex === 0}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-primary/90"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <div className="px-4 py-2 bg-background border rounded-lg text-sm font-medium min-w-fit">
                      {(currentLogIndex + 1).toLocaleString()} /{" "}
                      {timeline.length.toLocaleString()}
                    </div>
                    <button
                      onClick={goToNextLog}
                      disabled={currentLogIndex === timeline.length - 1}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-primary/90"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="size-4" />
                    </button>
                    <button
                      onClick={goToLastLog}
                      disabled={currentLogIndex === timeline.length - 1}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-primary/90"
                    >
                      <span className="hidden sm:inline">Last</span>
                      <ChevronsRight className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      <span>
                        {timeline[currentLogIndex] &&
                          formatTimestamp(timeline[currentLogIndex].timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      <span className="font-mono">
                        {getTimeDifference(currentLogIndex)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jump to event type */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        Jump to:
                      </span>
                      <CustomSelect
                        value={selectedEventType}
                        onValueChange={setSelectedEventType}
                        options={eventSelectOptions}
                        className="w-44"
                        placeholder="Select event"
                      />
                      <button
                        onClick={() =>
                          goToPreviousEventOfType(selectedEventType)
                        }
                        disabled={!hasPreviousEventOfType(selectedEventType)}
                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-secondary/90"
                      >
                        <SkipBack className="size-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>
                      <button
                        onClick={() => goToNextEventOfType(selectedEventType)}
                        disabled={!hasNextEventOfType(selectedEventType)}
                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center gap-2 hover:bg-secondary/90"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <SkipForward className="size-4" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {getEventDisplayName(selectedEventType)}:
                      </span>
                      <span className="ml-1">
                        {
                          timeline.filter((e) => e.event === selectedEventType)
                            .length
                        }{" "}
                        events
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current event */}
            {timeline[currentLogIndex] && (
              <Card
                className={`overflow-hidden border-2 ${getEventColor(timeline[currentLogIndex].event)}`}
              >
                <CardHeader className="pb-4 pt-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg flex-shrink-0">
                      {React.createElement(
                        getEventIcon(timeline[currentLogIndex].event),
                        { className: "size-5 text-primary" },
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl">
                        {getEventDisplayName(timeline[currentLogIndex].event)}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground font-mono">
                        {timeline[currentLogIndex].event}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Snapshot */}
                  {timeline[currentLogIndex].content ? (
                    formatSnapshot(timeline[currentLogIndex].content)
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No snapshot recorded
                    </p>
                  )}

                  {/* Suggestion details */}
                  {timeline[currentLogIndex].suggestionData && (
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-3 pt-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="size-5 text-primary" />
                          Suggestion Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(() => {
                          const s = timeline[currentLogIndex].suggestionData!;
                          const isShown =
                            timeline[currentLogIndex].event ===
                            "SUGGESTION_SHOWN";
                          const isAccept =
                            timeline[currentLogIndex].event ===
                            "SUGGESTION_TAB_CLICKED";
                          const userSawBug = s.shownBug === true;
                          const userSawCorrect = s.shownBug === false;

                          return (
                            <>
                              {s.correctLine && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Correct Line:
                                    </span>
                                    {userSawCorrect && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full flex items-center gap-1">
                                        <Eye className="size-3" /> USER SAW THIS
                                      </span>
                                    )}
                                    {isAccept && userSawCorrect && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full flex items-center gap-1">
                                        <CheckCircle className="size-3" />{" "}
                                        ACCEPTED
                                      </span>
                                    )}
                                  </div>
                                  <code
                                    className={`block px-3 py-2 text-sm font-mono rounded-lg border ${userSawBug ? "bg-gray-50 dark:bg-gray-950 border-gray-300 text-gray-500" : userSawCorrect ? "bg-green-50 dark:bg-green-950 border-green-300 ring-2 ring-green-200" : "bg-green-50 dark:bg-green-950 border-green-300"}`}
                                  >
                                    {s.correctLine}
                                  </code>
                                </div>
                              )}
                              {s.incorrectLine && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      Incorrect Line (Bug):
                                    </span>
                                    {userSawBug && (
                                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full flex items-center gap-1">
                                        <Eye className="size-3" /> USER SAW THIS
                                      </span>
                                    )}
                                    {isAccept && userSawBug && (
                                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full flex items-center gap-1">
                                        <AlertTriangle className="size-3" />{" "}
                                        ACCEPTED (BUG)
                                      </span>
                                    )}
                                  </div>
                                  <code
                                    className={`block px-3 py-2 text-sm font-mono rounded-lg border ${userSawCorrect ? "bg-gray-50 dark:bg-gray-950 border-gray-300 text-gray-500" : userSawBug ? "bg-red-50 dark:bg-red-950 border-red-300 ring-2 ring-red-200" : "bg-red-50 dark:bg-red-950 border-red-300"}`}
                                  >
                                    {s.incorrectLine}
                                  </code>
                                </div>
                              )}
                              {!s.correctLine && !s.incorrectLine && (
                                <div className="bg-muted border rounded-lg p-3 text-sm text-muted-foreground flex items-center gap-2">
                                  <AlertTriangle className="size-4" />
                                  No suggestion line content in database.
                                </div>
                              )}
                              {s.shownBug !== null && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Bug Shown:
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${s.shownBug ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"}`}
                                  >
                                    {s.shownBug ? (
                                      <>
                                        <XCircle className="size-3" /> Yes
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="size-3" /> No
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TypingLogs;
