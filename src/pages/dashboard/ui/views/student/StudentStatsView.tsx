import { useUserClasses } from "@/hooks/useUserClasses";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import ClassesDropdownMenu from "@/pages/dashboard/ui/components/ClassesDropdownMenu";
import Loading from "@/components/Loading";
import { useLocation, useNavigate } from "react-router-dom";
import ActivityStatsSection from "../../components/ActivityStatsSection";
import { useUserActivity } from "@/pages/dashboard/hooks/useUserActivity";
import { UserMode, UserRole } from "@/types/user";
import { UserActivityLogItem } from "@/types/suggestion.ts";
import SuggestionDetailsView from "@/pages/dashboard/ui/views/student/SuggestionDetailsView.tsx";

/**
 * StudentStatsView component that displays user activity and progress.
 * @param userData - The user data to display in the dashboard.
 * @returns StudentStatsView component that displays user activity and progress.
 */
const StudentStatsView = ({ description }: { description?: string }) => {
  const { userData } = useUser();

  const location = useLocation();
  const navigate = useNavigate();
  const preselectedClassId = location.state?.preselectedClassId;
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);

  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    logItem: UserActivityLogItem;
    logItems: UserActivityLogItem[];
    currentIndex: number;
    mode: UserMode;
    correctness: string;
  } | null>(null);

  useEffect(() => {
    if (preselectedClassId) {
      navigate(location.pathname, { replace: true });
    }
  }, [preselectedClassId, location.pathname, navigate]);

  const {
    allClassOptions,
    selectedClassId,
    handleClassSelect,
    loading: userClassLoading,
  } = useUserClasses(userData?.id, preselectedClassId || "all");

  const { userActivity, loading, progressData } = useUserActivity(
    userData?.id,
    userData?.settings?.mode,
    selectedClassId,
    isRealtimeEnabled,
  );

  useEffect(() => {
    if (preselectedClassId && location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [preselectedClassId, location.state]);

  const handleSuggestionClick = (
    logItem: UserActivityLogItem,
    index: number,
    allLogItems: UserActivityLogItem[],
  ) => {
    const isAccept =
      logItem.event.includes("ACCEPT") || logItem.event.includes("accept");
    const hasBug = logItem.hasBug || logItem.hasBug;
    const isCorrect = (isAccept && !hasBug) || (!isAccept && hasBug);
    const correctness = isCorrect ? "Correct" : "Incorrect";

    setSelectedSuggestion({
      logItem,
      logItems: allLogItems,
      currentIndex: index,
      mode: userData?.settings?.mode || UserMode.CODE_BLOCK,
      correctness,
    });
  };

  const handleBackFromSuggestionDetails = () => {
    setSelectedSuggestion(null);
  };

  if (userClassLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading your data" />
      </div>
    );
  }

  return (
    <>
      {selectedSuggestion ? (
        <SuggestionDetailsView
          logItem={selectedSuggestion.logItem}
          logItems={selectedSuggestion.logItems}
          initialIndex={selectedSuggestion.currentIndex}
          mode={selectedSuggestion.mode}
          onBack={handleBackFromSuggestionDetails}
        />
      ) : (
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
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      )}
    </>
  );
};

export default StudentStatsView;
