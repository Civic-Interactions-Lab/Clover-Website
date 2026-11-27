import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { getUserTypingExport, type TerminalLogExport, type TypingLogExport } from "@/api/logs";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

interface TypingLogsDownloadButtonProps {
  userId: string;
  user: User | null;
}

const TypingLogsDownloadButton = ({
  userId,
  user,
}: TypingLogsDownloadButtonProps) => {
  const [typingData, setTypingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to find matching terminal output for a given timestamp
  const findMatchingTerminalOutput = (
    eventTimestamp: string,
    terminalLogs: TerminalLogExport[],
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
        const { typingLogs, terminalLogs: terminalData, error } =
          await getUserTypingExport(userId);
        if (error) throw new Error(error);
        const allLogs: TypingLogExport[] = typingLogs ?? [];
        const terminalLogs = terminalData ?? [];

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
