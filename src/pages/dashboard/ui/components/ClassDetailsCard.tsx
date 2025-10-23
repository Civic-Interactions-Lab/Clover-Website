import { updateClassStudentsSettings } from "@/api/classes";
import { ClassData, User, UserMode } from "@/types/user";
import {
  InfoCardItem,
  InfoCardTitle,
  InfoField,
} from "@/components/CardComponents";
import CustomSelect from "@/components/CustomSelect";
import ModalContainer from "@/components/ModalContainer";
import ModeBadge from "@/components/ModeBadge";
import StatusBadge from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import UserInfoItem from "@/components/UserInfoItem";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Edit,
  GraduationCap,
  History,
  Info,
  NotepadText,
  Settings,
  Text,
  User2Icon,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ClassDetailsCardProps {
  classData: ClassData;
  onClose: () => void;
}

export const ClassDetailsCard = ({
  classData,
  onClose,
}: ClassDetailsCardProps) => {
  const [editMode, setEditMode] = useState(false);

  const getClassSettings = () => {
    if (!classData.students || classData.students.length === 0) {
      return {
        enableQuiz: true,
        bugPercentage: 50,
        showNotifications: true,
        mode: "CODE_BLOCK" as UserMode,
        enableDashboard: false,
      };
    }

    // Count each setting
    const enableQuizCount = { true: 0, false: 0 };
    const showNotificationsCount = { true: 0, false: 0 };
    const enableDashboardCount = { true: 0, false: 0 };
    const modeCount: Record<string, number> = {};
    const bugPercentages: number[] = [];

    classData.students.forEach((student) => {
      if (student.settings) {
        enableQuizCount[student.settings.enableQuiz ? "true" : "false"]++;
        showNotificationsCount[
          student.settings.showNotifications ? "true" : "false"
        ]++;

        enableDashboardCount[
          student.settings.enableDashboard ? "true" : "false"
        ]++;

        const mode = student.settings.mode;
        modeCount[mode] = (modeCount[mode] || 0) + 1;

        bugPercentages.push(student.settings.bugPercentage);
      }
    });

    // Get most common values (use defaults if tied)
    const mostCommonEnableQuiz =
      enableQuizCount.true === enableQuizCount.false
        ? true
        : enableQuizCount.true > enableQuizCount.false;

    const mostCommonShowNotifications =
      showNotificationsCount.true === showNotificationsCount.false
        ? true
        : showNotificationsCount.true > showNotificationsCount.false;

    const mostCommonEnableDashboard =
      enableDashboardCount.true === enableDashboardCount.false
        ? true
        : enableDashboardCount.true > enableDashboardCount.false;

    const sortedModes = Object.entries(modeCount).sort(([, a], [, b]) => b - a);
    const mostCommonMode =
      sortedModes.length === 0 ||
      (sortedModes.length > 1 && sortedModes[0][1] === sortedModes[1][1])
        ? "CODE_BLOCK"
        : sortedModes[0][0];

    const bugPercentageCount: Record<number, number> = {};
    bugPercentages.forEach((percentage) => {
      bugPercentageCount[percentage] =
        (bugPercentageCount[percentage] || 0) + 1;
    });

    const sortedBugPercentages = Object.entries(bugPercentageCount).sort(
      ([, a], [, b]) => b - a
    );

    const mostCommonBugPercentage =
      sortedBugPercentages.length === 0 ||
      (sortedBugPercentages.length > 1 &&
        sortedBugPercentages[0][1] === sortedBugPercentages[1][1])
        ? 50
        : parseInt(sortedBugPercentages[0][0]);

    return {
      enableQuiz: mostCommonEnableQuiz,
      bugPercentage: mostCommonBugPercentage,
      showNotifications: mostCommonShowNotifications,
      mode: mostCommonMode as UserMode,
      enableDashboard: mostCommonEnableDashboard,
    };
  };

  const [classSettings, setClassSettings] = useState(getClassSettings());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateClassSetting = (key: keyof typeof classSettings, value: any) => {
    setClassSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => {
    setEditMode(!editMode);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const queryClient = useQueryClient();

  const handleSaveSettings = async () => {
    if (!classData.students) {
      toast.warning("No students found in class data");
      setEditMode(false);
      return;
    }

    const studentIds = classData.students.map((student) => student.id);

    try {
      await updateClassStudentsSettings(
        classData.id ?? "",
        studentIds,
        classSettings
      );

      setEditMode(false);

      await queryClient.invalidateQueries({
        queryKey: ["allClasses", { includeStudents: true }],
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const formatQuickDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getDaysActive = () => {
    return Math.floor(
      (Date.now() - new Date(classData.createdAt as string).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  return (
    <ModalContainer isOpen={!!classData} onClose={onClose}>
      <Card className="overflow-hidden w-full max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-y-auto bg-white dark:bg-gray-900 pt-3 relative px-2">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              {classData.classImageCover ? (
                <img
                  src={classData.classImageCover}
                  alt={classData.classTitle}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <AvatarFallback
                  className="text-white text-2xl font-semibold rounded-lg"
                  style={{
                    backgroundColor: classData.classHexColor || "#50B498",
                  }}
                >
                  {classData.classTitle?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {classData.classTitle}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {classData.classCode}
                </div>
                <div className="text-sm text-muted-foreground">
                  {classData.studentCount} students
                </div>
              </div>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 absolute top-6 right-6 rounded-full"
            >
              <X className="!size-6" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="py-3">
              <InfoCardTitle title="Details" icon={BookOpen} />
              <CardContent className="space-y-3">
                <InfoField
                  label="Class Title"
                  value={classData.classTitle}
                  icon={GraduationCap}
                />
                <InfoField
                  label="Class Code"
                  value={classData.classCode || "N/A"}
                  icon={Info}
                />
                <InfoField
                  label="Instructor"
                  value={classData.instructorName || "Unknown Instructor"}
                  icon={User2Icon}
                />
                {classData.classDescription && (
                  <InfoField
                    label="Description"
                    value={classData.classDescription}
                    icon={Text}
                  />
                )}
                <InfoField
                  label="Created"
                  value={new Date(
                    classData.createdAt as string
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  icon={Calendar}
                />
                <InfoField
                  label="Class ID"
                  value={classData.id ?? ""}
                  icon={Info}
                />
              </CardContent>
            </Card>

            {/* Class Settings - EXTRACTED FROM STUDENTS */}
            <Card className="py-3">
              <InfoCardTitle
                title="Settings"
                icon={Settings}
                button={
                  <button
                    onClick={editMode ? handleCancelEdit : handleEdit}
                    className="text-gray-500 dark:text-gray-300 hover:text-primary mr-1"
                  >
                    {editMode ? (
                      <X className="size-5" />
                    ) : (
                      <Edit className="size-5" />
                    )}
                  </button>
                }
              />
              <CardContent className="space-y-6">
                <div className="text-xs text-muted-foreground mb-4">
                  {classData.students && classData.students.length > 0
                    ? "Settings based on student preferences"
                    : "Default settings"}
                </div>

                {/* Show Notifications */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Show Notifications</p>
                  <Switch
                    checked={classSettings.showNotifications}
                    onCheckedChange={(checked) =>
                      updateClassSetting("showNotifications", checked)
                    }
                    disabled={!editMode}
                  />
                </div>

                {/* Enable Quiz */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Enable Quiz</p>
                  <Switch
                    checked={classSettings.enableQuiz}
                    onCheckedChange={(checked) =>
                      updateClassSetting("enableQuiz", checked)
                    }
                    disabled={!editMode}
                  />
                </div>

                {/* Bug Percentage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bug Percentage</span>
                    <span className="text-sm text-muted-foreground">
                      {classSettings.bugPercentage}%
                    </span>
                  </div>
                  <Slider
                    value={[classSettings.bugPercentage]}
                    onValueChange={(value) =>
                      updateClassSetting("bugPercentage", value[0])
                    }
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
                    value={classSettings.mode}
                    onValueChange={(value) => updateClassSetting("mode", value)}
                    options={[
                      { label: "Block", value: UserMode.CODE_BLOCK },
                      { label: "Line", value: UserMode.LINE_BY_LINE },
                      { label: "Selection", value: UserMode.CODE_SELECTION },
                    ]}
                    disabled={!editMode}
                    className="w-28"
                  />
                </div>

                {/* Save/Cancel Buttons */}
                {editMode && (
                  <div className="flex gap-3 items-center pt-3">
                    <Button
                      onClick={handleSaveSettings}
                      size="sm"
                      className="flex-1 rounded-full"
                    >
                      Apply to All
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelEdit}
                      size="sm"
                      className="flex-1 rounded-full"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Class Statistics */}
          <Card className="py-3">
            <InfoCardTitle title="Overview" icon={NotepadText} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InfoCardItem
                  label="Total Students"
                  value={classData.studentCount}
                />
                <InfoCardItem
                  label="Active Students"
                  value={
                    classData.students?.filter((s) => s.status === "ACTIVE")
                      .length || 0
                  }
                />
                <InfoCardItem
                  label="Avg Bug %"
                  value={`${classSettings.bugPercentage}%`}
                />
                <InfoCardItem
                  label="Mode"
                  value={classSettings.mode
                    .replace("CODE_", "")
                    .replace("_", " ")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Class Info */}
          <Card className="py-3">
            <InfoCardTitle title="Activity Status" icon={History} />
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCardItem
                  label="Created"
                  value={formatQuickDate(classData.createdAt as string)}
                />
                <InfoCardItem label="Days Active" value={getDaysActive()} />
                <InfoCardItem label="Status" value="Active" />
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          {classData.students && classData.students.length > 0 && (
            <Card className="py-3">
              <InfoCardTitle title="Enrolled Students" icon={Users} />
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {classData.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 py-2 px-4 bg-muted rounded-lg flex-1 justify-between"
                    >
                      <UserInfoItem
                        firstName={student.firstName}
                        lastName={student.lastName}
                        email={student.email}
                        avatarUrl={student.avatarUrl}
                        size="sm"
                      />
                      <div className="flex items-center gap-2">
                        <ModeBadge mode={student.settings?.mode} />
                        <StatusBadge status={student.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </ModalContainer>
  );
};
