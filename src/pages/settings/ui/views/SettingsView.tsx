import NavBar from "@/components/NavBar";
import { Card, CardTitle } from "@/components/ui/card";
import { Title } from "@/components/ui/text";
import { useUser } from "@/context/UserContext";
import { UserRole } from "@/types/user";
import UserSettings from "../components/UserSettings";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { ResetPasswordButton } from "@/components/ResetPasswordButton";
import EditUserButton from "@/components/EditUserButton";

/**
 * Settings component that displays user settings and activity.
 * It fetches user classes, instructor classes, and user activity from the server.
 *
 * @param userData - The user data to display in the settings page.
 */
export const SettingsView = () => {
  const { userData } = useUser();
  if (!userData) return null;

  const isPrivileged =
    userData.role === UserRole.ADMIN || userData.role === UserRole.DEV;

  return (
    <div className="min-h-screen items-center text-text width-container space-y-10">
      <NavBar />
      <div className="p-10 flex flex-col items-center">
        <Title className="pb-6">Settings</Title>
        <Card className="flex flex-col gap-4 p-6 width-container">
          <div className="flex justify-between items-center mb-4">
            <CardTitle>
              {userData.firstName + " " + userData.lastName}
            </CardTitle>
            <EditUserButton user={userData} />
          </div>

          {isPrivileged && <UserSettings user={userData} />}

          <div className="flex gap-4">
            <DeleteUserButton userId={userData.id} />
            <ResetPasswordButton />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;
