import { ActivityLogResponse } from "@/types/suggestion";
import { CustomTooltip } from "@/components/CustomTooltip";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import { Line, Scatter } from "react-chartjs-2";
import CustomSelect from "@/components/CustomSelect";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";
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

enum EventFilter {
  TOTAL = "Total",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

interface ResponseTimeLineChartProps {
  userActivity: ActivityLogResponse;
  windowSize?: number;
  title?: string;
}

const ResponseTimeLineChart = ({
  userActivity,
  windowSize = 20,
  title = "Response Time vs Accuracy Analysis",
}: ResponseTimeLineChartProps) => {
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
    if (!userActivity.length) {
      return {
        labels: [],
        datasets: [],
        isEmpty: true,
      };
    }

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

    if (!filteredActivity.length) {
      return {
        labels: [],
        datasets: [],
        isEmpty: true,
      };
    }

    // Sort chronologically
    const sortedActivity = [...filteredActivity].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const labels: number[] = [];
    const responseTimeData: number[] = [];
    const accuracyData: number[] = [];

    sortedActivity.forEach((_, index) => {
      const startIndex = Math.max(0, index - windowSize + 1);
      const windowLogs = sortedActivity.slice(startIndex, index + 1);

      // Calculate rolling average response time
      const avgResponseTime =
        windowLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
        windowLogs.length;

      // Calculate rolling accuracy
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
      responseTimeData.push(Math.round(avgResponseTime * 100) / 100);
      accuracyData.push(Math.round(rollingAccuracy * 100) / 100);
    });

    return {
      labels,
      datasets: [
        {
          label: `Response Time (${windowSize}-avg)`,
          data: responseTimeData,
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
          yAxisID: "y",
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
        {
          label: `Accuracy % (${windowSize}-avg)`,
          data: accuracyData,
          borderColor: "#50B498",
          backgroundColor: "#50B498",
          yAxisID: "y1",
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
      isEmpty: false,
      stats: {
        total: sortedActivity.length,
        avgResponseTime: responseTimeData[responseTimeData.length - 1] || 0,
        currentAccuracy: accuracyData[accuracyData.length - 1] || 0,
        finalWindowCorrect: Math.round(
          ((accuracyData[accuracyData.length - 1] || 0) / 100) * windowSize
        ),
        finalWindowIncorrect:
          windowSize -
          Math.round(
            ((accuracyData[accuracyData.length - 1] || 0) / 100) * windowSize
          ),
      },
    };
  }, [userActivity, windowSize, eventFilter]);

  const getTooltipDescription = () => {
    const baseDescription = `This dual-axis line chart shows both response time and accuracy trends using rolling ${windowSize}-suggestion averages. The blue line (left axis) shows response time, the green line (right axis) shows accuracy percentage.`;

    switch (eventFilter) {
      case EventFilter.ACCEPT:
        return `${baseDescription} Showing only accepted suggestions. Look for correlations: do faster acceptances lead to better or worse accuracy?`;
      case EventFilter.REJECT:
        return `${baseDescription} Showing only rejected suggestions. Look for correlations: do faster rejections lead to better or worse accuracy?`;
      case EventFilter.TOTAL:
        return `${baseDescription} Showing all suggestions. Analyze how your speed and accuracy evolve together over time.`;
      default:
        return baseDescription;
    }
  };

  if (chartData.isEmpty) {
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
                <p className="text-xs text-muted-foreground">
                  Identify patterns: Are you getting faster while maintaining
                  accuracy? Or does speed come at the cost of precision?
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
          No {eventFilter.toLowerCase()} suggestion data available
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
            const eventType =
              eventFilter === EventFilter.TOTAL
                ? "Suggestion"
                : `${eventFilter}ed Suggestion`;
            return `${eventType} #${context[0].label}`;
          },
          label: function (context) {
            if (context.datasetIndex === 0) {
              return `Response Time: ${context.parsed.y}ms`;
            } else {
              return `Accuracy: ${context.parsed.y}%`;
            }
          },
          afterLabel: function (context) {
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
          text: `${eventFilter === EventFilter.TOTAL ? "Suggestion" : eventFilter + "ed Suggestion"} Number (Chronological Order)`,
          color: textColor,
        },
        ticks: {
          color: textColor,
          stepSize: 1,
        },
        grid: { color: gridColor },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Response Time (ms)",
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
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Accuracy (%)",
          color: textColor,
        },
        ticks: {
          color: textColor,
          callback: function (value) {
            return `${value}%`;
          },
        },
        grid: {
          drawOnChartArea: false, // Don't draw grid lines for right axis
        },
        min: 0,
        max: 100,
      },
    },
  };

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
              <div className="space-y-1 text-xs">
                <p>
                  <span className="inline-block w-3 h-3 bg-[#3B82F6] rounded-full mr-2"></span>
                  Blue Line (Left Axis): Rolling average response time in
                  milliseconds
                </p>
                <p>
                  <span className="inline-block w-3 h-3 bg-[#50B498] rounded-full mr-2"></span>
                  Green Line (Right Axis): Rolling average accuracy percentage
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Look for correlations: Are the lines moving in the same or
                opposite directions?
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
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ResponseTimeLineChart;
