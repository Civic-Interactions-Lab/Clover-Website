import React, { useEffect, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { parseISODate } from "@/utils/timeConverter";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useErrors } from "../../hooks/useErrors";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

enum TimeInterval {
  DAY = "Day",
  WEEK = "Week",
  MONTH = "Month",
}

interface ErrorChartsProps {
  className?: string;
}

const ErrorCharts = ({ className }: ErrorChartsProps) => {
  const [interval, setInterval] = useState<TimeInterval>(TimeInterval.DAY);
  const [textColor, setTextColor] = useState("#000000");
  const [gridColor, setGridColor] = useState("rgba(255,255,255,0.1)");

  // Fetch errors data
  const {
    errors,
    isLoading,
    error: fetchError,
  } = useErrors({
    limit: 1000, // Get more data for charts
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setTextColor(isDarkMode ? "#FFFFFF" : "#000000");
      setGridColor(isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)");
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const groupBy = (date: Date, interval: TimeInterval) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (interval === TimeInterval.DAY) return date.toISOString().split("T")[0];

    if (interval === TimeInterval.WEEK) {
      const firstDay = new Date(date);
      firstDay.setDate(date.getDate() - date.getDay());

      const y = firstDay.getFullYear();
      const m = String(firstDay.getMonth() + 1).padStart(2, "0");
      const d = String(firstDay.getDate()).padStart(2, "0");

      return `${y}-${m}-${d}`;
    }

    if (interval === TimeInterval.MONTH)
      return `${year}-${String(month + 1).padStart(2, "0")}`;

    return "";
  };

  const getLabelRange = () => {
    const range: string[] = [];
    const today = new Date();

    if (interval === TimeInterval.DAY) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        range.push(groupBy(date, interval)!);
      }
    }

    if (interval === TimeInterval.WEEK) {
      for (let i = 5; i >= -1; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i * 7);
        range.push(groupBy(date, interval)!);
      }
    }

    if (interval === TimeInterval.MONTH) {
      for (let i = 5; i >= -1; i--) {
        const date = new Date(today);
        date.setMonth(today.getMonth() - i);
        range.push(groupBy(date, interval)!);
      }
    }

    return range;
  };

  // Process error data for charts
  const processErrorsOverTime = () => {
    const errorMap: Record<string, Record<string, number>> = {};
    const labels = getLabelRange();

    // Initialize all periods with zero counts for each level
    labels.forEach((label) => {
      errorMap[label] = {
        INFO: 0,
        WARNING: 0,
        ERROR: 0,
        CRITICAL: 0,
      };
    });

    errors.forEach((error) => {
      const date = new Date(error.createdAt);
      const key = groupBy(date, interval);

      if (key && errorMap[key]) {
        errorMap[key][error.level] = (errorMap[key][error.level] || 0) + 1;
      }
    });

    return { errorMap, labels };
  };

  const processErrorsByCategory = () => {
    const categoryMap: Record<string, number> = {};

    errors.forEach((error) => {
      categoryMap[error.category] = (categoryMap[error.category] || 0) + 1;
    });

    return categoryMap;
  };

  const processErrorsByLevel = () => {
    const levelMap: Record<string, number> = {
      INFO: 0,
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0,
    };

    errors.forEach((error) => {
      levelMap[error.level] = (levelMap[error.level] || 0) + 1;
    });

    return levelMap;
  };

  const processResolutionStats = () => {
    const resolved = errors.filter((error) => error.resolved).length;
    const unresolved = errors.filter((error) => !error.resolved).length;

    return { resolved, unresolved };
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (fetchError || errors.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            {fetchError ? "Error loading data" : "No error data available"}
          </p>
        </Card>
      </div>
    );
  }

  const { errorMap, labels } = processErrorsOverTime();
  const categoryData = processErrorsByCategory();
  const levelData = processErrorsByLevel();
  const resolutionData = processResolutionStats();

  const levelColors = {
    INFO: "#50B498",
    WARNING: "#F59E0B",
    ERROR: "#EF4444",
    CRITICAL: "#7C3AED",
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Errors Over Time Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <CustomTooltip
              trigger={
                <h2 className="text-lg font-semibold text-alpha">
                  Errors Over Time
                </h2>
              }
              children={
                <div className="space-y-2">
                  <p className="text-sm">
                    This chart shows the distribution of errors by severity
                    level over time.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Time range can be adjusted (daily/weekly/monthly).
                  </p>
                </div>
              }
            />
          </div>

          <CustomSelect
            value={interval}
            onValueChange={(value) => setInterval(value as TimeInterval)}
            options={[
              { value: TimeInterval.DAY, label: "Day" },
              { value: TimeInterval.WEEK, label: "Week" },
              { value: TimeInterval.MONTH, label: "Month" },
            ]}
            className="w-24"
          />
        </div>

        <div className="relative w-full h-60 md:h-64 lg:h-72">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Info",
                  data: labels.map((label) => errorMap[label]?.INFO || 0),
                  borderColor: levelColors.INFO,
                  backgroundColor: levelColors.INFO,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                },
                {
                  label: "Warning",
                  data: labels.map((label) => errorMap[label]?.WARNING || 0),
                  borderColor: levelColors.WARNING,
                  backgroundColor: levelColors.WARNING,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                },
                {
                  label: "Error",
                  data: labels.map((label) => errorMap[label]?.ERROR || 0),
                  borderColor: levelColors.ERROR,
                  backgroundColor: levelColors.ERROR,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                },
                {
                  label: "Critical",
                  data: labels.map((label) => errorMap[label]?.CRITICAL || 0),
                  borderColor: levelColors.CRITICAL,
                  backgroundColor: levelColors.CRITICAL,
                  borderWidth: 2,
                  tension: 0.3,
                  fill: false,
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  labels: { color: textColor },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return `${context.dataset.label}: ${context.parsed.y}`;
                    },
                  },
                },
              },
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: {
                    color: textColor,
                    callback: function (value: unknown) {
                      const label = labels[value as number];
                      const date = parseISODate(label + "T00:00:00");

                      if (interval === TimeInterval.MONTH)
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                      if (interval === TimeInterval.WEEK)
                        return `Week of ${date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}`;
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    },
                  },
                  grid: { color: gridColor },
                },
                y: {
                  beginAtZero: true,

                  ticks: {
                    color: textColor,
                    stepSize: 1,
                    callback: function (value) {
                      if (Number.isInteger(value)) {
                        return value;
                      }
                      return null;
                    },
                  },
                  grid: { color: gridColor },
                  title: {
                    display: true,
                    text: "Error Count",
                    color: textColor,
                  },
                },
              },
            }}
          />
        </div>
      </Card>

      {/* Error Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-alpha mb-4">
                Error Level Distribution
              </h2>
            }
            children={
              <p className="text-sm">
                Distribution of errors by severity level (Info, Warning, Error,
                Critical).
              </p>
            }
          />

          <div className="relative w-full h-64">
            <Doughnut
              data={{
                labels: Object.keys(levelData),
                datasets: [
                  {
                    data: Object.values(levelData),
                    backgroundColor: Object.keys(levelData).map(
                      (level) => levelColors[level as keyof typeof levelColors]
                    ),
                    borderWidth: 2,
                    borderColor: textColor,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    labels: { color: textColor },
                    position: "bottom",
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const total = Object.values(levelData).reduce(
                          (a, b) => a + b,
                          0
                        );
                        const percentage = (
                          (context.parsed / total) *
                          100
                        ).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </Card>

        {/* Error Categories */}
        <Card className="p-6">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-alpha mb-4">
                Top Error Categories
              </h2>
            }
            children={
              <p className="text-sm">
                Most common error categories in your system.
              </p>
            }
          />

          <div className="relative w-full h-64">
            <Bar
              data={{
                labels: Object.keys(categoryData).slice(0, 8), // Show top 8 categories
                datasets: [
                  {
                    label: "Error Count",
                    data: Object.values(categoryData).slice(0, 8),
                    backgroundColor: "#50B498",
                    borderColor: "#50B498",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `Count: ${context.parsed.y}`;
                      },
                    },
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    ticks: {
                      color: textColor,
                      maxRotation: 45,
                    },
                    grid: { color: gridColor },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      color: textColor,
                    },
                    grid: { color: gridColor },
                    title: {
                      display: true,
                      text: "Error Count",
                      color: textColor,
                    },
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Resolution Status */}
      <Card className="p-6">
        <CustomTooltip
          trigger={
            <h2 className="text-lg font-semibold text-alpha mb-4">
              Resolution Status
            </h2>
          }
          children={
            <p className="text-sm">
              Overview of resolved vs unresolved errors in your system.
            </p>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {resolutionData.resolved}
            </div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-beta">
              {resolutionData.unresolved}
            </div>
            <div className="text-sm text-muted-foreground">Unresolved</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {(
                (resolutionData.resolved /
                  (resolutionData.resolved + resolutionData.unresolved)) *
                100
              ).toFixed(1)}
              %
            </div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ErrorCharts;
