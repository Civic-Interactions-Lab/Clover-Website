import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient.ts";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SurveyQuestion {
  id: string;
  type:
    | "text"
    | "long_text"
    | "likert"
    | "rating"
    | "multiple_choice"
    | "checkbox"
    | "nasa_tlx";
  prompt: string;
  required: boolean;
  options?: string[];
  points?: number;
  labels?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  questions: SurveyQuestion[];
}

export interface Participant {
  id: string;
  first_name: string;
  pid: string;
}

interface SurveyPreviewProps {
  survey: Survey;
  user?: Participant;
  userId?: string;
  className?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
  initialAnswers?: Record<string, string>;
}

// ── Question field ────────────────────────────────────────────────────────────

function QuestionField({
  question,
  value,
  onChange,
  disabled,
  error,
}: {
  question: SurveyQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  error: boolean;
}) {
  if (question.type === "text") {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer"
        disabled={disabled}
        className={`border-0 border-b-2 rounded-none px-0 focus:border-ring bg-transparent ${
          error ? "border-red-500" : "border-border"
        }`}
      />
    );
  }

  if (question.type === "long_text") {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer"
        disabled={disabled}
        rows={4}
        className={`border-0 border-b-2 rounded-none px-0 focus:border-ring bg-transparent resize-none ${
          error ? "border-red-500" : "border-border"
        }`}
      />
    );
  }

  if (question.type === "likert") {
    const pts = question.points ?? 5;
    const labels = question.labels ?? [];
    return (
      <div className="flex justify-center items-center gap-6">
        {labels[0] && (
          <span className="text-sm text-muted-foreground text-right max-w-[100px]">
            {labels[0]}
          </span>
        )}
        <div className="flex items-center gap-4">
          {Array.from({ length: pts }, (_, i) => {
            const v = String(i + 1);
            const selected = value === v;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onChange(v)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : error
                        ? "border-red-400 hover:border-ring cursor-pointer"
                        : "border-border hover:border-ring cursor-pointer"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {v}
                </button>
              </div>
            );
          })}
        </div>
        {labels[pts - 1] && (
          <span className="text-sm text-muted-foreground max-w-[100px]">
            {labels[pts - 1]}
          </span>
        )}
      </div>
    );
  }

  if (question.type === "rating") {
    const min = question.min ?? 1;
    const max = question.max ?? 10;
    const step = question.step ?? 1;
    const current = value ? Number(value) : undefined;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Slider
            min={min}
            max={max}
            step={step}
            value={current !== undefined ? [current] : [min]}
            onValueChange={([v]) => !disabled && onChange(String(v))}
            className="flex-1"
            disabled={disabled}
          />
          <div className="w-12 h-9 border flex items-center justify-center shrink-0 text-sm font-mono font-semibold">
            {current ?? "—"}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    return (
      <RadioGroup
        value={value}
        onValueChange={(v) => !disabled && onChange(v)}
        className="space-y-1"
      >
        {question.options?.map((opt, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-2 rounded hover:bg-accent"
          >
            <RadioGroupItem
              value={opt}
              id={`${question.id}-${i}`}
              disabled={disabled}
              className="border-primary"
            />
            <Label
              htmlFor={`${question.id}-${i}`}
              className={`text-foreground flex-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (question.type === "checkbox") {
    const selected: string[] = value ? JSON.parse(value) : [];
    const toggle = (opt: string) => {
      if (disabled) return;
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      onChange(JSON.stringify(next));
    };
    return (
      <div className="space-y-2">
        {question.options?.map((opt, i) => (
          <div
            key={i}
            className="flex items-center space-x-3 p-2 rounded hover:bg-accent"
          >
            <Checkbox
              id={`${question.id}-${i}`}
              checked={selected.includes(opt)}
              onCheckedChange={() => toggle(opt)}
              disabled={disabled}
              className="border-border"
            />
            <Label
              htmlFor={`${question.id}-${i}`}
              className={`text-foreground flex-1 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {opt}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "nasa_tlx") {
    const dimensions = question.options ?? [];
    const scores: Record<string, number> = value ? JSON.parse(value) : {};

    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground mb-3">
          Rate each dimension from 0 (Very Low) to 100 (Very High).
        </p>
        <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden">
          {dimensions.map((dim) => {
            const current = scores[dim] ?? 0;
            const touched = scores[dim] !== undefined;
            return (
              <div key={dim} className="flex flex-col gap-3 px-4 py-4 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{dim}</span>
                  <div
                    className={`w-10 h-7 border flex items-center justify-center text-xs font-mono font-semibold transition-colors ${
                      touched
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {current}
                  </div>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[current]}
                  onValueChange={([v]) => {
                    if (disabled) return;
                    onChange(JSON.stringify({ ...scores, [dim]: v }));
                  }}
                  disabled={disabled}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 — Very Low</span>
                  <span>Very High — 100</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          {Object.keys(scores).length} of {dimensions.length} dimensions rated
        </p>
      </div>
    );
  }

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

const SurveyPreview = ({
  survey,
  user,
  userId,
  className = "",
  onSuccess,
  readOnly = false,
  initialAnswers = {},
}: SurveyPreviewProps) => {
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const interactive = !!userId && !readOnly;
  const questions = survey.questions ?? [];
  const answeredCount = questions.filter((q) => !!answers[q.id]).length;
  const progressPct =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => ({ ...prev, [questionId]: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactive || !userId) return;

    const newErrors: Record<string, boolean> = {};
    let hasError = false;
    for (const q of questions) {
      if (q.required && !answers[q.id]) {
        newErrors[q.id] = true;
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      toast.error("Please answer all required questions before submitting.");
      const firstError = questions.find((q) => newErrors[q.id]);
      if (firstError) {
        document
          .getElementById(`q-${firstError.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setSubmitting(true);
      toast.warning("Submitting survey...");

      const { error } = await supabase.from("survey_responses").insert([
        {
          survey_id: survey.id,
          user_id: userId,
          submitted_at: new Date().toISOString(),
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Survey submitted successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Failed to submit survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={className}>
        <Card className="shadow-sm">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Survey Submitted Successfully!
            </h2>
            <p className="text-muted-foreground text-lg">
              Thank you for completing the survey. Your response has been
              recorded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Sticky progress bar */}
      {interactive && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
          <Progress value={progressPct} className="h-0.5 rounded-none" />
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {survey.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {answeredCount} / {questions.length} answered
            </span>
          </div>
        </div>
      )}

      <Card className="shadow-sm py-0">
        {/* Survey header */}
        <CardHeader className="border-b border-border rounded-t-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start space-x-4">
            <div className="w-2 h-16 bg-primary rounded-full" />
            <div className="flex-1 space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground">
                {survey.title || "Untitled Survey"}
                {readOnly && (
                  <span className="ml-3 text-lg font-normal text-muted-foreground">
                    (Response View)
                  </span>
                )}
              </CardTitle>
              {survey.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {survey.description}
                </p>
              )}
              {!readOnly && (
                <div className="flex items-center text-sm text-destructive">
                  <span className="text-destructive mr-1">*</span>
                  <span>Required</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6 bg-background">
          <form onSubmit={handleSubmit}>
            {/* Participant info */}
            <Card className="border border-sidebar bg-background pt-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-foreground">
                  Participant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-foreground">
                      Username
                    </Label>
                    <Input
                      value={user?.first_name || "demo_user"}
                      disabled
                      className="border-0 border-b-2 border-border rounded-none px-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-foreground">
                      Participant ID
                    </Label>
                    <Input
                      value={user?.pid || "PID123456"}
                      disabled
                      className="border-0 border-b-2 border-border rounded-none px-0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-6 mt-6">
              {questions.length === 0 && (
                <Card className="bg-card border-2 border-dashed border-border">
                  <CardContent className="text-center py-12">
                    <div className="text-muted-foreground text-lg">
                      No questions added yet
                    </div>
                    <div className="text-muted-foreground text-sm mt-2">
                      Add questions in the editor to see them here
                    </div>
                  </CardContent>
                </Card>
              )}

              {questions.map((q, i) => {
                const hasError = errors[q.id];
                const errorClasses = hasError
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-border hover:border-ring";

                return (
                  <div
                    key={q.id}
                    id={`q-${q.id}`}
                    className={`space-y-4 p-6 bg-card rounded-lg border transition-colors ${errorClasses}`}
                  >
                    {/* Question header */}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-muted-foreground/50 mt-0.5 shrink-0">
                        {i + 1}.
                      </span>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <Label className="text-base font-medium text-foreground flex items-center gap-1">
                          {q.prompt || (
                            <span className="italic text-muted-foreground">
                              No prompt set
                            </span>
                          )}
                          {q.required && (
                            <span className="text-destructive text-lg">*</span>
                          )}
                        </Label>
                        {hasError && (
                          <span className="text-xs text-red-600">
                            This question is required
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Answer field */}
                    <QuestionField
                      question={q}
                      value={answers[q.id] ?? ""}
                      onChange={(v) => setAnswer(q.id, v)}
                      disabled={!interactive}
                      error={hasError}
                    />
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            {!readOnly && questions.length > 0 && (
              <Card className="bg-card border border-border mt-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <Button
                      type="submit"
                      disabled={!interactive || submitting}
                      className={`w-full sm:w-auto font-medium px-8 py-3 ${
                        !interactive ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    >
                      {submitting ? "Submitting..." : "Submit Survey"}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {interactive
                        ? `${questions.filter((q) => q.required && !answers[q.id]).length} required question(s) unanswered`
                        : "This is a preview — form is not functional"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyPreview;
