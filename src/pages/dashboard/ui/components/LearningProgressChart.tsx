import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { UserActivityLogItem } from "@/types/suggestion";
import CustomSelect from "@/components/CustomSelect";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";

enum EventFilter {
  TOTAL = "Total",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

interface LearningProgressProps {
  userActivity: UserActivityLogItem[];
  windowSize?: number;
  title?: string;
}

const LearningProgressChart = ({
  userActivity,
  windowSize = 20,
  title = "Learning Progress",
}: LearningProgressProps) => {
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

  const chartData = useMemo(() => {
    if (!userActivity.length) return { labels: [], data: [] };

    // Filter activities based on event filter
    const filteredActivity = userActivity.filter((activity) => {
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

    if (!filteredActivity.length) return { labels: [], data: [] };

    const sortedActivity = [...filteredActivity].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const labels: number[] = [];
    const data: number[] = [];

    sortedActivity.forEach((_, index) => {
      const startIndex = Math.max(0, index - windowSize + 1);
      const windowLogs = sortedActivity.slice(startIndex, index + 1);

      // Calculate accuracy based on correct decisions for the filtered event type
      let correct = 0;

      windowLogs.forEach((log) => {
        const isAcceptEvent = ACCEPT_EVENTS.includes(log.event);
        const isRejectEvent = REJECT_EVENTS.includes(log.event);

        // Determine if this was a correct decision
        const isCorrectDecision =
          (isAcceptEvent && !log.hasBug) || // Accepted a good suggestion
          (isRejectEvent && log.hasBug); // Rejected a bad suggestion

        if (isCorrectDecision) {
          correct++;
        }
      });

      const rollingAccuracy = (correct / windowLogs.length) * 100;

      labels.push(index + 1);
      data.push(rollingAccuracy);
    });

    return { labels, data };
  }, [userActivity, windowSize, eventFilter]);

  const getTooltipDescription = () => {
    const baseDescription = `This chart shows your learning progress using a rolling ${windowSize}-suggestion average accuracy.`;
    const trendDescription =
      "An upward trend indicates improving ability to make correct decisions.";

    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return `${baseDescription} Showing only accepted suggestions.\n\n${trendDescription} For accepted suggestions, accuracy means accepting good suggestions and avoiding bad ones.`;
      case EventFilter.REJECT:
        return `${baseDescription} Showing only rejected suggestions.\n\n${trendDescription} For rejected suggestions, accuracy means correctly rejecting bad suggestions.`;
      case EventFilter.TOTAL:
        return `${baseDescription}\n\n${trendDescription} This includes both accepting good suggestions and rejecting bad ones.`;
      default:
        return baseDescription;
    }
  };

  if (!chartData.labels.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <CustomTooltip
            trigger={
              <h2 className="text-lg font-semibold text-alpha">{title}</h2>
            }
            children={
              <div className="space-y-2">
                <p className="text-sm whitespace-pre-line">
                  {getTooltipDescription()}
                </p>
              </div>
            }
          />
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
        </div>
        <div className="flex items-center justify-center h-60 text-muted-foreground">
          No activity data available for {eventFilter.toLowerCase()} events
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <CustomTooltip
          trigger={
            <h2 className="text-lg font-semibold text-alpha">{title}</h2>
          }
          children={
            <div className="space-y-2">
              <p className="text-sm whitespace-pre-line">
                {getTooltipDescription()}
              </p>
            </div>
          }
        />
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
      </div>

      <div className="relative w-full h-60 md:h-64 lg:h-72">
        <Line
          data={{
            labels: chartData.labels,
            datasets: [
              {
                label: "Rolling Accuracy (%)",
                data: chartData.data,
                borderColor: "#50B498",
                backgroundColor: "#50B498",
                borderWidth: 3,
                tension: 0.3,
                fill: false,
                pointBackgroundColor: "#50B498",
                pointBorderColor: "#FFFFFF",
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: textColor },
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `Accuracy: ${context.parsed.y.toFixed(1)}%`;
                  },
                  title: function (context) {
                    const eventType =
                      eventFilter === EventFilter.TOTAL
                        ? "Suggestion"
                        : `${eventFilter}ed Suggestion`;
                    return `${eventType} #${context[0].label}`;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: { color: textColor },
                grid: { color: gridColor },
                title: {
                  display: true,
                  text:
                    eventFilter === EventFilter.TOTAL
                      ? "Number of Suggestions"
                      : `Number of ${eventFilter}ed Suggestions`,
                  color: textColor,
                },
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
          }}
        />
      </div>
    </Card>
  );
};

export default LearningProgressChart;
