import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { parseISODate } from "@/utils/timeConverter";
import { Card } from "@/components/ui/card";
import { ActivityLogResponse } from "@/types/suggestion";
import CustomSelect from "@/components/CustomSelect";
import { CustomTooltip } from "@/components/CustomTooltip";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";

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

/**
 * AccuracyDistributionBarChart component displays a stacked bar chart of user activity log items.
 * It shows the number of correct and incorrect suggestions over time, grouped by day, week, or month.
 * @param props - The props for the AccuracyDistributionBarChart component.
 * @param {string?} props.title - The title of the chart.
 * @param {UserActivityLogItem[]} props.activities - The user activity log items to be displayed in the chart.
 * @returns
 */
export const AccuracyDistributionBarChart = ({
  title = "Correct vs Incorrect Over Time",
  activities,
}: {
  title?: string;
  activities: ActivityLogResponse;
}) => {
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

  const groupBy = (date: Date, interval: TimeInterval): string => {
    const year = date.getFullYear();
    const month = date.getMonth();

    switch (interval) {
      case TimeInterval.DAY:
        return date.toISOString().split("T")[0];

      case TimeInterval.WEEK: {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());

        const y = weekStart.getFullYear();
        const m = String(weekStart.getMonth() + 1).padStart(2, "0");
        const d = String(weekStart.getDate()).padStart(2, "0");

        return `${y}-${m}-${d}`;
      }

      case TimeInterval.MONTH:
        return `${year}-${String(month + 1).padStart(2, "0")}`;

      default:
        return "";
    }
  };

  const dateMap: Record<string, { correct: number; incorrect: number }> = {};

  // Filter activities based on event filter
  const filteredActivities = activities.filter((activity) => {
    const isAcceptEvent = ACCEPT_EVENTS.includes(activity.event);
    const isRejectEvent = REJECT_EVENTS.includes(activity.event);

    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return isAcceptEvent;
      case EventFilter.REJECT:
        return isRejectEvent;
      case EventFilter.TOTAL:
        return isAcceptEvent || isRejectEvent;
      default:
        return false;
    }
  });

  filteredActivities.forEach((activity) => {
    const date =
      typeof activity.createdAt === "string"
        ? new Date(activity.createdAt)
        : new Date(activity.createdAt);

    const key = groupBy(date, interval);

    if (!dateMap[key]) {
      dateMap[key] = { correct: 0, incorrect: 0 };
    }

    const isAcceptEvent = ACCEPT_EVENTS.includes(activity.event);
    const isRejectEvent = REJECT_EVENTS.includes(activity.event);

    if (isAcceptEvent || isRejectEvent) {
      const isCorrectDecision =
        (isAcceptEvent && !activity.hasBug) ||
        (isRejectEvent && activity.hasBug);

      if (isCorrectDecision) {
        dateMap[key].correct += 1;
      } else {
        dateMap[key].incorrect += 1;
      }
    }
  });

  const getLabelRange = (): string[] => {
    const range: string[] = [];
    const today = new Date();

    switch (interval) {
      case TimeInterval.DAY:
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          range.push(groupBy(date, interval));
        }
        break;

      case TimeInterval.WEEK: {
        const lastSunday = new Date(today);
        lastSunday.setDate(today.getDate() - today.getDay());

        for (let i = 6; i >= 0; i--) {
          const date = new Date(lastSunday);
          date.setDate(lastSunday.getDate() - i * 7);
          range.push(groupBy(date, interval));
        }
        break;
      }

      case TimeInterval.MONTH:
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          range.push(groupBy(date, interval));
        }
        break;
    }

    return range;
  };

  const getTooltipDescription = () => {
    const baseDescription =
      "This chart shows the distribution of correct and incorrect decisions made by the user over time.";
    const correctIncorrectDescription =
      "Correct: Accepting good suggestions or rejecting bad ones\nIncorrect: Accepting bad suggestions or rejecting good ones";

    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return `${baseDescription} Showing only accepted suggestions.\n\n${correctIncorrectDescription}`;
      case EventFilter.REJECT:
        return `${baseDescription} Showing only rejected suggestions.\n\n${correctIncorrectDescription}`;
      case EventFilter.TOTAL:
        return `${baseDescription}\n\n${correctIncorrectDescription}`;
      default:
        return baseDescription;
    }
  };

  const labels = getLabelRange();
  const correctData = labels.map((key) => dateMap[key]?.correct || 0);
  const incorrectData = labels.map((key) => dateMap[key]?.incorrect || 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Correct",
        data: correctData,
        backgroundColor: "#50B498",
      },
      {
        label: "Incorrect",
        data: incorrectData,
        backgroundColor: "#F59E0B",
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
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
              return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          },
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          color: textColor,
          precision: 0,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <CustomTooltip
          trigger={
            <h2 className="text-lg font-semibold text-[#50B498]">{title}</h2>
          }
          children={
            <div className="space-y-2">
              <p className="text-sm whitespace-pre-line">
                {getTooltipDescription()}
              </p>
            </div>
          }
        />

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
            className="w-32"
          />
        </div>
      </div>

      <div className="relative w-full h-60 md:h-64 lg:h-72">
        <Bar data={data} options={options} />
      </div>
    </Card>
  );
};

export default AccuracyDistributionBarChart;
