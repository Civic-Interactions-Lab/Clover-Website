import {
  InfoCardItem,
  InfoCardTitle,
  InfoField,
} from "@/components/CardComponents";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { User } from "@/types/user";
import { formatActivityTimestamp } from "@/utils/timeConverter";
import {
  Activity,
  Calendar,
  Mail,
  PersonStanding,
  UserIcon,
} from "lucide-react";
import { useUserActivity } from "../../../dashboard/hooks/useUserActivity";
import Loading from "@/components/Loading";
import EditUserButton from "@/components/EditUserButton";

interface StudentProfileViewProps {
  userData: User;
}

/**
 * StudentProfile component that displays user profile and classes.
 * @param userData - The user data to display in the student profile.
 * @module Pages
 * @returns
 */
export const StudentProfileView = ({ userData }: StudentProfileViewProps) => {
  const { userActivity, progressData, loading } = useUserActivity(
    userData?.id,
    userData?.settings.mode
  );

  if (loading) {
    return <Loading size="lg" className="min-h-screen" />;
  }

  const lastActivity =
    userActivity.length > 0
      ? userActivity.reduce((latest, current) =>
          new Date(current.createdAt) > new Date(latest.createdAt)
            ? current
            : latest
        ).createdAt
      : null;

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Basic Profile Info */}
        <div className=" lg:col-span-1 space-y-6">
          <div className="grid md:grid-cols-3 lg:grid-cols-1 gap-6">
            <Card className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <UserAvatar
                  firstName={userData.firstName}
                  avatarUrl={userData.avatarUrl}
                  size="xl"
                />
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {userData.firstName} {userData.lastName}{" "}
                  </h2>

                  <p className="text-muted-foreground text-sm">
                    pid: {userData.pid}
                  </p>

                  <div className="flex flex-row items-center gap-2">
                    <RoleBadge role={userData.role} />
                    <StatusBadge status={userData.status} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Basic Information */}
            <Card className="py-3 col-span-2 hidden md:block lg:hidden">
              <div className="flex items-center justify-between pr-4">
                <InfoCardTitle title="Details" icon={UserIcon} />

                <EditUserButton user={userData} />
              </div>
              <CardContent className="flex flex-col gap-4">
                <InfoField
                  label="Email"
                  value={
                    userData.email.includes("@anonymous.com")
                      ? "Anonymous"
                      : userData.email
                  }
                  icon={Mail}
                />
                <InfoField
                  label="Joined"
                  value={new Date(userData.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                  icon={Calendar}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Content - Detailed Information */}
        <div className="lg:col-span-3 gap-y-6 flex flex-col">
          {/* Basic Information */}
          <Card className="py-3 md:hidden lg:block">
            <div className="flex items-center justify-between pr-4">
              <InfoCardTitle title="Details" icon={UserIcon} />

              <EditUserButton user={userData} />
            </div>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                label="Email"
                value={
                  userData.email.includes("@anonymous.com")
                    ? "Anonymous"
                    : userData.email
                }
                icon={Mail}
              />
              <InfoField
                label="Joined"
                value={new Date(userData.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
                icon={Calendar}
              />
            </CardContent>
          </Card>

          {/* Activity Statistics */}
          <Card className="py-3">
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
                  value={formatActivityTimestamp(lastActivity)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="py-3">
            <InfoCardTitle title="Account Status" icon={PersonStanding} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCardItem
                  label="Member Since"
                  value={new Date(userData.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                />
                <InfoCardItem
                  label="Days Active"
                  value={Math.floor(
                    (Date.now() - new Date(userData.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                />
                <InfoCardItem label="Account Status" value={userData.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
