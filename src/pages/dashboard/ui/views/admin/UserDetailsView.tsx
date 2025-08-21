import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  User,
  UserMode,
  UserSettings,
  UserRole,
  UserStatus,
} from "@/types/user";
import { saveUserSettings, updateUser } from "@/api/user";
import {
  InfoCardItem,
  InfoCardTitle,
  InfoField,
} from "@/components/CardComponents";
import CustomSelect from "@/components/CustomSelect";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/UserAvatar";
import {
  Calendar,
  Edit,
  Info,
  Mail,
  PersonStanding,
  Settings,
  User2,
  X,
} from "lucide-react";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";
import { CustomTooltip } from "@/components/CustomTooltip";
import Loading from "@/components/Loading";
import NoData from "@/components/NoData";
import PaginatedTable from "@/components/PaginatedTable";
import SuggestionTable from "@/pages/dashboard/ui/components/SuggestionTable";
import { useUserActivity } from "@/pages/dashboard/hooks/useUserActivity";
import { getUserData } from "@/api/user";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useUser } from "@/context/UserContext";
import TypingCharts from "../../components/TypingCharts";

const UserDetailsView = () => {
  const { userId } = useParams<{ userId: string }>();
  const { userData } = useUser();

  const [displayUser, setDisplayUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<UserSettings | null>(
    null
  );
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);

  // New state for user role and status editing
  const [editingUser, setEditingUser] = useState<{
    role: UserRole;
    status: UserStatus;
  } | null>(null);
  const [originalUser, setOriginalUser] = useState<{
    role: UserRole;
    status: UserStatus;
  } | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      setUserLoading(true);
      setUserError(null);

      const result = await getUserData(userId);

      if (result.error) {
        setUserError(result.error);
      } else if (result.data) {
        setDisplayUser(result.data);
      }

      setUserLoading(false);
    };

    fetchUser();
  }, [userId]);

  const {
    userActivity,
    loading: userActivityLoading,
    progressData,
  } = useUserActivity(
    displayUser?.id,
    displayUser?.settings?.mode,
    null,
    isRealtimeEnabled
  );

  useEffect(() => {
    if (displayUser?.settings) {
      setSettings(displayUser.settings);
      setOriginalSettings(displayUser.settings);
    }

    if (displayUser) {
      const userBasicInfo = {
        role: displayUser.role,
        status: displayUser.status,
      };
      setEditingUser(userBasicInfo);
      setOriginalUser(userBasicInfo);
    }
  }, [displayUser]);

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev!, [key]: value }));
  };

  const updateUserField = (
    key: "role" | "status",
    value: UserRole | UserStatus
  ) => {
    setEditingUser((prev) => ({ ...prev!, [key]: value }));
  };

  const handleEdit = () => {
    setEditMode((prev) => !prev);
    setOriginalSettings(settings);
    setOriginalUser(editingUser);
  };

  const handleSaveAll = async () => {
    if (!displayUser || !settings || !editingUser) return;

    try {
      // Save user settings
      await saveUserSettings(displayUser.id, settings);
      console.log("Saving settings:", settings);

      // Update user role and status if they changed
      const userChanged =
        editingUser.role !== originalUser?.role ||
        editingUser.status !== originalUser?.status;

      if (userChanged) {
        const updatedUserData = {
          ...displayUser,
          role: editingUser.role,
          status: editingUser.status,
        };

        const updateResult = await updateUser(displayUser.id, updatedUserData);

        if (updateResult.error) {
          console.error("Failed to update user:", updateResult.error);
          // You might want to show a toast notification here
          return;
        }

        console.log("User updated successfully");
      }

      setEditMode(false);
      setOriginalSettings(settings);
      setOriginalUser(editingUser);

      // Refetch user data to get updated information
      const result = await getUserData(displayUser.id);
      if (result.data) {
        setDisplayUser(result.data);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setSettings(originalSettings);
    setEditingUser(originalUser);
  };

  // Filter and sort log items
  const filteredLogItems = userActivity.filter(
    (logItem) =>
      ACCEPT_EVENTS.includes(logItem.event) ||
      REJECT_EVENTS.includes(logItem.event)
  );

  const sortedLogItems = filteredLogItems.sort(
    (a, b) =>
      new Date(b.createdAt || b.createdAt).getTime() -
      new Date(a.createdAt || a.createdAt).getTime()
  );

  const loading = userActivityLoading || userLoading;
  const canEdit =
    userData?.role === UserRole.ADMIN || userData?.role === UserRole.DEV;

  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading User
          </h2>
          <p className="text-gray-500 mt-2">{userError}</p>
        </div>
      </div>
    );
  }

  if (!displayUser && !userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600">
            User Not Found
          </h2>
          <p className="text-gray-500 mt-2">
            The requested user could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading user data..." />
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="space-y-6 py-24 max-w-7xl mx-auto px-8">
        {/* User Details Section */}
        <Card className="overflow-hidden">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 px-8">
            <div className="flex items-center space-x-4">
              <UserAvatar
                firstName={displayUser!.firstName}
                avatarUrl={displayUser!.avatarUrl}
                size="xl"
              />
              <div className="flex flex-col space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {displayUser!.firstName} {displayUser!.lastName}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <RoleBadge role={editingUser?.role || displayUser!.role} />
                  <StatusBadge
                    status={editingUser?.status || displayUser!.status}
                  />
                </div>
              </div>
            </div>

            {canEdit && (
              <button
                onClick={editMode ? handleCancelEdit : handleEdit}
                className="text-gray-500 dark:text-gray-300 hover:text-primary"
              >
                {editMode ? (
                  <X className="size-5" />
                ) : (
                  <Edit className="size-5" />
                )}
              </button>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="py-3 bg-muted/40">
                <InfoCardTitle title="Details" icon={User2} />
                <CardContent className="space-y-3">
                  <InfoField
                    label="Email"
                    value={displayUser!.email}
                    icon={Mail}
                  />
                  <InfoField
                    label="Joined"
                    value={new Date(displayUser!.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                    icon={Calendar}
                  />
                  <InfoField label="ID" value={displayUser!.id} icon={Info} />
                </CardContent>
              </Card>

              {/* User Settings */}
              <Card className="py-3 bg-muted/40">
                <InfoCardTitle title="Settings" icon={Settings} />
                <CardContent className="space-y-6">
                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Show Notifications</p>
                    <Switch
                      checked={settings?.showNotifications ?? true}
                      onCheckedChange={(checked) =>
                        updateSetting("showNotifications", checked)
                      }
                      disabled={!editMode}
                    />
                  </div>

                  {/* Quiz Setting */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Enable Quiz</p>
                    <Switch
                      checked={settings?.enableQuiz ?? true}
                      onCheckedChange={(checked) =>
                        updateSetting("enableQuiz", checked)
                      }
                      disabled={!editMode}
                    />
                  </div>

                  {/* Bug Percentage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Bug Percentage
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {settings?.bugPercentage}%
                      </span>
                    </div>
                    <Slider
                      value={[settings?.bugPercentage as number]}
                      onValueChange={(value) =>
                        updateSetting("bugPercentage", value[0])
                      }
                      min={0}
                      max={100}
                      step={5}
                      disabled={!editMode}
                      className="w-full"
                    />
                  </div>

                  {/* Mode Selection */}
                  <div className="flex items-center justify-between gap-8">
                    <p className="text-sm font-medium">Mode</p>
                    <CustomSelect
                      value={settings?.mode || UserMode.CODE_BLOCK}
                      onValueChange={(value) => updateSetting("mode", value)}
                      options={[
                        { label: "Block", value: UserMode.CODE_BLOCK },
                        { label: "Line", value: UserMode.LINE_BY_LINE },
                        { label: "Selection", value: UserMode.CODE_SELECTION },
                      ]}
                      disabled={!editMode}
                      className="w-36"
                    />
                  </div>

                  {editMode && (
                    <>
                      <div className="flex items-center justify-between gap-8">
                        <p className="text-sm font-medium">Role</p>
                        <CustomSelect
                          value={editingUser?.role || displayUser!.role}
                          onValueChange={(value) =>
                            updateUserField("role", value)
                          }
                          options={[
                            { label: "Student", value: UserRole.STUDENT },
                            { label: "Instructor", value: UserRole.INSTRUCTOR },
                            { label: "Admin", value: UserRole.ADMIN },
                            { label: "Developer", value: UserRole.DEV },
                          ]}
                          disabled={false}
                          className="w-36"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-8">
                        <p className="text-sm font-medium">Status</p>
                        <CustomSelect
                          value={editingUser?.status || displayUser!.status}
                          onValueChange={(value) =>
                            updateUserField("status", value)
                          }
                          options={[
                            { label: "Active", value: UserStatus.ACTIVE },
                            { label: "Locked", value: UserStatus.LOCKED },
                          ]}
                          disabled={false}
                          className="w-36"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Save/Cancel Buttons - Now spans full width */}
            {editMode && (
              <div className="flex gap-3 items-center justify-center pt-4">
                <Button
                  onClick={handleSaveAll}
                  size="default"
                  className="px-8 rounded-full"
                >
                  Save All Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  size="default"
                  className="px-8 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Account Stats */}
            <Card className="py-3 bg-muted/40">
              <InfoCardTitle title="Activity Status" icon={PersonStanding} />
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoCardItem
                    label="Member Since"
                    value={new Date(displayUser!.createdAt).toLocaleDateString(
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
                      (Date.now() -
                        new Date(displayUser!.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  />
                  <InfoCardItem
                    label="Account Status"
                    value={editingUser?.status || displayUser!.status}
                  />
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* User Activity Logs Section */}
        {progressData.totalInteractions > 0 ? (
          <Card className="p-6">
            <div className="flex items-center mb-3 gap-3 justify-between">
              <CustomTooltip
                trigger={
                  <h2 className="text-lg font-semibold text-[#50B498]">
                    User Activity Table
                  </h2>
                }
                children={
                  <div className="space-y-2">
                    <p className="text-sm">
                      This table shows recent interactions with code
                      suggestions.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click on any row to view detailed suggestion information.
                    </p>
                  </div>
                }
              />
              <div className="flex items-center space-x-2">
                <Label htmlFor="realtime-switch">Realtime Updates</Label>
                <Switch
                  id="realtime-switch"
                  checked={isRealtimeEnabled}
                  onCheckedChange={setIsRealtimeEnabled}
                />
              </div>
            </div>
            <PaginatedTable
              data={sortedLogItems}
              renderTable={(items, startIndex) => (
                <SuggestionTable
                  logItems={items}
                  startIndex={startIndex}
                  mode={displayUser?.settings?.mode as UserMode}
                />
              )}
            />
          </Card>
        ) : (
          <Card className="p-6">
            <NoData role="admin" userName={displayUser?.firstName} />
          </Card>
        )}

        <TypingCharts
          userId={displayUser?.id as string}
          mode={displayUser?.settings?.mode as UserMode}
        />
      </div>

      <Footer />
    </>
  );
};

export default UserDetailsView;
