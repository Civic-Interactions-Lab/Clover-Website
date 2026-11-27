import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import { getUserSuggestionExport } from "@/api/logs";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

interface UserDataDownloadButtonProps {
  user: User;
}

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

      const { logs, error } = await getUserSuggestionExport(user.id);
      if (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        return;
      }

      const formattedData =
        logs?.map((log, index) => ({
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
                log.line_suggestion.line_suggestions_group.suggestions,
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
