import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { getClassTypingExport, type TypingLogExport } from "@/api/logs";
import { useEffect, useState } from "react";

interface ClassTypingLogsDownloadButtonProps {
  classId: string;
  className?: string;
}

const ClassTypingLogsDownloadButton = ({
  classId,
  className,
}: ClassTypingLogsDownloadButtonProps) => {
  const [typingData, setTypingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClassTypingData = async () => {
      if (!classId) {
        return;
      }

      setLoading(true);

      try {
        const { typingLogs, error } = await getClassTypingExport(classId);
        if (error) throw new Error(error);
        const logs: TypingLogExport[] = typingLogs ?? [];
        let currentUserId = "";
        let userRowNumber = 1;
        let previousTimestamp: number | null = null;
        const allFormattedData = logs.map((log) => {
          if (log.user_id !== currentUserId) {
            currentUserId = log.user_id;
            userRowNumber = 1;
            previousTimestamp = null;
          }
          const timestamp = new Date(log.created_at).getTime();
          const timeDifference = previousTimestamp === null ? 0 : timestamp - previousTimestamp;
          previousTimestamp = timestamp;

          return {
            "No.": userRowNumber++,
            "User ID": log.user_id,
            PID: log.user?.pid || "N/A",
            Username: log.user?.first_name || "N/A",
            "Last Name": log.user?.last_name || "N/A",
            Email: log.user?.email || "N/A",
            Event: log.event,
            Timestamp: timestamp,
            "Time Difference (ms)": timeDifference,
            "Raw Text": log.raw_text.replace(/\n/g, "\\n"),
            "Correct Line": log.line_suggestions?.correct_line || "N/A",
            "Incorrect Line": log.line_suggestions?.incorrect_line || "N/A",
            "Bug Shown": log.line_suggestions?.shown_bug ?? "N/A",
            "Bug Percentage": log.line_suggestions?.bug_percentage ?? "N/A",
            Filename: log.line_suggestions?.line_suggestions_group?.filename || "N/A",
            Language: log.line_suggestions?.line_suggestions_group?.language || "N/A",
          };
        });

        setTypingData(allFormattedData);
      } catch (err) {
        console.error("Error fetching class typing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassTypingData();
  }, [classId]);

  const filename = className
    ? `class-typing-logs-${className.replace(/\s+/g, "-")}`
    : `class-typing-logs-${classId}`;

  return (
    <div className="space-y-2">
      <DownloadFormattedFile
        data={typingData}
        filename={filename}
        disabled={typingData.length === 0}
        loading={loading}
      />
    </div>
  );
};

export default ClassTypingLogsDownloadButton;
