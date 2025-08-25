import { Activity, PersonStanding } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types/user";
import { useUserActivity } from "@/pages/dashboard/hooks/useUserActivity";
import { InfoCardItem, InfoCardTitle } from "@/components/CardComponents";
import Loading from "@/components/Loading";
import { formatLastActivityTime } from "@/utils/timeConverter";

interface ActivityStatsCardsProps {
  user: User | null;
}

const ActivityStatsCards = ({ user }: ActivityStatsCardsProps) => {
  const { userActivity, progressData, loading } = useUserActivity(
    user?.id,
    user?.settings.mode
  );

  const lastActivity =
    userActivity.length > 0
      ? userActivity.reduce((latest, current) =>
          new Date(current.createdAt) > new Date(latest.createdAt)
            ? current
            : latest
        ).createdAt
      : null;

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading user activity..." />
      </div>
    );
  }

  return (
    <>
      {/* Activity Statistics */}
      {user.settings.enableDashboard && (
        <Card className="py-3 bg-muted/40">
          <InfoCardTitle title="Activity Insights" icon={Activity} />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InfoCardItem
                label="Total Interactions"
                value={progressData.totalInteractions || 0}
              />
              <InfoCardItem
                label="Correct Answers"
                value={progressData.correctSuggestions || 0}
              />
              <InfoCardItem
                label="Accuracy Rate"
                value={`${(progressData.accuracyPercentage || 0).toFixed(1)}%`}
              />
              <InfoCardItem
                label="Last Activity"
                value={formatLastActivityTime(lastActivity)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Stats */}
      <Card className="py-3 bg-muted/40">
        <InfoCardTitle title="Activity Status" icon={PersonStanding} />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCardItem
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <InfoCardItem
              label="Days Active"
              value={Math.floor(
                (Date.now() - new Date(user.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}
            />
            <InfoCardItem label="Account Status" value={user.status} />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ActivityStatsCards;
