/**
 * Converts a date string to a Date object.
 * @param isoString - The ISO date string to be parsed.
 * @returns {Date} - The parsed date object.
 */
export const parseISODate = (isoString: string) => {
  const date = new Date(isoString);
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};

export const isOnline = (lastActivity: string | null) => {
  if (!lastActivity) return false;
  const now = new Date();
  const lastActivityDate = new Date(lastActivity);
  const diffInMinutes =
    (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);
  return diffInMinutes <= 5;
};

export const formatActivityTimestamp = (
  timestamp: string | null,
  relative: boolean = false
) => {
  if (!timestamp) return "No activity";

  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

  if (diffInMinutes < 5) return "Online";
  if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

  if (relative) {
    const diffInDays = Math.floor(diffInMinutes / 1440);
    return `${diffInDays}d ago`;
  }

  // Otherwise show the formatted date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatLastActivityTime = (
  timestamp: string | null,
  isOnline: boolean = true
): string => {
  if (!timestamp) return "No activity";

  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMs = now.getTime() - activityTime.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    if (isOnline) {
      return "Online";
    } else {
      return `${diffInSeconds} sec${diffInSeconds !== 1 ? "s" : ""} ago`;
    }
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }
};
