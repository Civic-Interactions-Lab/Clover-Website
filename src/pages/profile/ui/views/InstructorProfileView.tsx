import { Calendar, Mail, UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import { InfoCardTitle, InfoField } from "@/components/CardComponents";
import { User } from "@/types/user";
import EditUserButton from "@/components/EditUserButton";
import ActivityStatsCards from "../components/ActivityStatsCards";

interface InstructorProfileViewProps {
  userData: User;
}

/**
 * InstructorProfile component displays the profile of an instructor.
 * It shows the instructor's avatar, name, email, ratings, and courses.
 * @param { userData } - The user data of the instructor.
 * @returns {JSX.Element} - The rendered component.
 */
export const InstructorProfileView = ({
  userData,
}: InstructorProfileViewProps) => {
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

          <ActivityStatsCards user={userData} />
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileView;
