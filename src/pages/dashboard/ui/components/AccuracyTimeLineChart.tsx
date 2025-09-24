import { ActivityLogResponse } from "@/types/suggestion";
import CustomSelect from "@/components/CustomSelect";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { parseISODate } from "@/utils/timeConverter";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";

enum TimeInterval {
  DAY = "Day",
  WEEK = "Week",
  MONTH = "Month",
}

enum EventFilter {
  TOTAL = "Total",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

interface AccuracyOverTimeProps {
  title?: string;
  userActivity: ActivityLogResponse;
}

const AccuracyTimeLineChart = ({
  title = "Accuracy Over Time",
  userActivity,
}: AccuracyOverTimeProps) => {
  const [interval, setInterval] = useState<TimeInterval>(TimeInterval.DAY);
  const [eventFilter, setEventFilter] = useState<EventFilter>(
    EventFilter.TOTAL
  );
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

  const labels = getLabelRange();

  // Filter and calculate accuracy based on selected event filter
  const calculateAccuracy = () => {
    const accuracyMap: Record<string, { total: number; correct: number }> = {};

    userActivity.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const key = groupBy(date, interval);

      if (!key) return;

      let shouldInclude = false;
      let isCorrect = false;

      if (
        eventFilter === EventFilter.ACCEPT &&
        activity.event === "SUGGESTION_LINE_ACCEPT"
      ) {
        shouldInclude = true;
        isCorrect = !activity.hasBug; // Correct if accepted suggestion has no bug
      } else if (
        eventFilter === EventFilter.REJECT &&
        activity.event === "SUGGESTION_LINE_REJECT"
      ) {
        shouldInclude = true;
        isCorrect = activity.hasBug === true; // Correct if rejected suggestion has bug
      } else if (
        eventFilter === EventFilter.TOTAL &&
        (activity.event === "SUGGESTION_LINE_ACCEPT" ||
          activity.event === "SUGGESTION_LINE_REJECT")
      ) {
        shouldInclude = true;
        isCorrect =
          (activity.event === "SUGGESTION_LINE_ACCEPT" && !activity.hasBug) ||
          (activity.event === "SUGGESTION_LINE_REJECT" && activity.hasBug) ||
          false;
      }

      if (shouldInclude) {
        if (!accuracyMap[key]) {
          accuracyMap[key] = { total: 0, correct: 0 };
        }
        accuracyMap[key].total++;
        if (isCorrect) {
          accuracyMap[key].correct++;
        }
      }
    });

    return accuracyMap;
  };

  const accuracyMap = calculateAccuracy();

  // Calculate accuracy percentages for each time period
  const accuracyValues = labels.map((key) => {
    const stats = accuracyMap[key];
    if (!stats || stats.total === 0) return 0;
    return (stats.correct / stats.total) * 100;
  });

  // Calculate total suggestions for each time period (for tooltip)
  const totalValues = labels.map((key) => accuracyMap[key]?.total || 0);

  const getTooltipDescription = () => {
    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return "Shows accuracy for accepted suggestions only. Accuracy = percentage of accepted suggestions that had no bugs.";
      case EventFilter.REJECT:
        return "Shows accuracy for rejected suggestions only. Accuracy = percentage of rejected suggestions that correctly had bugs.";
      case EventFilter.TOTAL:
        return "Shows overall accuracy combining accepts and rejects. Accuracy = percentage of correct decisions (accepting good suggestions + rejecting buggy suggestions).";
      default:
        return "";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-alpha">{title}</h2>
            }
            children={
              <div className="space-y-2">
                <p className="text-sm">{getTooltipDescription()}</p>
                <p className="text-xs text-muted-foreground">
                  Use the filter to view accuracy for different event types.
                  Time range can be adjusted (daily/weekly/monthly).
                </p>
              </div>
            }
          />
        </div>

        <div className="flex gap-2">
          <CustomSelect
            value={eventFilter}
            onValueChange={(value) => setEventFilter(value as EventFilter)}
            options={[
              { value: EventFilter.TOTAL, label: "Total" },
              { value: EventFilter.ACCEPT, label: "Accept" },
              { value: EventFilter.REJECT, label: "Reject" },
            ]}
            className="w-24"
          />
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
      </div>

      <div className="relative w-full h-60 md:h-64 lg:h-72">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Accuracy (%)",
                data: accuracyValues,
                borderColor: "#50B498",
                backgroundColor: "#50B498",
                borderWidth: 3,
                tension: 0.3,
                fill: false,
                pointBackgroundColor: "#50B498",
                pointBorderColor: "#FFFFFF",
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                spanGaps: false,
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
                    const accuracy = context.parsed.y;
                    const total = totalValues[context.dataIndex];

                    if (total === 0) return "No suggestions";

                    const eventType =
                      eventFilter === EventFilter.TOTAL
                        ? "total suggestions"
                        : `${eventFilter.toLowerCase()}ed suggestions`;

                    return `Accuracy: ${accuracy.toFixed(1)}% (${total} ${eventType})`;
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
                max: 120,
                ticks: {
                  color: textColor,
                  callback: function (value) {
                    if (value === 120) return "";
                    return value + "%";
                  },
                },
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: "Accuracy (%)",
                  color: textColor,
                },
              },
            },
            elements: {
              point: {
                hoverBackgroundColor: "#50B498",
              },
            },
          }}
        />
      </div>
    </Card>
  );
};

export default AccuracyTimeLineChart;
