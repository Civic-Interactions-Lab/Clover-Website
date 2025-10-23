import DownloadFormattedFile from "@/components/DownloadFormattedFile";
import ActivityStatsSection from "../../components/ActivityStatsSection";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useClassActivity } from "@/pages/dashboard/hooks/useClassActivity";
import { UserMode, UserRole } from "@/types/user";
import { ClassDetailsCard } from "../../components/ClassDetailsCard";
import { useClassData } from "@/pages/classes/hooks/useClassData";
import { Edit, Heading } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Title } from "@radix-ui/react-dialog";

const ClassStatView = ({}) => {
  const { instructorId, classId } = useParams();

  const { data } = useClassData(classId);

  const [showModel, setShowModel] = useState<boolean>(false);

  const { classActivity, progressData, loading } = useClassActivity(
    instructorId,
    classId
  );

  const formatDataForDownload = useMemo(() => {
    const activityToExport = classActivity;

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
  }, [classActivity, classId]);
  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h1 className="text-4xl md:text-5xl font-extrabold text-text leading-tight">
          {data?.classTitle}
        </h1>
        <Button
          variant="outline"
          size="icon"
          className="p-6"
          onClick={() => setShowModel(true)}
        >
          <Edit className="w-10 h-10" />
        </Button>
      </div>

      <ActivityStatsSection
        userActivity={classActivity}
        progressData={progressData}
        loading={loading}
        userMode={UserMode.LINE_BY_LINE} // TODO as a switcher or something for this
        role={UserRole.INSTRUCTOR}
        selectedClassTitle={"Testing"}
        classId={classId}
        classActivity={classActivity}
        showRealtimeToggle={false}
        showLearningProgress={false}
      />

      <div className="flex justify-end items-center pt-6">
        <DownloadFormattedFile
          data={formatDataForDownload}
          filename={`class-activity-all-${new Date().toISOString().split("T")[0]}`}
        />
      </div>

      {showModel && data && (
        <ClassDetailsCard
          classData={data}
          onClose={() => setShowModel(false)}
        />
      )}
    </div>
  );
};

export default ClassStatView;
