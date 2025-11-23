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
  } | null;
};

const TypingLogsDownloadButton = ({
  userId,
  user,
}: TypingLogsDownloadButtonProps) => {
  const [typingData, setTypingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const focusEvents = [
    "SUGGESTION_TYPING",
    "SUGGESTION_SHOWN",
    "SUGGESTION_TAB_ACCEPT",
    "SUGGESTION_RUN",
    "SUGGESTION_LINE_REJECT",
  ];

  useEffect(() => {
    const fetchTypingData = async () => {
      if (!userId) return;

      setLoading(true);

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

        const formattedData =
          logs?.map((log, index) => {
            let timeDifference = 0;
            if (index > 0) {
              const currentTime = new Date(log.created_at).getTime();
              const previousTime = new Date(
                logs[index - 1].created_at,
              ).getTime();
              timeDifference = currentTime - previousTime;
            }

            return {
              "No.": index + 1,
              PID: user?.pid || "N/A",
              Username: user?.firstName || "N/A",
              Event: log.event,
              Timestamp: new Date(log.created_at).toLocaleString(),
              "Time Difference (ms)": timeDifference,
              "Raw Text": log.raw_text.replace(/\n/g, "\\n"),
              "Correct Line": log.line_suggestions?.correct_line || "N/A",
              "Incorrect Line": log.line_suggestions?.incorrect_line || "N/A",
              "Bug Shown": log.line_suggestions?.shown_bug ?? "N/A",
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
      disabled={loading || typingData.length === 0}
    />
  );
};

export default TypingLogsDownloadButton;
