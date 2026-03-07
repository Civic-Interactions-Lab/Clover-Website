import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import ClassesDropdownMenu from "@/pages/dashboard/ui/components/ClassesDropdownMenu";
import Loading from "@/components/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import ActivityStatsSection from "../../components/ActivityStatsSection";
import { EnrollmentStatus, UserRole } from "@/types/user";
import { supabase } from "@/lib/supabaseClient.ts";
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
      const { data, error } = await supabase
        .from("user_class")
        .select(
          `
          enrollment_status,
          classes (
            id,
            class_title,
            class_code,
            class_hex_color
          )
        `,
        )
        .eq("student_id", userData.id)
        .eq("enrollment_status", EnrollmentStatus.ENROLLED);

      if (error) {
        console.error(error);
        setClassesLoading(false);
        return;
      }

      const enrolled = (data ?? [])
        .filter((row: any) => row.classes)
        .map((row: any) => ({
          id: row.classes.id,
          classTitle: row.classes.class_title,
          classCode: row.classes.class_code,
          classHexColor: row.classes.class_hex_color,
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

    const { data, error } = await supabase
      .from("line_suggestions_log")
      .select(
        `
        id,
        created_at,
        event,
        duration,
        class_id,
        line_suggestion_id,
        line_suggestions (
          id,
          shown_bug,
          correct_line,
          incorrect_line,
          bug_percentage
        )
      `,
      )
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const mapped: UserActivityLogItem[] = (data ?? []).map(
      (row: any) =>
        ({
          id: row.id,
          createdAt: row.created_at,
          event: row.event,
          duration: row.duration,
          userId: userData.id,
          classId: row.class_id ?? undefined,
          lineSuggestionId: row.line_suggestion_id,
          hasBug: row.line_suggestions?.shown_bug ?? false,
          suggestions: {
            id: row.line_suggestions?.id ?? "",
            createdAt: row.created_at,
            hasBug: row.line_suggestions?.shown_bug ?? false,
            shownBug: row.line_suggestions?.shown_bug ?? false,
            correctLine: row.line_suggestions?.correct_line ?? "",
            incorrectLine: row.line_suggestions?.incorrect_line ?? "",
            lineIndex: row.line_suggestions?.line_index ?? undefined,
            suggestions: [],
            prompt: "",
            duration: row.duration,
            model: "",
            vendor: "",
          },
        }) as UserActivityLogItem,
    );

    setRawLogs(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [userData?.id]);

  // ── Realtime ──
  useEffect(() => {
    if (!isRealtimeEnabled || !userData?.id) return;

    const channel = supabase
      .channel(`student-stats-realtime-${userData.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "line_suggestions_log",
          filter: `user_id=eq.${userData.id}`,
        },
        () => fetchLogs(),
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED")
          console.log("[Realtime] Student stats connected");
        else if (err) console.error("[Realtime] Error:", err.message);
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
