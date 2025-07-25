import StatCard from "@/components/StatCard";
import { DecisionLineChart } from "./DecisionLineChart";
import { AccuracyDistributionBarChart } from "./AccuracyDistributionBarChart";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import ModalContainer from "@/components/ModalContainer";
import AccuracyPieChart from "@/pages/dashboard/ui/components/AccuracyPieChart";
import { useUserActivity } from "@/pages/dashboard/hooks/useUserActivity";
import { useState } from "react";
import Loading from "@/components/Loading";
import { StudentClassData } from "@/types/class";
import ResponseTimeBarChart from "./ResponseTimeBarChart";
import AccuracyTimeLineChart from "./AccuracyTimeLineChart";
import LearningProgressChart from "./LearningProgressChart";

interface StudentDashboardCardProps {
  student: StudentClassData;
  onClose?: () => void;
}

/**
 * A modal card that displays detailed information about a student.
 * It includes charts and statistics related to the student's performance.
 * @param param0 - The props for the StudentDashboardCard component.
 * @param {StudentClassData} param0.student - The student data to be displayed.
 * @param {function} [param0.onClose] - The function to call when the card is closed.
 * @returns {JSX.Element} - The rendered card component.
 */
export const StudentDashboardCard = ({
  student,
  onClose,
}: StudentDashboardCardProps) => {
  const { userActivity, progressData, loading } = useUserActivity(
    student.userId,
    student.mode,
    student.classId
  );

  const [pieChartData, setPieChartData] = useState<{
    mode: "total" | "accepted" | "rejected";
    statData: {
      total: number;
      correct: number;
      accuracy: number;
      title: string;
    };
  } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading your data" />
      </div>
    );
  }

  const statData = pieChartData?.statData || {
    total: progressData.totalInteractions,
    correct: progressData.correctSuggestions,
    accuracy:
      progressData.totalInteractions > 0
        ? (progressData.correctSuggestions / progressData.totalInteractions) *
          100
        : 0,
    title: "Total",
  };

  const dataMode = pieChartData?.mode || "total";

  return (
    <ModalContainer isOpen={!!student} onClose={() => onClose && onClose()}>
      <Card
        className="overflow-hidden w-full max-w-2xl lg:max-w-4xl space-y-6 max-h-[85vh] flex flex-col overflow-y-auto pt-8 pb-8 bg-white dark:bg-gray-900"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="px-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white pb-1">
                  {student.fullName || "Student Details"}
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {student.classTitle}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close dashboard"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="px-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              title={statData.title}
              value={statData.total}
              tooltipContent={`Total ${dataMode} suggestions.`}
            />
            <StatCard
              title="Correct"
              value={statData.correct}
              tooltipContent={`Number of ${dataMode} suggestions that were correct.`}
            />
            <StatCard
              title="Accuracy"
              value={`${statData.accuracy.toFixed(1)}%`}
              tooltipContent={`Accuracy rate for ${dataMode} suggestions.`}
            />
          </div>

          <div className=" grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AccuracyPieChart
              progressData={progressData}
              onDataChange={setPieChartData}
            />
            <DecisionLineChart activities={userActivity} />
          </div>

          <AccuracyDistributionBarChart activities={userActivity} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ResponseTimeBarChart
              userActivity={userActivity}
              title="Average Response Time"
            />

            <AccuracyTimeLineChart userActivity={userActivity} />
          </div>

          <LearningProgressChart
            userActivity={userActivity}
            windowSize={20}
            title="Learning Progress"
          />
        </div>
      </Card>
    </ModalContainer>
  );
};

export default StudentDashboardCard;
