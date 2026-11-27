import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import ClassesDropdownMenu from "@/pages/dashboard/ui/components/ClassesDropdownMenu";
import Loading from "@/components/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import ActivityStatsSection from "../../components/ActivityStatsSection";
import { EnrollmentStatus, UserMode, UserRole } from "@/types/user";
import { getClassesbyStudent } from "@/api/classes";
import { getUserActivity } from "@/api/user";
import {
  calculateProgress,
  getEmptyProgressData,
} from "@/utils/calculateProgress";
import { UserActivityLogItem } from "@/types/suggestion";

const StudentStatsView = ({ description }: { description?: string }) => {
  const { userData } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedClassId = location.state?.preselectedClassId;

  const [rawLogs, setRawLogs] = useState<UserActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  const [allClassOptions, setAllClassOptions] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    preselectedClassId || "all",
  );
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    if (preselectedClassId) {
      navigate(location.pathname, { replace: true });
    }
  }, [preselectedClassId, location.pathname, navigate]);

  // ── Fetch enrolled classes ──
  useEffect(() => {
    if (!userData?.id) return;

    const fetchClasses = async () => {
      const { data, error } = await getClassesbyStudent(userData.id);

      if (error) {
        console.error(error);
        setClassesLoading(false);
        return;
      }

      const enrolled = (data ?? [])
        .filter((row) => row.enrollmentStatus === EnrollmentStatus.ENROLLED)
        .map((row) => ({
          id: row.id,
          classTitle: row.classTitle,
          classCode: row.classCode,
          classHexColor: row.classHexColor,
          students: [],
        }));

      setAllClassOptions([
        {
          id: "all",
          classTitle: "All Classes",
          classCode: "",
          classHexColor: "#e5e5e5",
          students: [],
        },
        ...enrolled,
        {
          id: "non-class",
          classTitle: "Non-class Activities",
          classCode: "",
          classHexColor: "#404040",
          students: [],
        },
      ]);
      setClassesLoading(false);
    };

    fetchClasses();
  }, [userData?.id]);

  const handleClassSelect = useCallback((classId: string | null) => {
    setSelectedClassId(classId);
  }, []);

  // ── Fetch logs ──
  const fetchLogs = async () => {
    if (!userData?.id) return;

    const { logs, error } = await getUserActivity(userData.id, UserMode.LINE_BY_LINE);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setRawLogs(logs ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [userData?.id]);

  // ── Realtime ──
  useEffect(() => {
    if (!isRealtimeEnabled || !userData?.id) return;

    const refresh = window.setInterval(fetchLogs, 30_000);
    return () => window.clearInterval(refresh);
  }, [isRealtimeEnabled, userData?.id]);

  // ── Filter by selected class ──
  const userActivity = useMemo(() => {
    if (!rawLogs.length) return [];
    if (selectedClassId === "non-class")
      return rawLogs.filter((log) => !log.classId);
    if (selectedClassId && selectedClassId !== "all")
      return rawLogs.filter((log) => log.classId === selectedClassId);
    return rawLogs;
  }, [rawLogs, selectedClassId]);

  // ── Calculate progress ──
  const progressData = useMemo(() => {
    if (!userActivity.length) return getEmptyProgressData();
    return calculateProgress(userActivity);
  }, [userActivity]);

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading your data" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex w-full justify-between gap-6 items-center">
        <p className="text-sm text-muted-foreground hidden md:block">
          {description}
        </p>
        <div className="w-full md:w-80">
          <ClassesDropdownMenu
            classes={allClassOptions}
            onClassSelect={handleClassSelect}
            selectedId={selectedClassId}
          />
        </div>
      </div>

      <ActivityStatsSection
        userActivity={userActivity}
        progressData={progressData}
        loading={loading}
        userMode={userData?.settings?.mode}
        userName={userData?.firstName}
        role={UserRole.STUDENT}
        showRealtimeToggle={true}
        showLearningProgress={true}
        onRealtimeToggle={setIsRealtimeEnabled}
      />
    </div>
  );
};

export default StudentStatsView;
