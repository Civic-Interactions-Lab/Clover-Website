import { ActivityLogResponse } from "@/types/suggestion";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResponseTimeLineChartProps {
  userActivity: ActivityLogResponse;
  windowSize?: number;
  title?: string;
}

const ResponseTimeLineChart = ({
  userActivity,
  windowSize = 20,
  title = "Accept Response Time Trends & Correctness",
}: ResponseTimeLineChartProps) => {
  const [textColor, setTextColor] = useState("#000000");
  const [gridColor, setGridColor] = useState("rgba(255,255,255,0.1)");

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

  const chartData = useMemo(() => {
    if (!userActivity.length) {
      return {
        labels: [],
        datasets: [],
        isEmpty: true,
      };
    }

    // Filter only accepted suggestions and sort chronologically
    const acceptedActivity = [...userActivity]
      .filter((log) => log.event.includes("ACCEPT"))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((log, index) => {
        const hasBug = log.hasBug ?? false;
        const isCorrect = !hasBug;

        return {
          index: index + 1,
          duration: log.duration || 0,
          isCorrect,
          timestamp: new Date(log.createdAt).toLocaleTimeString(),
          hasBug,
        };
      });

    if (acceptedActivity.length === 0) {
      return {
        labels: [],
        datasets: [],
        isEmpty: true,
      };
    }

    // Helper function to calculate rolling average
    const calculateRollingAverage = (
      data: typeof acceptedActivity,
      filterFn?: (item: (typeof acceptedActivity)[0]) => boolean
    ) => {
      const filtered = filterFn ? data.filter(filterFn) : data;
      if (filtered.length === 0) return [];

      const rollingData: { x: number; y: number }[] = [];

      filtered.forEach((_, index) => {
        const startIndex = Math.max(0, index - windowSize + 1);
        const window = filtered.slice(startIndex, index + 1);
        const avgDuration =
          window.reduce((sum, item) => sum + item.duration, 0) / window.length;

        rollingData.push({
          x: filtered[index].index,
          y: Math.round(avgDuration * 100) / 100,
        });
      });

      return rollingData;
    };

    // Create rolling averages for different categories
    const allAcceptTimes = calculateRollingAverage(acceptedActivity);
    const correctAcceptTimes = calculateRollingAverage(
      acceptedActivity,
      (item) => item.isCorrect
    );
    const incorrectAcceptTimes = calculateRollingAverage(
      acceptedActivity,
      (item) => !item.isCorrect
    );

    return {
      labels: acceptedActivity.map((item) => item.index),
      datasets: [
        {
          label: `All Accept Time (${windowSize}-avg)`,
          data: allAcceptTimes,
          borderColor: "#6B7280", // gray
          backgroundColor: "#6B7280",
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0.3,
          borderWidth: 3,
          borderDash: [5, 5], // dashed line
        },
        {
          label: `Correct Accept Time (${windowSize}-avg)`,
          data: correctAcceptTimes,
          borderColor: "#10B981", // green
          backgroundColor: "#10B981",
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0.3,
          borderWidth: 3,
        },
        {
          label: `Incorrect Accept Time (${windowSize}-avg)`,
          data: incorrectAcceptTimes,
          borderColor: "#EF4444", // red
          backgroundColor: "#EF4444",
          pointRadius: 0,
          pointHoverRadius: 6,
          tension: 0.3,
          borderWidth: 3,
        },
      ].filter((dataset) => dataset.data.length > 0), // Only include datasets with data
      isEmpty: false,
      activityData: acceptedActivity,
      stats: {
        totalAccepted: acceptedActivity.length,
        correctCount: acceptedActivity.filter((item) => item.isCorrect).length,
        incorrectCount: acceptedActivity.filter((item) => !item.isCorrect)
          .length,
      },
    };
  }, [userActivity, windowSize]);

  if (chartData.isEmpty) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-alpha">{title}</h2>
            }
            children={
              <div className="space-y-2">
                <p className="text-sm">
                  This chart shows your response time trends for{" "}
                  <span className="font-semibold text-alpha">
                    accepted suggestions only
                  </span>{" "}
                  using a rolling{" "}
                  <span className="font-semibold text-alpha">
                    {windowSize}-suggestion
                  </span>{" "}
                  average, comparing correct vs incorrect acceptances.
                </p>
                <p className="text-xs text-muted-foreground">
                  Helps identify if faster or slower acceptance decisions lead
                  to better outcomes.
                </p>
              </div>
            }
          />
        </div>
        <div className="flex items-center justify-center h-60 text-muted-foreground">
          No accepted suggestion data available
        </div>
      </Card>
    );
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          title: function (context) {
            const index = context[0]?.parsed?.x;
            if (index && chartData.activityData) {
              const item = chartData.activityData.find(
                (item) => item.index === index
              );
              return `Accept #${index} - ${item?.timestamp || ""}`;
            }
            return `Accept #${index}`;
          },
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}ms`;
          },
          afterLabel: function (context) {
            const index = context.parsed?.x;
            if (index && chartData.activityData) {
              const item = chartData.activityData.find(
                (item) => item.index === index
              );
              const status = item?.isCorrect
                ? "✓ Correct (No Bug)"
                : "✗ Incorrect (Has Bug)";
              return [`(Rolling ${windowSize}-suggestion average)`, status];
            }
            return `(Rolling ${windowSize}-suggestion average)`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Accepted Suggestion Number (Chronological Order)",
          color: textColor,
        },
        ticks: {
          color: textColor,
          stepSize: 1,
        },
        grid: { color: gridColor },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Average Response Time (ms)",
          color: textColor,
        },
        ticks: {
          color: textColor,
          callback: function (value) {
            return `${value}ms`;
          },
        },
        grid: { color: gridColor },
        beginAtZero: true,
      },
    },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <CustomTooltip
          trigger={
            <h2 className="text-lg font-semibold text-alpha">{title}</h2>
          }
          children={
            <div className="space-y-2">
              <p className="text-sm">
                This chart tracks{" "}
                <span className="font-semibold text-alpha">
                  acceptance response time trends
                </span>{" "}
                using a rolling{" "}
                <span className="font-semibold text-alpha">
                  {windowSize}-suggestion
                </span>{" "}
                average, showing how quickly you accept suggestions and whether
                faster or slower decisions lead to better outcomes.
              </p>
              <div className="space-y-1 text-xs">
                <p>
                  <span className="inline-block w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                  All Accept Time: Rolling average for all accepted suggestions
                </p>
                <p>
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Correct Accept Time: Rolling average for correct acceptances
                  (no bugs)
                </p>
                <p>
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  Incorrect Accept Time: Rolling average for incorrect
                  acceptances (with bugs)
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Compare the green and red lines to see if faster or slower
                decisions correlate with better outcomes.
              </p>
            </div>
          }
        />
      </div>

      {chartData.stats && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              Total Accepted: <strong>{chartData.stats.totalAccepted}</strong>
            </span>
            <span className="text-green-600">
              Correct: <strong>{chartData.stats.correctCount}</strong>
            </span>
            <span className="text-red-600">
              Incorrect: <strong>{chartData.stats.incorrectCount}</strong>
            </span>
            <span>
              Accuracy:{" "}
              <strong>
                {Math.round(
                  (chartData.stats.correctCount /
                    chartData.stats.totalAccepted) *
                    100
                )}
                %
              </strong>
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full h-60 md:h-64 lg:h-72">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ResponseTimeLineChart;
