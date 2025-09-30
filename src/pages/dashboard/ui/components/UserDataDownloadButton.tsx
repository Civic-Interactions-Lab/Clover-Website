import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { supabase } from "@/supabaseClient";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

interface UserDataDownloadButtonProps {
  user: User;
}

type UserLogData = {
  id: string;
  created_at: string;
  event: string | null;
  duration: number;
  user_id: string;
  line_suggestion: {
    id: string;
    incorrect_line: string | null;
    correct_line: string | null;
    shown_bug: boolean | null;
    line_index: number | null;
    line_suggestions_group: {
      prompt: string;
      suggestions: any;
      model: string | null;
      vendor: string | null;
      language: string | null;
      filename: string | null;
    } | null;
  } | null;
};

/**
 * UserDataDownload component that downloads user data
 * @param {string} userId - The user ID to download data for
 */
const UserDataDownloadButton = ({ user }: UserDataDownloadButtonProps) => {
  const [userData, setUserData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("line_suggestions_log")
        .select(
          `
          id,
          created_at,
          event,
          duration,
          user_id,
          line_suggestion:line_suggestion_id (
            id,
            incorrect_line,
            correct_line,
            shown_bug,
            line_index,
            line_suggestions_group:group_id (
              prompt,
              suggestions,
              model,
              vendor,
              language,
              filename
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        return;
      }

      const formattedData =
        (data as unknown as UserLogData[])?.map((log, index) => ({
          "No.": index + 1,
          pid: user.pid,
          Username: user.firstName,
          "Bug Percentage": user.settings.bugPercentage,
          Consent: user.isConsent ? "Yes" : "No",
          Event: log.event,
          "Duration (ms)": log.duration,
          "Correct Line": log.line_suggestion?.correct_line,
          "Incorrect Line": log.line_suggestion?.incorrect_line,
          "Shown Bug": log.line_suggestion?.shown_bug,
          "Line Index": log.line_suggestion?.line_index,
          Prompt: log.line_suggestion?.line_suggestions_group?.prompt,
          Suggestions: log.line_suggestion?.line_suggestions_group?.suggestions
            ? JSON.stringify(
                log.line_suggestion.line_suggestions_group.suggestions
              )
            : "N/A",
          Language:
            log.line_suggestion?.line_suggestions_group?.language || "N/A",
          "Created At": new Date(log.created_at).toLocaleString(),
        })) || [];

      setUserData(formattedData);
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  return (
    <DownloadFormattedFile
      data={userData}
      filename={`user-${user.firstName}-logs-${user.pid}`}
      disabled={loading || userData.length === 0}
    />
  );
};

export default UserDataDownloadButton;
