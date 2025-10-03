import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Card } from "@/components/ui/card";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";
import { ActivityLogResponse } from "@/types/suggestion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

/**
 * MinuteDecisionChart component displays a bar chart of user activity per minute with a trend line.
 * @param {string} title - The title of the chart.
 * @param {Array} activities - An array of user activity log items.
 * @returns {JSX.Element} - A bar chart component showing decisions per minute with acceptance trend.
 **/
export const MinuteDecisionChart = ({
  title = "Decisions Per Minute",
  activities,
}: {
  title?: string;
  activities: ActivityLogResponse;
}) => {
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

  const groupByMinute = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const acceptedMap: Record<string, number> = {};
  const rejectedMap: Record<string, number> = {};
  const allMinuteKeys = new Set<string>();

  activities.forEach((activity) => {
    const date =
      typeof activity.createdAt === "string"
        ? new Date(activity.createdAt)
        : new Date(activity.createdAt);

    const key = groupByMinute(date);
    allMinuteKeys.add(key);

    const isAcceptEvent = ACCEPT_EVENTS.includes(activity.event);
    const isRejectEvent = REJECT_EVENTS.includes(activity.event);

    if (key) {
      if (isAcceptEvent) {
        acceptedMap[key] = (acceptedMap[key] || 0) + 1;
      } else if (isRejectEvent) {
        rejectedMap[key] = (rejectedMap[key] || 0) + 1;
      }
    }
  });

  // Sort the minute keys chronologically
  const labels = Array.from(allMinuteKeys).sort();

  const acceptedValues = labels.map((key) => acceptedMap[key] || 0);
  const rejectedValues = labels.map((key) => rejectedMap[key] || 0);

  const trendLineData = acceptedValues;

  const formatTimeLabel = (timestamp: string): string => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${month}/${day} ${hours}:${minutes}`;
  };

  const totalAccepted = acceptedValues.reduce((sum, val) => sum + val, 0);
  const totalRejected = rejectedValues.reduce((sum, val) => sum + val, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <CustomTooltip
          trigger={
            <h2 className="text-lg font-semibold text-alpha">{title}</h2>
          }
        >
          <div className="space-y-2">
            <p className="text-sm">
              This bar chart shows how many code suggestions users{" "}
              <span className="font-semibold text-alpha">accepted</span> or{" "}
              <span className="font-semibold text-beta">rejected</span> per
              minute.
            </p>
            <p className="text-xs text-muted-foreground">
              The green curve shows the acceptance trend using a moving average.
            </p>
            <p className="text-xs text-muted-foreground">
              Total: {totalAccepted} accepted, {totalRejected} rejected
            </p>
          </div>
        </CustomTooltip>
      </div>

      {labels.length === 0 ? (
        <div className="flex items-center justify-center h-60 text-muted-foreground">
          No activity data available
        </div>
      ) : (
        <div className="relative w-full h-60 md:h-64 lg:h-72">
          <Chart
            type="bar"
            data={{
              labels,
              datasets: [
                {
                  type: "bar" as const,
                  label: "Accepted",
                  data: acceptedValues,
                  backgroundColor: "#50B498",
                  borderColor: "#50B498",
                  borderWidth: 1,
                  order: 2,
                },
                {
                  type: "bar" as const,
                  label: "Rejected",
                  data: rejectedValues,
                  backgroundColor: "#F59E0B",
                  borderColor: "#F59E0B",
                  borderWidth: 1,
                  order: 2,
                },
                {
                  type: "line" as const,
                  label: "Acceptance Trend",
                  data: trendLineData,
                  borderColor: "#50B498",
                  backgroundColor: "rgba(80, 180, 152, 0.1)",
                  borderWidth: 2,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 4,
                  fill: true,
                  order: 1,
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
                    title: (tooltipItems) => {
                      const label = tooltipItems[0].label;
                      const date = new Date(label);
                      return date.toLocaleString();
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
                    minRotation: 45,
                    callback: function (value: unknown) {
                      const label = labels[value as number];
                      return formatTimeLabel(label);
                    },
                    autoSkip: true,
                    maxTicksLimit: 15,
                  },
                  grid: { color: gridColor },
                  title: {
                    display: true,
                    text: "Time",
                    color: textColor,
                    font: {
                      size: 12,
                      weight: "bold" as const,
                    },
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: textColor,
                    precision: 0,
                    stepSize: 1,
                  },
                  grid: { color: gridColor },
                  title: {
                    display: true,
                    text: "Number of Decisions",
                    color: textColor,
                    font: {
                      size: 12,
                      weight: "bold" as const,
                    },
                  },
                },
              },
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default MinuteDecisionChart;
