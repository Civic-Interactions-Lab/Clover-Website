import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Survey, SurveyQuestion } from "./SurveyPreview";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
);

interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, any>;
  created_at: string;
}

interface SurveyResultProps {
  survey: Survey;
  responses: SurveyResponse[];
  className?: string;
}

const SurveyResult = ({
  survey,
  responses,
  className = "",
}: SurveyResultProps) => {
  const [textColor, setTextColor] = useState("#000000");

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

  const generateColors = (count: number) => {
    const baseColors = [
      "#50B498",
      "#F59E0B",
      "#EF4444",
      "#3B82F6",
      "#8B5CF6",
      "#10B981",
      "#F97316",
      "#EC4899",
      "#6366F1",
      "#84CC16",
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
  };

  const renderMultipleChoiceChart = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter(Boolean);
    const counts: Record<string, number> = {};

    question.question_options?.forEach((option) => {
      counts[option] = 0;
    });

    answers.forEach((answer) => {
      if (typeof answer === "string" && counts.hasOwnProperty(answer)) {
        counts[answer]++;
      }
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = generateColors(labels.length);

    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color + "80"),
          borderWidth: 2,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { color: textColor },
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0,
              );
              const percentage =
                total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${context.raw} (${percentage}%)`;
            },
          },
        },
      },
    };

    return (
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
    );
  };

  const renderMultipleSelectChart = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter(Boolean);
    const counts: Record<string, number> = {};

    question.question_options?.forEach((option) => {
      counts[option] = 0;
    });

    answers.forEach((answer) => {
      if (Array.isArray(answer)) {
        answer.forEach((selectedOption) => {
          if (counts.hasOwnProperty(selectedOption)) {
            counts[selectedOption]++;
          }
        });
      }
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = generateColors(labels.length);

    const chartData = {
      labels,
      datasets: [
        {
          label: "Number of Selections",
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color + "80"),
          borderWidth: 2,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `${context.label}: ${context.raw} selections`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
          },
        },
      },
    };

    return (
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  const renderLikertChart = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter(Boolean);
    const scaleSize = parseInt(question.question_options?.[0] || "5");
    const counts: Record<string, number> = {};

    for (let i = 1; i <= scaleSize; i++) {
      counts[i.toString()] = 0;
    }

    answers.forEach((answer) => {
      if (typeof answer === "string" && counts.hasOwnProperty(answer)) {
        counts[answer]++;
      }
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const chartData = {
      labels,
      datasets: [
        {
          label: "Response Count",
          data,
          backgroundColor: "#50B498",
          borderColor: "#50B498",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `Rating ${context.label}: ${context.raw} responses`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: textColor,
          },
          title: {
            display: true,
            text: "Number of Responses",
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
          },
          title: {
            display: true,
            text: "Rating Scale",
            color: textColor,
          },
        },
      },
    };

    const totalResponses = answers.length;
    const numericAnswers = answers
      .map((a) => parseInt(a as string))
      .filter((n) => !isNaN(n));
    const average =
      numericAnswers.length > 0
        ? (
            numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length
          ).toFixed(2)
        : 0;
    const median =
      numericAnswers.length > 0
        ? numericAnswers.sort((a, b) => a - b)[
            Math.floor(numericAnswers.length / 2)
          ]
        : 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {totalResponses}
            </div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{average}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{median}</div>
            <div className="text-sm text-muted-foreground">Median Rating</div>
          </div>
        </div>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </div>
    );
  };

  const renderSliderChart = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter(Boolean);
    const minValue = parseInt(question.question_options?.[0] || "1");
    const maxValue = parseInt(question.question_options?.[1] || "10");

    const binSize = Math.max(1, Math.floor((maxValue - minValue) / 10));
    const bins: Record<string, number> = {};

    for (let i = minValue; i <= maxValue; i += binSize) {
      const binEnd = Math.min(i + binSize - 1, maxValue);
      const binLabel = i === binEnd ? `${i}` : `${i}-${binEnd}`;
      bins[binLabel] = 0;
    }

    answers.forEach((answer) => {
      const value = parseInt(answer as string);
      if (!isNaN(value)) {
        const binIndex =
          Math.floor((value - minValue) / binSize) * binSize + minValue;
        const binEnd = Math.min(binIndex + binSize - 1, maxValue);
        const binLabel =
          binIndex === binEnd ? `${binIndex}` : `${binIndex}-${binEnd}`;
        if (bins[binLabel] !== undefined) {
          bins[binLabel]++;
        }
      }
    });

    const labels = Object.keys(bins);
    const data = Object.values(bins);

    const chartData = {
      labels,
      datasets: [
        {
          label: "Response Distribution",
          data,
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6",
          borderWidth: 2,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
          },
        },
      },
    };

    const numericAnswers = answers
      .map((a) => parseInt(a as string))
      .filter((n) => !isNaN(n));
    const average =
      numericAnswers.length > 0
        ? (
            numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length
          ).toFixed(1)
        : 0;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{average}</div>
          <div className="text-sm text-muted-foreground">Average Value</div>
        </div>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    );
  };

  const renderNasaTlxChart = () => {
    const allNasaTlxAnswers: any[] = [];

    survey.questions
      .filter((q) => q.question_type === "nasa_tlx")
      .forEach((nasaQuestion) => {
        const questionAnswers = responses
          .map((r) => r.answers[nasaQuestion.id])
          .filter(Boolean);
        allNasaTlxAnswers.push(...questionAnswers);
      });

    if (allNasaTlxAnswers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No NASA-TLX responses found across all questions
        </div>
      );
    }

    const allScales = new Set<string>();
    allNasaTlxAnswers.forEach((answer) => {
      if (
        typeof answer === "object" &&
        answer !== null &&
        !Array.isArray(answer)
      ) {
        Object.keys(answer).forEach((key) => {
          allScales.add(key);
        });
      }
    });

    const scales = Array.from(allScales);

    if (scales.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No NASA-TLX scales found in any question data
        </div>
      );
    }

    const scaleAverages: Record<string, number> = {};
    const scaleCount: Record<string, number> = {};
    const scaleValues: Record<string, number[]> = {};

    scales.forEach((scale) => {
      scaleAverages[scale] = 0;
      scaleCount[scale] = 0;
      scaleValues[scale] = [];
    });

    allNasaTlxAnswers.forEach((answer) => {
      if (
        typeof answer === "object" &&
        answer !== null &&
        !Array.isArray(answer)
      ) {
        Object.entries(answer).forEach(([scale, value]) => {
          if (scales.includes(scale)) {
            let numericValue: number;

            if (typeof value === "string") {
              numericValue = parseInt(value);
            } else if (typeof value === "number") {
              numericValue = value;
            } else {
              return;
            }

            if (!isNaN(numericValue)) {
              scaleAverages[scale] += numericValue;
              scaleCount[scale]++;
              scaleValues[scale].push(numericValue);
            }
          }
        });
      }
    });

    scales.forEach((scale) => {
      if (scaleCount[scale] > 0) {
        scaleAverages[scale] = scaleAverages[scale] / scaleCount[scale];
      }
    });

    const validScales = scales.filter((scale) => scaleCount[scale] > 0);

    if (validScales.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No valid NASA-TLX numeric data found
        </div>
      );
    }

    const labels = validScales;
    const data = validScales.map((scale) => scaleAverages[scale]);
    const colors = generateColors(labels.length);

    const scaleMax = 20;

    const chartData = {
      labels,
      datasets: [
        {
          label: "Average Rating",
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color + "80"),
          borderWidth: 2,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const scale = labels[context.dataIndex];
              const count = scaleCount[scale];
              const values = scaleValues[scale];
              return [
                `${scale}: ${context.raw.toFixed(1)}`,
                `Responses: ${count}`,
                `Range: ${Math.min(...values)}-${Math.max(...values)}`,
              ];
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: scaleMax,
          ticks: {
            color: textColor,
            stepSize: 1,
          },
          title: {
            display: true,
            text: `Rating Scale (0-${scaleMax})`,
            color: textColor,
          },
        },
        x: {
          ticks: {
            color: textColor,
            maxRotation: 45,
          },
        },
      },
    };

    const overallAverage =
      validScales.length > 0
        ? validScales.reduce((sum, scale) => sum + scaleAverages[scale], 0) /
          validScales.length
        : 0;

    const uniqueParticipants = new Set();
    survey.questions
      .filter((q) => q.question_type === "nasa_tlx")
      .forEach((nasaQuestion) => {
        responses.forEach((response) => {
          if (response.answers[nasaQuestion.id]) {
            uniqueParticipants.add(response.user_id);
          }
        });
      });

    return (
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {uniqueParticipants.size}
            </div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {overallAverage.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Overall Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {data.length > 0 ? Math.max(...data).toFixed(1) : "0"}
            </div>
            <div className="text-sm text-muted-foreground">Highest Scale</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <Bar data={chartData} options={options} />
        </div>

        {/* Scale Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          {scales.map((scale) => {
            const average = scaleAverages[scale];
            const count = scaleCount[scale];
            const values = scaleValues[scale];
            return (
              <div
                key={scale}
                className={`text-center p-3 border rounded ${
                  count > 0
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                }`}
              >
                <div className="font-medium text-sm mb-1">{scale}</div>
                <div className="text-lg font-bold text-primary">
                  {average > 0 ? average.toFixed(1) : "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {count > 0
                    ? `${count} response${count !== 1 ? "s" : ""}`
                    : "No data"}
                </div>
                {values.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Range: {Math.min(...values)}-{Math.max(...values)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTextResponses = (question: SurveyQuestion) => {
    const answers = responses
      .map((r) => r.answers[question.id])
      .filter(Boolean);
    const textAnswers = answers.filter(
      (answer) => typeof answer === "string" && answer.trim() !== "",
    );

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {textAnswers.length}
          </div>
          <div className="text-sm text-muted-foreground">Text Responses</div>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {textAnswers.length > 0 ? (
            textAnswers.map((answer, index) => (
              <Card key={index} className="p-4 bg-muted/50">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {answer as string}
                </p>
              </Card>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No text responses provided
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestionResult = (question: SurveyQuestion) => {
    if (question.question_type === "section_title") {
      return null;
    }

    if (question.question_type === "nasa_tlx") {
      const nasaTlxQuestions = survey.questions.filter(
        (q) => q.question_type === "nasa_tlx",
      );
      const isFirstNasaTlxQuestion = nasaTlxQuestions[0]?.id === question.id;

      if (!isFirstNasaTlxQuestion) {
        return null;
      }

      const totalNasaTlxResponses = responses.filter((r) =>
        nasaTlxQuestions.some((q) => r.answers[q.id]),
      ).length;

      return (
        <Card key="combined-nasa-tlx" className="overflow-hidden py-0">
          <CardHeader className="bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-medium mb-2">
                  NASA-TLX Workload Assessment (Combined)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    NASA-TLX COMBINED
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {totalNasaTlxResponses} participant
                    {totalNasaTlxResponses !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    {nasaTlxQuestions.length} scales
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {totalNasaTlxResponses === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No NASA-TLX responses found
              </div>
            ) : (
              renderNasaTlxChart()
            )}
          </CardContent>
        </Card>
      );
    }

    const responseCount = responses.filter(
      (r) => r.answers[question.id],
    ).length;

    return (
      <Card key={question.id} className="overflow-hidden py-0">
        <CardHeader className="bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-medium mb-2">
                Q{question.question_number}: {question.question_text}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {question.question_type.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {responseCount} response{responseCount !== 1 ? "s" : ""}
                </Badge>
                {question.is_required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {responseCount === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No responses for this question
            </div>
          ) : (
            <>
              {question.question_type === "multiple_choice" &&
                renderMultipleChoiceChart(question)}
              {question.question_type === "multiple_select" &&
                renderMultipleSelectChart(question)}
              {question.question_type === "likert" &&
                renderLikertChart(question)}
              {question.question_type === "slider" &&
                renderSliderChart(question)}
              {question.question_type === "text" &&
                renderTextResponses(question)}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const filteredQuestions = survey.questions
    .filter((q) => q.question_type !== "section_title")
    .sort((a, b) => a.question_number - b.question_number);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Survey Overview */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold">
            {survey.title || "Untitled Survey"} Results
          </CardTitle>
          {survey.description && (
            <p className="text-muted-foreground mt-2">{survey.description}</p>
          )}
          <div className="flex items-center gap-32 mt-4 justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {responses.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Responses
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {filteredQuestions.length}
              </div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Results */}
      {filteredQuestions.length > 0 ? (
        <div className="space-y-6">
          {filteredQuestions.map(renderQuestionResult)}
        </div>
      ) : (
        <Card className="py-0">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No questions found in this survey
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SurveyResult;
