import { LogEvent } from "../api/types/event";
import { UserActivityLogItem } from "../api/types/user";

/**
 * Progress data of a user based on their activity logs.
 */
export interface ProgressData {
  totalAccepted: number;
  correctSuggestions: number;
  percentageCorrect: number;
}

/**
 * Calculate the progress of a user based on their activity logs.
 * @param {UserActivityLogItem[]} logs - The activity logs of the user.
 * @returns {ProgressData} The progress data of the user.
 */
export const calculateProgress = (
  logs: UserActivityLogItem[]
): ProgressData => {
  const acceptedLogs = logs.filter(
    (log) => log.event === LogEvent.SUGGESTION_ACCEPT
  );
  const totalAccepted = acceptedLogs.length;
  const correctSuggestions = acceptedLogs.filter(
    (log) => log.has_bug === false
  ).length;

  const percentageCorrect =
    totalAccepted > 0 ? (correctSuggestions / totalAccepted) * 100 : 0;

  return {
    totalAccepted,
    correctSuggestions,
    percentageCorrect,
  };
};
