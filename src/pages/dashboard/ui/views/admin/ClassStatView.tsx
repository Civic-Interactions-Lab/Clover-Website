import ActivityStatsSection from "../../components/ActivityStatsSection";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useClassActivity } from "@/pages/dashboard/hooks/useClassActivity";
import { UserMode, UserRole } from "@/types/user";
import { ClassDetailsCard } from "../../components/ClassDetailsCard";
import { useClassData } from "@/pages/classes/hooks/useClassData";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClassTypingLogsDownloadButton from "@/pages/classes/ui/components/ClassTypingLogsDownloadButton.tsx";

const ClassStatView = ({}) => {
  const { instructorId, classId } = useParams();

  const { data } = useClassData(classId, {
    includeStudents: true,
    includeAllStatuses: false,
  });

  const [showModel, setShowModel] = useState<boolean>(false);

  const { classActivity, progressData, loading } = useClassActivity(
    instructorId,
    classId,
    UserMode.LINE_BY_LINE,
  );

  return (
    <div>
      <div className="flex justify-end items-center py-4">
        <ClassTypingLogsDownloadButton
          classId={classId!}
          className={data?.classTitle}
        />
      </div>

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
        userMode={UserMode.LINE_BY_LINE}
        role={UserRole.INSTRUCTOR}
        selectedClassTitle={"Testing"}
        classId={classId}
        classActivity={classActivity}
        showRealtimeToggle={false}
        showLearningProgress={false}
      />

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
