import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { supabase } from "@/supabaseClient";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

interface TypingLogsDownloadButtonProps {
  userId: string;
  user: User | null;
}

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
    bug_percentage: number | null;
    line_suggestions_group?: {
      filename: string | null;
      language: string | null;
    } | null;
  } | null;
};

type TerminalLogData = {
  id: string;
  start_time: string;
  end_time: string;
  output: string;
  user_id: string;
};

const TypingLogsDownloadButton = ({
  userId,
  user,
}: TypingLogsDownloadButtonProps) => {
  const [typingData, setTypingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const focusEvents = [
    "TYPING",
    "SUGGESTION_SHOWN",
    "SUGGESTION_TAB_ACCEPT",
    "RUN",
    "SUGGESTION_LINE_REJECT",
    "SUGGESTION_GENERATE",
  ];

  // Function to find matching terminal output for a given timestamp
  const findMatchingTerminalOutput = (
    eventTimestamp: string,
    terminalLogs: TerminalLogData[],
  ): string | null => {
    const eventTime = new Date(eventTimestamp).getTime();

    for (const terminalLog of terminalLogs) {
      const startTime = new Date(terminalLog.start_time).getTime();
      const endTime = new Date(terminalLog.end_time).getTime();

      if (eventTime >= startTime && eventTime <= endTime) {
        return terminalLog.output;
      }
    }

    return null;
  };

  useEffect(() => {
    const fetchTypingData = async () => {
      if (!userId) return;

      setLoading(true);

      try {
        // First, fetch terminal logs for the user
        const { data: terminalLogsData, error: terminalLogsError } =
          await supabase
            .from("terminal_logs")
            .select("id, start_time, end_time, output, user_id")
            .eq("user_id", userId)
            .order("start_time", { ascending: true });

        if (terminalLogsError) {
          throw terminalLogsError;
        }

        const terminalLogs = terminalLogsData as TerminalLogData[];

        // Then fetch typing logs
        const allLogs: TypingLogData[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMoreData = true;

        while (hasMoreData) {
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
                shown_bug,
                bug_percentage,
                line_suggestions_group:group_id (
                  filename,
                  language
                )
              )
            `,
            )
            .eq("user_id", userId)
            .in("event", focusEvents)
            .order("created_at", { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) {
            throw error;
          }

          const logs = data as unknown as TypingLogData[];
          allLogs.push(...logs);

          hasMoreData = logs.length === batchSize;
          from += batchSize;

          if (hasMoreData) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        const formattedData =
          allLogs?.map((log, index) => {
            let timeDifference = 0;
            if (index > 0) {
              const currentTime = new Date(log.created_at).getTime();
              const previousTime = new Date(
                allLogs[index - 1].created_at,
              ).getTime();
              timeDifference = currentTime - previousTime;
            }

            // Find matching terminal output
            const terminalOutput = findMatchingTerminalOutput(
              log.created_at,
              terminalLogs,
            );

            return {
              "No.": index + 1,
              PID: user?.pid || "N/A",
              Username: user?.firstName || "N/A",
              Event: log.event,
              Timestamp: new Date(log.created_at).getTime(),
              "Time Difference (ms)": timeDifference,
              "Raw Text": log.raw_text.replace(/\n/g, "\\n"),
              "Correct Line": log.line_suggestions?.correct_line || "N/A",
              "Incorrect Line": log.line_suggestions?.incorrect_line || "N/A",
              "Bug Shown": log.line_suggestions?.shown_bug ?? "N/A",
              "Bug Percentage": log.line_suggestions?.bug_percentage ?? "N/A",
              Filename:
                log.line_suggestions?.line_suggestions_group?.filename || "N/A",
              Language:
                log.line_suggestions?.line_suggestions_group?.language || "N/A",
              "Terminal Output": terminalOutput
                ? terminalOutput.replace(/\n/g, "\\n")
                : "N/A",
            };
          }) || [];

        setTypingData(formattedData);
      } catch (err) {
        console.error("Error fetching typing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTypingData();
  }, [userId, user]);

  const filename = user?.pid
    ? `typing-logs-${user.firstName}-${user.pid}`
    : `typing-logs-${userId}`;

  return (
    <DownloadFormattedFile
      data={typingData}
      filename={filename}
      disabled={typingData.length === 0}
      loading={loading}
    />
  );
};

export default TypingLogsDownloadButton;
