import { ActivityLogResponse } from "@/types/suggestion";
import CustomSelect from "@/components/CustomSelect";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";

enum EventFilter {
  TOTAL = "Total",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

interface ResponseTimeAnalysisProps {
  userActivity: ActivityLogResponse;
  title?: string;
}

const ResponseTimeBarChart = ({
  userActivity,
  title = "Response Time Analysis",
}: ResponseTimeAnalysisProps) => {
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
    if (!userActivity.length)
      return { labels: [], data: [], backgroundColors: [], counts: [] };

    const normalizedActivity = userActivity.map((log) => ({
      ...log,
      hasBug: log.hasBug ?? false,
      event: log.event || "",
      duration: log.duration || 0,
    }));

    const avgDuration = (logs: typeof normalizedActivity) =>
      logs.length > 0
        ? logs.reduce((sum, log) => sum + log.duration, 0) / logs.length
        : 0;

    let categories = [];

    if (eventFilter === EventFilter.TOTAL) {
      // Show all categories when Total is selected
      const correctSuggestions = normalizedActivity.filter(
        (log) => log.hasBug === false
      );
      const incorrectSuggestions = normalizedActivity.filter(
        (log) => log.hasBug === true
      );
      const acceptedSuggestions = normalizedActivity.filter((log) =>
        log.event.includes("ACCEPT")
      );
      const rejectedSuggestions = normalizedActivity.filter((log) =>
        log.event.includes("REJECT")
      );

      categories = [
        {
          category: "Correct",
          avgTime: avgDuration(correctSuggestions),
          count: correctSuggestions.length,
          color: "#50B498",
        },
        {
          category: "Incorrect",
          avgTime: avgDuration(incorrectSuggestions),
          count: incorrectSuggestions.length,
          color: "#F59E0B",
        },
        {
          category: "Accepted",
          avgTime: avgDuration(acceptedSuggestions),
          count: acceptedSuggestions.length,
          color: "#3B82F6",
        },
        {
          category: "Rejected",
          avgTime: avgDuration(rejectedSuggestions),
          count: rejectedSuggestions.length,
          color: "#EF4444",
        },
      ].filter((item) => item.count > 0);
    } else {
      // Filter by event type and show overall + correct/incorrect breakdown
      let filteredActivity = normalizedActivity;

      if (eventFilter === EventFilter.ACCEPT) {
        filteredActivity = normalizedActivity.filter((log) =>
          log.event.includes("ACCEPT")
        );
      } else if (eventFilter === EventFilter.REJECT) {
        filteredActivity = normalizedActivity.filter((log) =>
          log.event.includes("REJECT")
        );
      }

      if (filteredActivity.length === 0) {
        return { labels: [], data: [], backgroundColors: [], counts: [] };
      }

      const correctSuggestions = filteredActivity.filter(
        (log) => log.hasBug === false
      );
      const incorrectSuggestions = filteredActivity.filter(
        (log) => log.hasBug === true
      );

      // Add the overall average for the selected event type
      const overallCategory = {
        category: eventFilter === EventFilter.ACCEPT ? "Accepted" : "Rejected",
        avgTime: avgDuration(filteredActivity),
        count: filteredActivity.length,
        color: eventFilter === EventFilter.ACCEPT ? "#3B82F6" : "#EF4444",
      };

      categories = [
        overallCategory,
        {
          category: "Correct",
          avgTime: avgDuration(correctSuggestions),
          count: correctSuggestions.length,
          color: "#50B498",
        },
        {
          category: "Incorrect",
          avgTime: avgDuration(incorrectSuggestions),
          count: incorrectSuggestions.length,
          color: "#F59E0B",
        },
      ].filter((item) => item.count > 0);
    }

    return {
      labels: categories.map((item) => item.category),
      data: categories.map((item) => item.avgTime),
      backgroundColors: categories.map((item) => item.color),
      counts: categories.map((item) => item.count),
    };
  }, [userActivity, eventFilter]);

  const getTooltipDescription = () => {
    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return "Shows average response times for accepted suggestions, with breakdown by correctness.";
      case EventFilter.REJECT:
        return "Shows average response times for rejected suggestions, with breakdown by correctness.";
      case EventFilter.TOTAL:
        return "Shows average response times across all suggestion events, comparing correct vs incorrect suggestions and accepted vs rejected.";
      default:
        return "";
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
                <p className="text-sm">{getTooltipDescription()}</p>
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
          No response time data available for {eventFilter.toLowerCase()} events
        </div>
      </Card>
    );
  }

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
                  Faster response times might indicate more confidence in your
                  decisions.
                </p>
              </div>
            }
          />
        </div>

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
        <Bar
          data={{
            labels: chartData.labels,
            datasets: [
              {
                label: "Average Response Time (ms)",
                data: chartData.data,
                backgroundColor: chartData.backgroundColors,
                borderColor: chartData.backgroundColors,
                borderWidth: 1,
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
                    const count = chartData.counts[context.dataIndex];
                    const eventType =
                      eventFilter === EventFilter.TOTAL
                        ? "suggestions"
                        : `${eventFilter.toLowerCase()}ed suggestions`;
                    return `${context.parsed.y.toFixed(0)}ms (${count} ${eventType})`;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: { color: textColor },
                grid: { color: gridColor },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: textColor,
                  callback: function (value) {
                    return value;
                  },
                },
                grid: { color: gridColor },
                title: {
                  display: true,
                  text: "Time (milliseconds)",
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

export default ResponseTimeBarChart;
