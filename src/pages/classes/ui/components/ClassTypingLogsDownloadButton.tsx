import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { supabase } from "@/lib/supabaseClient.ts";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

interface ClassTypingLogsDownloadButtonProps {
  classId: string;
  className?: string;
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

type ClassUser = {
  student_id: string;
  users: User;
};

const ClassTypingLogsDownloadButton = ({
  classId,
  className,
}: ClassTypingLogsDownloadButtonProps) => {
  const [typingData, setTypingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);

  const focusEvents = [
    "TYPING",
    "SUGGESTION_SHOWN",
    "SUGGESTION_TAB_ACCEPT",
    "RUN",
    "SUGGESTION_LINE_REJECT",
    "SUGGESTION_GENERATE",
  ];

  useEffect(() => {
    const fetchClassTypingData = async () => {
      if (!classId) {
        return;
      }

      setLoading(true);

      try {
        const { data: classUsers, error: classError } = await supabase
          .from("user_class")
          .select(
            `
            student_id,
            users:student_id (
              id,
              first_name,
              last_name,
              pid,
              email
            )
          `,
          )
          .eq("class_id", classId);

        if (classError) {
          throw classError;
        }

        const users = classUsers as unknown as ClassUser[];
        setUserCount(users.length);

        if (users.length === 0) {
          setTypingData([]);
          return;
        }

        const allFormattedData: any[] = [];

        for (const classUser of users) {
          const userId = classUser.student_id;
          const user = classUser.users;

          const userLogs: TypingLogData[] = [];
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
            userLogs.push(...logs);

            hasMoreData = logs.length === batchSize;
            from += batchSize;

            if (hasMoreData) {
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }

          userLogs.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );

          const userFormattedData =
            userLogs?.map((log, index) => {
              let timeDifference = 0;
              if (index > 0) {
                const currentTime = new Date(log.created_at).getTime();
                const previousTime = new Date(
                  userLogs[index - 1].created_at,
                ).getTime();
                timeDifference = currentTime - previousTime;
              }

              return {
                "No.": index + 1,
                "User ID": userId,
                PID: user?.pid || "N/A",
                Username: user?.firstName || "N/A",
                "Last Name": user?.lastName || "N/A",
                Email: user?.email || "N/A",
                Event: log.event,
                Timestamp: new Date(log.created_at).getTime(),
                "Time Difference (ms)": timeDifference,
                "Raw Text": log.raw_text.replace(/\n/g, "\\n"),
                "Correct Line": log.line_suggestions?.correct_line || "N/A",
                "Incorrect Line": log.line_suggestions?.incorrect_line || "N/A",
                "Bug Shown": log.line_suggestions?.shown_bug ?? "N/A",
                "Bug Percentage": log.line_suggestions?.bug_percentage ?? "N/A",
                Filename:
                  log.line_suggestions?.line_suggestions_group?.filename ||
                  "N/A",
                Language:
                  log.line_suggestions?.line_suggestions_group?.language ||
                  "N/A",
              };
            }) || [];

          allFormattedData.push(...userFormattedData);
        }

        allFormattedData.sort((a, b) =>
          a["User ID"].localeCompare(b["User ID"]),
        );

        let currentUserId = "";
        let userRowNumber = 1;
        allFormattedData.forEach((row) => {
          if (row["User ID"] !== currentUserId) {
            currentUserId = row["User ID"];
            userRowNumber = 1;
          }
          row["No."] = userRowNumber++;
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
