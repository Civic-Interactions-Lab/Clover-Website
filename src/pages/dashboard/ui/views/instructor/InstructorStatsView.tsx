import { UserRole } from "@/types/user";
import { useUser } from "@/context/UserContext";
import { useClassActivity } from "@/pages/dashboard/hooks/useClassActivity";
import { useInstructorClasses } from "@/hooks/useInstructorClasses";
import { useEffect, useMemo } from "react";
import ClassesDropdownMenu from "@/pages/dashboard/ui/components/ClassesDropdownMenu";
import Loading from "@/components/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import ActivityStatsSection from "../../components/ActivityStatsSection";
import DownloadFormattedFile from "@/components/DownloadFormattedFile";

const InstructorStatsView = ({ description }: { description?: string }) => {
  const { userData } = useUser();

  const location = useLocation();
  const navigate = useNavigate();
  const preselectedClassId = location.state?.preselectedClassId;

  useEffect(() => {
    if (preselectedClassId) {
      navigate(location.pathname, { replace: true });
    }
  }, [preselectedClassId, location.pathname, navigate]);

  const { allClassOptions, selectedClassId, handleClassSelect } =
    useInstructorClasses(userData?.id, preselectedClassId);

  const { allActivity, classActivity, progressData, loading } =
    useClassActivity(userData?.id as string, selectedClassId);

  const selectedClassTitle =
    allClassOptions.find((classItem) => classItem.id === selectedClassId)
      ?.classTitle ?? "";

  const formatDataForDownload = useMemo(() => {
    const activityToExport =
      selectedClassId === "all" ? allActivity : classActivity;

    return activityToExport.map((activity, index) => ({
      "No.": index + 1,
      "User ID": activity.userId,
      Event: activity.event,
      "Class Title": activity.classTitle || "N/A",
      "Class Code": activity.classCode || "N/A",
      "Duration (seconds)": activity.duration,
      "Has Bug": activity.hasBug ? "Yes" : "No",
      Type: activity.type || "N/A",
      "Created At": new Date(activity.createdAt).toLocaleString(),
    }));
  }, [allActivity, classActivity, selectedClassId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" showText={false} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex w-full justify-between gap-6 items-center">
        <p className="text-sm text-muted-foreground hidden md:block">
          {description}
        </p>
        <div className="w-full md:w-64">
          <ClassesDropdownMenu
            classes={allClassOptions}
            selectedId={selectedClassId}
            onClassSelect={handleClassSelect}
          />
        </div>
      </div>

      <ActivityStatsSection
        userActivity={selectedClassId === "all" ? allActivity : classActivity}
        progressData={progressData}
        loading={loading}
        role={UserRole.INSTRUCTOR}
        selectedClassTitle={selectedClassTitle}
        classId={selectedClassId as string}
        allActivity={allActivity}
        classActivity={classActivity}
        showRealtimeToggle={false}
        showLearningProgress={false}
      />

      <div className="flex justify-end items-center">
        <DownloadFormattedFile
          data={formatDataForDownload}
          filename={`class-activity-${selectedClassTitle || "all"}-${new Date().toISOString().split("T")[0]}`}
        />
      </div>
    </div>
  );
};

export default InstructorStatsView;
