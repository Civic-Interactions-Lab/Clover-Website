import { getTypingLogs, TypingLogsResponse } from "@/api/typing";
import CustomSelect from "@/components/CustomSelect";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { UserMode } from "@/types/user";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import StatCard from "@/components/StatCard";

interface TypingChartsProps {
  userId: string;
  mode: UserMode;
}

type IntervalType = "days" | "hours";
type ViewMode = "total" | "rate-minute" | "rate-hour" | "efficiency";

interface IntervalTypeOption {
  value: IntervalType;
  label: string;
  maxCount: number;
}

interface TypingLogEntry {
  id: string;
  userId: string;
  typedNumber: number;
  acceptedNumber: number;
  suggestionId?: string;
  suggestionLineId?: string;
  suggestionSelectionItemId?: string;
  createdAt: string;
}

const intervalTypeOptions: IntervalTypeOption[] = [
  { value: "hours", label: "Hours", maxCount: 24 },
  { value: "days", label: "Days", maxCount: 30 },
];

const TypingCharts = ({ userId, mode }: TypingChartsProps) => {
  const [selectedIntervalType, setSelectedIntervalType] =
    useState<IntervalType>("days");
  const [selectedCount, setSelectedCount] = useState(30);
  const [viewMode, setViewMode] = useState<ViewMode>("total");
  const [typingData, setTypingData] = useState<TypingLogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#000000");

  // Dark mode detection
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setTextColor(isDarkMode ? "#FFFFFF" : "#000000");
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Generate count options based on selected interval type
  const getCountOptions = () => {
    const maxCount =
      intervalTypeOptions.find((opt) => opt.value === selectedIntervalType)
        ?.maxCount || 1;
    return Array.from({ length: maxCount }, (_, i) => ({
      value: (i + 1).toString(),
      label: `${i + 1}`,
    }));
  };

  // Reset count when interval type changes
  useEffect(() => {
    const maxCount =
      intervalTypeOptions.find((opt) => opt.value === selectedIntervalType)
        ?.maxCount || 1;
    if (selectedCount > maxCount) {
      setSelectedCount(maxCount);
    }
  }, [selectedIntervalType, selectedCount]);

  useEffect(() => {
    const fetchTypingData = async () => {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await getTypingLogs({
        userId,
        mode,
        intervalType: selectedIntervalType,
        intervalCount: selectedCount,
      });

      if (apiError) {
        setError(apiError);
      } else {
        setTypingData(data || null);
      }
      setLoading(false);
    };

    fetchTypingData();
  }, [userId, mode, selectedIntervalType, selectedCount]);

  // Get chart type based on view mode
  const getChartType = () => {
    switch (viewMode) {
      case "total":
      case "rate-minute":
      case "rate-hour":
        return "bar";
      case "efficiency":
        return "stacked-bar";
      default:
        return "bar";
    }
  };

  // Enhanced data processing for multiple chart types and view modes
  const getChartData = () => {
    if (!typingData?.logs) return { labels: [], datasets: [] };

    const now = new Date();
    const timeGroups: {
      [key: string]: {
        typed: number;
        accepted: number;
        logs: TypingLogEntry[];
      };
    } = {};

    // Initialize time periods
    for (let i = selectedCount - 1; i >= 0; i--) {
      let date: Date;
      let label: string;

      switch (selectedIntervalType) {
        case "hours":
          date = new Date(now.getTime() - i * 60 * 60 * 1000);
          label = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          break;
        case "days":
          date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          label = date.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
          break;
        default:
          continue;
      }

      timeGroups[label] = { typed: 0, accepted: 0, logs: [] };
    }

    // Process logs - store logs for each time group
    typingData.logs.forEach((log) => {
      const logDate = new Date(log.createdAt);
      let label: string;

      switch (selectedIntervalType) {
        case "hours":
          label = logDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          break;
        case "days":
          label = logDate.toLocaleDateString([], {
            month: "short",
            day: "numeric",
          });
          break;
        default:
          return;
      }

      if (timeGroups[label]) {
        timeGroups[label].typed += log.typedNumber;
        timeGroups[label].accepted += log.acceptedNumber;
        timeGroups[label].logs.push(log);
      }
    });

    const labels = Object.keys(timeGroups);
    let typedData: number[];
    let acceptedData: number[];

    const chartType = getChartType();

    // Calculate data based on view mode
    switch (viewMode) {
      case "total":
        typedData = labels.map((label) => timeGroups[label].typed);
        acceptedData = labels.map((label) => timeGroups[label].accepted);
        break;

      case "rate-minute":
        // Rate per minute using actual time span
        typedData = labels.map((label) => {
          const group = timeGroups[label];
          if (group.typed === 0 || group.logs.length === 0) {
            return 0;
          }

          if (group.logs.length === 1) {
            // If only one log entry, assume 1 minute minimum
            return Number(group.typed.toFixed(2));
          }

          // Sort logs by createdAt to get first and last
          const sortedLogs = group.logs.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const firstLog = sortedLogs[0];
          const lastLog = sortedLogs[sortedLogs.length - 1];

          const durationMs =
            new Date(lastLog.createdAt).getTime() -
            new Date(firstLog.createdAt).getTime();
          const durationMinutes = Math.max(durationMs / (1000 * 60), 1); // At least 1 minute

          return Number((group.typed / durationMinutes).toFixed(2));
        });

        acceptedData = labels.map((label) => {
          const group = timeGroups[label];
          if (group.accepted === 0 || group.logs.length === 0) {
            return 0;
          }

          if (group.logs.length === 1) {
            // If only one log entry, assume 1 minute minimum
            return Number(group.accepted.toFixed(2));
          }

          // Sort logs by createdAt to get first and last
          const sortedLogs = group.logs.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const firstLog = sortedLogs[0];
          const lastLog = sortedLogs[sortedLogs.length - 1];

          const durationMs =
            new Date(lastLog.createdAt).getTime() -
            new Date(firstLog.createdAt).getTime();
          const durationMinutes = Math.max(durationMs / (1000 * 60), 1); // At least 1 minute

          return Number((group.accepted / durationMinutes).toFixed(2));
        });
        break;

      case "rate-hour":
        // Rate per hour using actual time span
        typedData = labels.map((label) => {
          const group = timeGroups[label];
          if (group.typed === 0 || group.logs.length === 0) {
            return 0;
          }

          if (group.logs.length === 1) {
            // If only one log entry, assume 1 minute and calculate hourly rate
            return Number((group.typed * 60).toFixed(0));
          }

          // Sort logs by createdAt to get first and last
          const sortedLogs = group.logs.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const firstLog = sortedLogs[0];
          const lastLog = sortedLogs[sortedLogs.length - 1];

          const durationMs =
            new Date(lastLog.createdAt).getTime() -
            new Date(firstLog.createdAt).getTime();
          const durationMinutes = Math.max(durationMs / (1000 * 60), 1); // At least 1 minute
          const hourlyRate = (group.typed / durationMinutes) * 60;

          return Number(hourlyRate.toFixed(0));
        });

        acceptedData = labels.map((label) => {
          const group = timeGroups[label];
          if (group.accepted === 0 || group.logs.length === 0) {
            return 0;
          }

          if (group.logs.length === 1) {
            // If only one log entry, assume 1 minute and calculate hourly rate
            return Number((group.accepted * 60).toFixed(0));
          }

          // Sort logs by createdAt to get first and last
          const sortedLogs = group.logs.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          const firstLog = sortedLogs[0];
          const lastLog = sortedLogs[sortedLogs.length - 1];

          const durationMs =
            new Date(lastLog.createdAt).getTime() -
            new Date(firstLog.createdAt).getTime();
          const durationMinutes = Math.max(durationMs / (1000 * 60), 1); // At least 1 minute
          const hourlyRate = (group.accepted / durationMinutes) * 60;

          return Number(hourlyRate.toFixed(0));
        });
        break;

      case "efficiency":
        // For efficiency stacked bar (100% view)
        typedData = labels.map((label) => {
          const total = timeGroups[label].typed + timeGroups[label].accepted;
          return total > 0
            ? Number(((timeGroups[label].typed / total) * 100).toFixed(1))
            : 0;
        });
        acceptedData = labels.map((label) => {
          const total = timeGroups[label].typed + timeGroups[label].accepted;
          return total > 0
            ? Number(((timeGroups[label].accepted / total) * 100).toFixed(1))
            : 0;
        });
        break;
    }

    // Configure datasets based on chart type
    const createDataset = (
      label: string,
      data: number[],
      color: string,
      isTyped: boolean
    ) => {
      const baseDataset: any = {
        label,
        data,
        backgroundColor: color + "CC",
        borderColor: color,
        borderWidth: 1,
      };

      // Add stack property for stacked bar charts
      if (chartType === "stacked-bar") {
        baseDataset.stack = "Stack 0";
      }

      return baseDataset;
    };

    const datasets = [
      createDataset(getDatasetLabel("typed"), typedData, "#F59E0B", true),
      createDataset(
        getDatasetLabel("accepted"),
        acceptedData,
        "#50B498",
        false
      ),
    ];

    return { labels, datasets };
  };

  const getDatasetLabel = (type: "typed" | "accepted") => {
    const baseLabel =
      type === "typed" ? "Characters Typed" : "Characters Accepted";

    switch (viewMode) {
      case "total":
        return `${baseLabel} (chars)`;
      case "rate-minute":
        return `${baseLabel} (chars/min)`;
      case "rate-hour":
        return `${baseLabel} (chars/hr)`;
      case "efficiency":
        return `${baseLabel} (%)`;
      default:
        return baseLabel;
    }
  };

  // Enhanced pie chart for efficiency
  const pieData = typingData
    ? {
        labels: ["Characters Typed", "Characters Accepted"],
        datasets: [
          {
            data: [typingData.typingRate, 100 - typingData.typingRate],
            backgroundColor: ["#50B498", "#F59E0B"],
            borderWidth: 2,
            borderColor: textColor + "20",
          },
        ],
      }
    : null;

  const pieOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: textColor,
          padding: 20,
        },
      },
    },
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    scales: {
      x: {
        stacked: getChartType() === "stacked-bar",
        ticks: {
          color: textColor,
        },
        grid: {
          color: textColor + "20",
        },
      },
      y: {
        stacked: getChartType() === "stacked-bar",
        beginAtZero: true,
        max: viewMode === "efficiency" ? 100 : undefined,
        ticks: {
          color: textColor,
          callback: function (value: any) {
            if (viewMode === "efficiency") {
              return value + "%";
            }
            if (viewMode === "rate-minute") {
              return value + " c/m";
            }
            if (viewMode === "rate-hour") {
              return value + " c/h";
            }
            return value;
          },
        },
        grid: {
          color: textColor + "20",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Coding Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="h-16 bg-muted animate-pulse rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-80">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Coding Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-80">
                <p className="text-red-500">Error: {error}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const typingRate = typingData?.typingRate || 0;
  const chartData = getChartData();
  const acceptanceRate = (() => {
    if (!typingData) return "0.0";

    const total = typingData.totalAccepted + typingData.totalTyped;
    if (total === 0) return "0.0";

    return ((typingData.totalAccepted / total) * 100).toFixed(1);
  })();

  const renderChart = () => {
    if (chartData.labels.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    return <Bar data={chartData} options={chartOptions} />;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Characters Typed"
          value={typingData?.totalTyped || 0}
          subtitle="manually entered"
          tooltipContent="Total number of characters typed manually by the user"
          textSize="text-sm"
        />
        <StatCard
          title="Characters Accepted"
          value={typingData?.totalAccepted || 0}
          subtitle="from AI assistant"
          tooltipContent="Total number of characters accepted from AI code suggestions"
          textSize="text-sm"
        />
        <StatCard
          title="Typing Rate"
          value={`${typingRate.toFixed(1)}%`}
          subtitle="chars per minute"
          tooltipContent="Average typing speed in characters per minute"
          textSize="text-sm"
        />
        <StatCard
          title="AI Accepting Rate"
          value={`${acceptanceRate}%`}
          subtitle="productivity boost"
          tooltipContent="Percentage of AI suggestions accepted, indicating productivity improvement"
          textSize="text-sm"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <Card className="p-6 col-span-1">
          <div className="flex items-center justify-between mb-6">
            <CustomTooltip
              trigger={
                <h2 className="text-lg font-semibold text-primary">
                  Typing vs AI Accepting
                </h2>
              }
              side="top"
              align="start"
            >
              <p className="text-sm">
                Shows how much the user types vs how much they accept from AI
                suggestions in {mode} mode.
              </p>
            </CustomTooltip>

            <div className="flex items-center gap-4">
              <CustomSelect
                value={selectedIntervalType}
                onValueChange={(value) =>
                  setSelectedIntervalType(value as IntervalType)
                }
                options={intervalTypeOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                placeholder="Interval Type"
                className="w-24"
              />
              <CustomSelect
                value={selectedCount.toString()}
                onValueChange={(value) => setSelectedCount(parseInt(value))}
                options={getCountOptions()}
                placeholder="Count"
                className="w-16"
              />
            </div>
          </div>

          <div className="relative w-full h-80">
            {pieData && typingData?.totalTyped ? (
              <Doughnut data={pieData} options={pieOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  No typing data available
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Trend Chart with Controls */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CustomTooltip
              trigger={
                <h2 className="text-lg font-semibold text-primary">
                  {viewMode === "total"
                    ? "Character"
                    : viewMode === "rate-minute"
                      ? "Typing Rate (Per Minute)"
                      : viewMode === "rate-hour"
                        ? "Typing Rate (Per Hour)"
                        : "Efficiency"}{" "}
                  Trends
                </h2>
              }
              side="top"
              align="start"
            >
              <p className="text-sm">
                {viewMode === "total" &&
                  "Shows total characters typed and characters accepted from AI over time."}
                {viewMode === "rate-minute" &&
                  "Shows typing and acceptance rate per minute based on actual activity duration within each time period."}
                {viewMode === "rate-hour" &&
                  "Shows typing and acceptance rate per hour based on actual activity duration within each time period."}
                {viewMode === "efficiency" &&
                  "Shows the percentage efficiency of AI usage over time (stacked to 100%)."}
              </p>
            </CustomTooltip>

            <div className="flex items-center gap-2">
              <CustomSelect
                value={viewMode}
                onValueChange={(value) => setViewMode(value as ViewMode)}
                options={[
                  { value: "total", label: "Total" },
                  { value: "rate-minute", label: "Rate/Min" },
                  { value: "rate-hour", label: "Rate/Hour" },
                  { value: "efficiency", label: "Efficiency" },
                ]}
                placeholder="View Mode"
                className="w-32"
              />
            </div>
          </div>

          <div className="relative w-full h-80">{renderChart()}</div>
        </Card>
      </div>
    </div>
  );
};

export default TypingCharts;
