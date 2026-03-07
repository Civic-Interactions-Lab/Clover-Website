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

// answers is now stored as [{ questionId, value }]
interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  submitted_at: string;
  answers: { questionId: string; value: string }[];
}

interface SurveyResultProps {
  survey: Survey;
  responses: SurveyResponse[];
  className?: string;
}

// Helper: get answer value for a question from a response
function getAnswer(
  response: SurveyResponse,
  questionId: string,
): string | undefined {
  return response.answers.find((a) => a.questionId === questionId)?.value;
}

// Helper: get all answers for a question across all responses
function getAllAnswers(
  responses: SurveyResponse[],
  questionId: string,
): string[] {
  return responses
    .map((r) => getAnswer(r, questionId))
    .filter((v): v is string => !!v);
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
    if (count <= baseColors.length) return baseColors.slice(0, count);
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360;
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
  };

  // ── Text / Long text ────────────────────────────────────────────────────────

  const renderTextResponses = (question: SurveyQuestion) => {
    const answers = getAllAnswers(responses, question.id).filter(
      (a) => a.trim() !== "",
    );
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {answers.length}
          </div>
          <div className="text-sm text-muted-foreground">Text Responses</div>
        </div>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {answers.length > 0 ? (
            answers.map((answer, i) => (
              <Card key={i} className="p-4 bg-muted/50">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {answer}
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

  // ── Multiple choice ─────────────────────────────────────────────────────────

  const renderMultipleChoiceChart = (question: SurveyQuestion) => {
    const answers = getAllAnswers(responses, question.id);
    const counts: Record<string, number> = {};
    question.options?.forEach((opt) => (counts[opt] = 0));
    answers.forEach((a) => {
      if (a in counts) counts[a]++;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = generateColors(labels.length);

    return (
      <div className="h-80">
        <Pie
          data={{
            labels,
            datasets: [
              {
                data,
                backgroundColor: colors,
                borderColor: colors.map((c) => c + "80"),
                borderWidth: 2,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: { position: "bottom", labels: { color: textColor } },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => {
                    const total = ctx.dataset.data.reduce(
                      (a: number, b: number) => a + b,
                      0,
                    );
                    const pct =
                      total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                    return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                  },
                },
              },
            },
          }}
        />
      </div>
    );
  };

  // ── Checkbox ────────────────────────────────────────────────────────────────

  const renderCheckboxChart = (question: SurveyQuestion) => {
    const answers = getAllAnswers(responses, question.id);
    const counts: Record<string, number> = {};
    question.options?.forEach((opt) => (counts[opt] = 0));
    answers.forEach((a) => {
      try {
        const parsed: string[] = JSON.parse(a);
        parsed.forEach((opt) => {
          if (opt in counts) counts[opt]++;
        });
      } catch {}
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = generateColors(labels.length);

    return (
      <div className="h-80">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Selections",
                data,
                backgroundColor: colors,
                borderColor: colors.map((c) => c + "80"),
                borderWidth: 2,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: textColor },
              },
              x: { ticks: { color: textColor, maxRotation: 45 } },
            },
          }}
        />
      </div>
    );
  };

  // ── Likert ──────────────────────────────────────────────────────────────────

  const renderLikertChart = (question: SurveyQuestion) => {
    const pts = question.points ?? 5;
    const answers = getAllAnswers(responses, question.id);
    const counts: Record<string, number> = {};
    for (let i = 1; i <= pts; i++) counts[String(i)] = 0;
    answers.forEach((a) => {
      if (a in counts) counts[a]++;
    });

    const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));
    const avg =
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
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {answers.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{avg}</div>
            <div className="text-sm text-muted-foreground">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{median}</div>
            <div className="text-sm text-muted-foreground">Median Rating</div>
          </div>
        </div>
        <div className="h-64">
          <Line
            data={{
              labels: Object.keys(counts),
              datasets: [
                {
                  label: "Response Count",
                  data: Object.values(counts),
                  backgroundColor: "#50B498",
                  borderColor: "#50B498",
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: textColor },
                  title: { display: true, text: "Responses", color: textColor },
                },
                x: {
                  ticks: { color: textColor },
                  title: { display: true, text: "Rating", color: textColor },
                },
              },
            }}
          />
        </div>
      </div>
    );
  };

  // ── Rating (slider) ─────────────────────────────────────────────────────────

  const renderRatingChart = (question: SurveyQuestion) => {
    const min = question.min ?? 1;
    const max = question.max ?? 10;
    const answers = getAllAnswers(responses, question.id);
    const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));

    const binSize = Math.max(1, Math.floor((max - min) / 10));
    const bins: Record<string, number> = {};
    for (let i = min; i <= max; i += binSize) {
      const end = Math.min(i + binSize - 1, max);
      bins[i === end ? `${i}` : `${i}-${end}`] = 0;
    }
    numericAnswers.forEach((v) => {
      const idx = Math.floor((v - min) / binSize) * binSize + min;
      const end = Math.min(idx + binSize - 1, max);
      const key = idx === end ? `${idx}` : `${idx}-${end}`;
      if (key in bins) bins[key]++;
    });

    const avg =
      numericAnswers.length > 0
        ? (
            numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length
          ).toFixed(1)
        : 0;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{avg}</div>
          <div className="text-sm text-muted-foreground">Average Value</div>
        </div>
        <div className="h-64">
          <Bar
            data={{
              labels: Object.keys(bins),
              datasets: [
                {
                  label: "Responses",
                  data: Object.values(bins),
                  backgroundColor: "#3B82F6",
                  borderColor: "#3B82F6",
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1, color: textColor },
                },
                x: { ticks: { color: textColor } },
              },
            }}
          />
        </div>
      </div>
    );
  };

  // ── NASA-TLX ────────────────────────────────────────────────────────────────

  const renderNasaTlxChart = (question: SurveyQuestion) => {
    const dimensions = question.options ?? [];
    const answers = getAllAnswers(responses, question.id);

    const scaleValues: Record<string, number[]> = {};
    dimensions.forEach((d) => (scaleValues[d] = []));

    answers.forEach((a) => {
      try {
        const parsed: Record<string, number> = JSON.parse(a);
        Object.entries(parsed).forEach(([dim, val]) => {
          if (dim in scaleValues) scaleValues[dim].push(Number(val));
        });
      } catch {}
    });

    const validDims = dimensions.filter((d) => scaleValues[d].length > 0);
    const averages = validDims.map((d) => {
      const vals = scaleValues[d];
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });
    const overallAvg =
      averages.length > 0
        ? averages.reduce((a, b) => a + b, 0) / averages.length
        : 0;
    const colors = generateColors(validDims.length);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {answers.length}
            </div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {overallAvg.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Overall Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {averages.length > 0 ? Math.max(...averages).toFixed(1) : "—"}
            </div>
            <div className="text-sm text-muted-foreground">Highest Scale</div>
          </div>
        </div>

        <div className="h-80">
          <Bar
            data={{
              labels: validDims,
              datasets: [
                {
                  label: "Average Rating",
                  data: averages,
                  backgroundColor: colors,
                  borderColor: colors.map((c) => c + "80"),
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: textColor },
                  title: {
                    display: true,
                    text: "Rating (0–100)",
                    color: textColor,
                  },
                },
                x: { ticks: { color: textColor, maxRotation: 45 } },
              },
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {dimensions.map((dim) => {
            const vals = scaleValues[dim];
            const avg =
              vals.length > 0
                ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                : null;
            return (
              <div
                key={dim}
                className={`text-center p-3 border rounded ${
                  avg
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                }`}
              >
                <div className="font-medium text-sm mb-1">{dim}</div>
                <div className="text-lg font-bold text-primary">
                  {avg ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {vals.length > 0
                    ? `${vals.length} response${vals.length !== 1 ? "s" : ""}`
                    : "No data"}
                </div>
                {vals.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Range: {Math.min(...vals)}–{Math.max(...vals)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Question card ───────────────────────────────────────────────────────────

  const renderQuestionResult = (question: SurveyQuestion, index: number) => {
    const responseCount = responses.filter(
      (r) => !!getAnswer(r, question.id),
    ).length;

    return (
      <Card key={question.id} className="overflow-hidden py-0">
        <CardHeader className="bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg font-medium mb-2">
                Q{index + 1}:{" "}
                {question.prompt || (
                  <span className="italic text-muted-foreground">
                    No prompt
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {question.type.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {responseCount} response{responseCount !== 1 ? "s" : ""}
                </Badge>
                {question.required && (
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
              {question.type === "text" && renderTextResponses(question)}
              {question.type === "long_text" && renderTextResponses(question)}
              {question.type === "multiple_choice" &&
                renderMultipleChoiceChart(question)}
              {question.type === "checkbox" && renderCheckboxChart(question)}
              {question.type === "likert" && renderLikertChart(question)}
              {question.type === "rating" && renderRatingChart(question)}
              {question.type === "nasa_tlx" && renderNasaTlxChart(question)}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const questions = survey.questions ?? [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview */}
      <Card className="overflow-hidden py-0">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold">
            {survey.title || "Untitled Survey"} — Results
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
                {questions.length}
              </div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((q, i) => renderQuestionResult(q, i))}
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
