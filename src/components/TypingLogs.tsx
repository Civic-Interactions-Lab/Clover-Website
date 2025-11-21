import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

type TypingLogData = {
  id: string;
  created_at: string;
  raw_text: string;
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
  timestamp: string;
  type: "typing" | "suggestion_event";
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

const TypingLogs: React.FC<TypingLogsProps> = ({ userId }) => {
  const [typingLogs, setTypingLogs] = useState<TypingLogData[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation state
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  // Focus on these 5 events
  const focusEvents = [
    "SUGGESTION_TYPING",
    "SUGGESTION_SHOWN",
    "SUGGESTION_TAB_ACCEPT",
    "SUGGESTION_RUN",
    "SUGGESTION_LINE_REJECT",
  ];

  // Fetch user data based on passed userId
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (userError) {
          throw userError;
        }

        setCurrentUser(userData as User);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data",
        );
      }
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    const fetchTypingLogs = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("typing_log")
          .select(
            `
            id,
            created_at,
            raw_text,
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
          .order("created_at", { ascending: true });

        if (error) {
          throw error;
        }

        const logs = data as unknown as TypingLogData[];
        setTypingLogs(logs);

        // Process logs into timeline events
        const timelineEvents: TimelineEvent[] = logs.map((log) => ({
          id: log.id,
          timestamp: log.created_at,
          type:
            log.event === "SUGGESTION_TYPING" ? "typing" : "suggestion_event",
          content: log.raw_text,
          event: log.event || "SUGGESTION_TYPING", // Default to TYPING
          suggestionData: log.line_suggestions
            ? {
                correctLine: log.line_suggestions.correct_line || null,
                incorrectLine: log.line_suggestions.incorrect_line || null,
                shownBug: log.line_suggestions.shown_bug || null,
              }
            : undefined,
        }));

        setTimeline(timelineEvents);
      } catch (err) {
        console.error("Error fetching typing logs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch typing logs",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTypingLogs();
  }, [userId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Calculate time difference from previous event
  const getTimeDifference = (currentIndex: number) => {
    if (currentIndex === 0) return 0;

    const currentTime = new Date(timeline[currentIndex].timestamp).getTime();
    const previousTime = new Date(
      timeline[currentIndex - 1].timestamp,
    ).getTime();
    const diffMs = currentTime - previousTime;

    // Format the difference in a human-readable way
    if (diffMs < 1000) {
      return `+${diffMs}ms`;
    } else if (diffMs < 60000) {
      return `+${(diffMs / 1000).toFixed(1)}s`;
    } else if (diffMs < 3600000) {
      return `+${(diffMs / 60000).toFixed(1)}m`;
    } else {
      return `+${(diffMs / 3600000).toFixed(1)}h`;
    }
  };

  // Navigation functions
  const goToNextLog = () => {
    if (currentLogIndex < timeline.length - 1) {
      setCurrentLogIndex(currentLogIndex + 1);
    }
  };

  const goToPreviousLog = () => {
    if (currentLogIndex > 0) {
      setCurrentLogIndex(currentLogIndex - 1);
    }
  };

  const goToFirstLog = () => {
    setCurrentLogIndex(0);
  };

  const goToLastLog = () => {
    setCurrentLogIndex(timeline.length - 1);
  };

  // Format raw text with syntax highlighting and line numbers
  const formatRawText = (rawText: string) => {
    const lines = rawText.split("\n");
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
      case "SUGGESTION_TYPING":
        return Keyboard;
      case "SUGGESTION_TAB_ACCEPT":
        return CheckCircle;
      case "SUGGESTION_LINE_REJECT":
        return XCircle;
      case "SUGGESTION_SHOWN":
        return Eye;
      case "SUGGESTION_RUN":
        return CodeXml;
      default:
        return FileText;
    }
  };

  const getEventColor = (event: string) => {
    switch (event) {
      case "SUGGESTION_TAB_ACCEPT":
        return "border-green-200 dark:border-green-800";
      case "SUGGESTION_LINE_REJECT":
        return "border-red-200 dark:border-red-800";
      case "SUGGESTION_SHOWN":
        return "border-yellow-500 dark:border-yellow-300";
      case "SUGGESTION_RUN":
        return "border-purple-200 dark:border-purple-800";
      case "SUGGESTION_TYPING":
      default:
        return "border-gray-400 dark:border-gray-600";
    }
  };

  const getEventDisplayName = (event: string) => {
    switch (event) {
      case "SUGGESTION_TYPING":
        return "Typing";
      case "SUGGESTION_TAB_ACCEPT":
        return "Tab Accept";
      case "SUGGESTION_LINE_REJECT":
        return "Line Reject";
      case "SUGGESTION_SHOWN":
        return "Suggestion Shown";
      case "SUGGESTION_RUN":
        return "Run Command";
      default:
        return event.replace("SUGGESTION_", "").replace("_", " ");
    }
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPreviousLog();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNextLog();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentLogIndex, timeline.length]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">
            Loading typing logs...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card className="overflow-hidden border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-300">
            <AlertTriangle className="size-5" />
            <p>
              No user ID provided. Please select a user to view typing logs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <XCircle className="size-5" />
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-3 pb-6 px-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Keyboard className="size-6 text-primary" />
          </div>
          <div className="flex flex-col space-y-1">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Typing Timeline
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="size-4" />
              <span>
                {currentUser ? `PID: ${currentUser.pid}` : `ID: ${userId}`}
              </span>
              <span>•</span>
              <Hash className="size-4" />
              <span>{timeline.length} Events</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {timeline.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No typing logs found for this user.
            </p>
          </div>
        ) : (
          <>
            {/* Navigation Controls Card */}
            <Card className="bg-muted/40">
              <CardContent className="p-4 pt-0">
                {/* Mobile-first stacked layout */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Navigation Buttons - Responsive Grid */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToFirstLog}
                      disabled={currentLogIndex === 0}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-w-0"
                    >
                      <ChevronsLeft className="size-4" />
                      <span className="hidden sm:inline">First</span>
                    </button>
                    <button
                      onClick={goToPreviousLog}
                      disabled={currentLogIndex === 0}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-w-0"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <div className="flex items-center justify-center sm:justify-start lg:justify-center">
                      <div className="px-4 py-2 bg-background border rounded-lg text-sm font-medium min-w-fit">
                        {currentLogIndex + 1} / {timeline.length}
                      </div>
                    </div>
                    <button
                      onClick={goToNextLog}
                      disabled={currentLogIndex === timeline.length - 1}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-w-0"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="size-4" />
                    </button>
                    <button
                      onClick={goToLastLog}
                      disabled={currentLogIndex === timeline.length - 1}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors min-w-0"
                    >
                      <span className="hidden sm:inline">Last</span>
                      <ChevronsRight className="size-4" />
                    </button>
                  </div>

                  {/* Timestamp Info - Stacked on mobile, inline on larger screens */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="size-4 flex-shrink-0" />
                      <span className="truncate">
                        {timeline[currentLogIndex] &&
                          formatTimestamp(timeline[currentLogIndex].timestamp)}
                      </span>
                    </div>
                    {timeline[currentLogIndex] && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Clock className="size-4" />
                        <span className="font-mono">
                          {getTimeDifference(currentLogIndex)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Log Display */}
            {timeline[currentLogIndex] && (
              <Card
                className={`overflow-hidden border-2 ${getEventColor(timeline[currentLogIndex].event)}`}
              >
                <CardHeader className="pb-4 pt-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg flex-shrink-0">
                      {React.createElement(
                        getEventIcon(timeline[currentLogIndex].event),
                        {
                          className: "size-5 text-primary",
                        },
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl text-gray-900 dark:text-white">
                        {getEventDisplayName(timeline[currentLogIndex].event)}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground">
                        Event: {timeline[currentLogIndex].event}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Raw Text Content */}
                  {formatRawText(timeline[currentLogIndex].content)}

                  {/* Suggestion Details */}
                  {timeline[currentLogIndex].suggestionData && (
                    <Card className="bg-muted/40">
                      <CardHeader className="pb-3 pt-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="size-5 text-primary" />
                          Suggestion Details
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {timeline[currentLogIndex].suggestionData!
                          .correctLine && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Correct Line:
                              </span>
                              {timeline[currentLogIndex].event ===
                                "SUGGESTION_TAB_ACCEPT" &&
                                timeline[currentLogIndex].suggestionData!
                                  .shownBug === false && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full flex items-center gap-1">
                                    <CheckCircle className="size-3" />
                                    ACCEPTED
                                  </span>
                                )}
                              {timeline[currentLogIndex].event ===
                                "SUGGESTION_TAB_ACCEPT" &&
                                timeline[currentLogIndex].suggestionData!
                                  .shownBug === null && (
                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full flex items-center gap-1">
                                    <CheckCircle className="size-3" />
                                    ACCEPTED (assumed correct)
                                  </span>
                                )}
                            </div>
                            <code
                              className={`block px-3 py-2 text-sm font-mono rounded-lg border ${
                                timeline[currentLogIndex].event ===
                                  "SUGGESTION_TAB_ACCEPT" &&
                                (timeline[currentLogIndex].suggestionData!
                                  .shownBug === false ||
                                  timeline[currentLogIndex].suggestionData!
                                    .shownBug === null)
                                  ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 ring-2 ring-blue-200 dark:ring-blue-800"
                                  : "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                              }`}
                            >
                              {
                                timeline[currentLogIndex].suggestionData!
                                  .correctLine
                              }
                            </code>
                          </div>
                        )}

                        {timeline[currentLogIndex].suggestionData!
                          .incorrectLine && (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Incorrect Line (Bug):
                              </span>
                              {timeline[currentLogIndex].event ===
                                "SUGGESTION_TAB_ACCEPT" &&
                                timeline[currentLogIndex].suggestionData!
                                  .shownBug === true && (
                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-full flex items-center gap-1">
                                    <AlertTriangle className="size-3" />
                                    ACCEPTED (BUG)
                                  </span>
                                )}
                            </div>
                            <code
                              className={`block px-3 py-2 text-sm font-mono rounded-lg border ${
                                timeline[currentLogIndex].event ===
                                  "SUGGESTION_TAB_ACCEPT" &&
                                timeline[currentLogIndex].suggestionData!
                                  .shownBug === true
                                  ? "bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700 ring-2 ring-orange-200 dark:ring-orange-800"
                                  : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"
                              }`}
                            >
                              {
                                timeline[currentLogIndex].suggestionData!
                                  .incorrectLine
                              }
                            </code>
                          </div>
                        )}

                        {/* Show message if no line content available */}
                        {!timeline[currentLogIndex].suggestionData!
                          .correctLine &&
                          !timeline[currentLogIndex].suggestionData!
                            .incorrectLine && (
                            <div className="bg-muted border rounded-lg p-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4" />
                                <span className="font-medium">Note:</span>
                                <span>
                                  No suggestion line content available in
                                  database.
                                </span>
                              </div>
                            </div>
                          )}

                        {timeline[currentLogIndex].suggestionData!.shownBug !==
                          null && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Bug Shown to User:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                                timeline[currentLogIndex].suggestionData!
                                  .shownBug
                                  ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              }`}
                            >
                              {timeline[currentLogIndex].suggestionData!
                                .shownBug ? (
                                <>
                                  <XCircle className="size-3" />
                                  Yes
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="size-3" />
                                  No
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingLogs;
