import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { toast } from "sonner";
import CustomSelect from "@/components/CustomSelect";

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_type:
    | "text"
    | "multiple_choice"
    | "multiple_select"
    | "likert"
    | "section_title"
    | "slider"
    | "nasa_tlx";
  question_number: number;
  question_text: string;
  question_options?: string[];
  is_required: boolean;
  created_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  context: string;
  type: string;
  created_at: string;
  questions: SurveyQuestion[];
}

export interface Participant {
  id: string;
  first_name: string;
  pid: string;
}

export interface SurveyAnswers {
  [questionId: string]: string | string[] | Record<string, string>;
}

interface SurveyPreviewProps {
  survey: Survey;
  user?: Participant;
  userId?: string;
  className?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
  initialAnswers?: SurveyAnswers;
}

const SurveyPreview = ({
  survey,
  user,
  userId,
  className = "",
  onSuccess,
  readOnly = false,
  initialAnswers = {},
}: SurveyPreviewProps) => {
  const [answers, setAnswers] = useState<SurveyAnswers>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form is interactive only if userId is provided
  const interactive = !!userId && !readOnly;

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[] | Record<string, string>
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const validateRequiredFields = (): string[] => {
    const errors: string[] = [];

    survey.questions
      .filter((q) => q.question_type !== "section_title" && q.is_required)
      .forEach((question) => {
        const answer = answers[question.id];

        if (question.question_type === "nasa_tlx") {
          const nasaTlxAnswer = answer as Record<string, string>;
          const nasaTlxScales = question.question_options || [];

          if (
            !nasaTlxAnswer ||
            nasaTlxScales.some((scale) => !nasaTlxAnswer[scale])
          ) {
            errors.push(
              `"${question.question_text}" - all scales must be rated`
            );
          }
        } else if (
          !answer ||
          (typeof answer === "string" && answer.trim() === "") ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          errors.push(`"${question.question_text}" is required`);
        }
      });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interactive || !userId) return;

    const errors = validateRequiredFields();
    if (errors.length > 0) {
      toast.error("Please answer all required questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      toast.warning("Submitting survey...");

      const { error } = await supabase.from("survey_responses").insert([
        {
          survey_id: survey.id,
          user_id: userId,
          answers: answers,
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Survey submitted successfully!");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Failed to submit survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateLikertOptions = (question: SurveyQuestion) => {
    // Parse scale from question_options: first item is scale size, second and third are labels
    const options = question.question_options || ["5"];
    const scale = parseInt(options[0]) || 5;
    const leftLabel = options[1] || "";
    const rightLabel = options[2] || "";

    const scaleOptions = [];
    for (let i = 1; i <= scale; i++) {
      scaleOptions.push({ value: i.toString(), label: i.toString() });
    }

    return { scaleOptions, leftLabel, rightLabel };
  };

  const renderNasaTlxScale = (
    questionId: string,
    scaleData: string,
    interactive: boolean
  ) => {
    // Parse scale data: "scaleName|lowLabel|highLabel"
    const parts = scaleData.split("|");
    const scaleName = parts[0] || "";
    const lowLabel = parts[1] || "Low";
    const highLabel = parts[2] || "High";

    const currentAnswers =
      (answers[questionId] as Record<string, string>) || {};
    const currentValue = currentAnswers[scaleName];

    const scaleValues = [];
    for (let i = 0; i <= 20; i++) {
      scaleValues.push(i);
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
        <div className="flex justify-between items-center">
          {scaleValues.map((value) => (
            <div key={value} className="flex flex-col items-center">
              <button
                type="button"
                disabled={!interactive}
                onClick={
                  interactive
                    ? () => {
                        const updatedAnswers = {
                          ...currentAnswers,
                          [scaleName]: value.toString(),
                        };
                        handleAnswerChange(questionId, updatedAnswers);
                      }
                    : undefined
                }
                className={`w-6 h-6 border-2 flex items-center justify-center text-xs transition-colors ${
                  currentValue === value.toString()
                    ? "border-primary bg-primary text-foreground"
                    : interactive
                      ? "border-border hover:border-ring cursor-pointer"
                      : "border-border cursor-not-allowed"
                } ${value % 5 === 0 ? "border-b-4" : ""}`}
              >
                {/* Show selected value in readonly mode */}
                {readOnly && currentValue === value.toString() && (
                  <span className="pt-6 mt-8 text-xs font-medium">{value}</span>
                )}
              </button>
            </div>
          ))}
        </div>
        {/* Show selected value clearly in readonly mode */}
        {readOnly && currentValue && (
          <div className="text-center text-sm font-medium text-foreground">
            Selected: {currentValue}
          </div>
        )}
      </div>
    );
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const currentAnswer = answers[question.id];

    switch (question.question_type) {
      case "section_title":
        return (
          <div key={question.id} className="pt-6 border-t-2 border-border">
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground underline underline-offset-4">
                {question.question_text}
              </h3>
              {/* Use first item in question_options as description */}
              {question.question_options?.[0] && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {question.question_options[0]}
                </p>
              )}
            </div>
          </div>
        );

      case "text":
        return (
          <div
            key={question.id}
            className="space-y-3 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground flex items-center gap-1">
                {question.question_text}
                {question.is_required && (
                  <span className="text-destructive text-lg">*</span>
                )}
              </Label>
              {interactive ? (
                <Textarea
                  value={(currentAnswer as string) || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  placeholder="Your answer"
                  className="border-0 border-b-2 border-border rounded-none px-0 focus:border-ring bg-transparent min-h-[60px]"
                />
              ) : (
                <div className="border-0 border-b-2 border-border rounded-none px-0 bg-transparent min-h-[60px] py-2">
                  {currentAnswer ? (
                    <div className="text-foreground whitespace-pre-wrap">
                      {currentAnswer as string}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">
                      No answer provided
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "slider":
        const minValue = parseInt(question.question_options?.[0] || "1");
        const maxValue = parseInt(question.question_options?.[1] || "10");
        const minLabel = question.question_options?.[2] || "";
        const maxLabel = question.question_options?.[3] || "";
        const sliderValue =
          readOnly && currentAnswer
            ? parseInt(currentAnswer as string)
            : interactive && currentAnswer
              ? parseInt(currentAnswer as string)
              : Math.floor((minValue + maxValue) / 2);

        return (
          <div
            key={question.id}
            className="space-y-4 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <Label className="text-base font-medium text-foreground flex items-center gap-1">
              {question.question_text}
              {question.is_required && (
                <span className="text-destructive text-lg">*</span>
              )}
            </Label>

            <div className="space-y-4">
              {/* Labels */}
              {(minLabel || maxLabel) && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{minLabel}</span>
                  <span>{maxLabel}</span>
                </div>
              )}

              {/* Slider */}
              <div className="px-2">
                <div className="space-y-2">
                  <input
                    type="range"
                    min={minValue}
                    max={maxValue}
                    value={sliderValue}
                    onChange={
                      interactive
                        ? (e) => handleAnswerChange(question.id, e.target.value)
                        : undefined
                    }
                    disabled={!interactive}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none slider"
                    style={{
                      background: `linear-gradient(to right, #50B498 0%, #50B498 ${
                        ((sliderValue - minValue) / (maxValue - minValue)) * 100
                      }%, #e5e7eb ${
                        ((sliderValue - minValue) / (maxValue - minValue)) * 100
                      }%, #e5e7eb 100%)`,
                      cursor: interactive ? "pointer" : "not-allowed",
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{minValue}</span>
                    <span className="font-semibold text-foreground">
                      {readOnly && currentAnswer
                        ? `Answer: ${currentAnswer}`
                        : interactive
                          ? `Selected: ${currentAnswer || minValue}`
                          : "Preview Mode"}
                    </span>
                    <span>{maxValue}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "multiple_choice":
        return (
          <div
            key={question.id}
            className="space-y-4 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <Label className="text-base font-medium text-foreground flex items-center gap-1">
              {question.question_text}
              {question.is_required && (
                <span className="text-destructive text-lg">*</span>
              )}
            </Label>
            <RadioGroup
              disabled={!interactive}
              value={(currentAnswer as string) || ""}
              onValueChange={
                interactive
                  ? (value) => handleAnswerChange(question.id, value)
                  : undefined
              }
              className="space-y-1"
            >
              {question.question_options?.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="flex items-center space-x-3 p-2 rounded hover:bg-accent"
                >
                  <RadioGroupItem
                    value={option}
                    id={`${question.id}-${optIndex}`}
                    disabled={!interactive}
                    className="border-primary"
                  />
                  <Label
                    htmlFor={`${question.id}-${optIndex}`}
                    className={`text-foreground flex-1 ${interactive ? "cursor-pointer" : "cursor-not-allowed"} ${
                      readOnly && currentAnswer === option ? "font-medium" : ""
                    }`}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {readOnly && !currentAnswer && (
              <div className="text-muted-foreground italic text-sm">
                No answer provided
              </div>
            )}
          </div>
        );

      case "multiple_select":
        const selectedOptions = (currentAnswer as string[]) || [];
        return (
          <div
            key={question.id}
            className="space-y-4 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <Label className="text-base font-medium text-foreground flex items-center gap-1">
              {question.question_text}
              {question.is_required && (
                <span className="text-destructive text-lg">*</span>
              )}
            </Label>
            <div className="text-sm text-muted-foreground mb-3">
              Select all that apply
            </div>
            <div className="space-y-3">
              {question.question_options?.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="flex items-center space-x-3 p-2 rounded hover:bg-accent"
                >
                  <Checkbox
                    id={`${question.id}-${optIndex}`}
                    disabled={!interactive}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={
                      interactive
                        ? (checked) => {
                            const currentSelections = selectedOptions;
                            if (checked) {
                              handleAnswerChange(question.id, [
                                ...currentSelections,
                                option,
                              ]);
                            } else {
                              handleAnswerChange(
                                question.id,
                                currentSelections.filter(
                                  (item) => item !== option
                                )
                              );
                            }
                          }
                        : undefined
                    }
                    className="border-border"
                  />
                  <Label
                    htmlFor={`${question.id}-${optIndex}`}
                    className={`text-foreground flex-1 ${interactive ? "cursor-pointer" : "cursor-not-allowed"} ${
                      readOnly && selectedOptions.includes(option)
                        ? "font-medium"
                        : ""
                    }`}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {readOnly && selectedOptions.length === 0 && (
              <div className="text-muted-foreground italic text-sm">
                No answers selected
              </div>
            )}
          </div>
        );

      case "likert":
        const { scaleOptions, leftLabel, rightLabel } =
          generateLikertOptions(question);

        return (
          <div
            key={question.id}
            className="space-y-4 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <Label className="text-base font-medium text-foreground flex items-center gap-1">
              {question.question_text}
              {question.is_required && (
                <span className="text-destructive text-lg">*</span>
              )}
            </Label>

            {/* Likert Scale */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground px-2">
                {leftLabel && (
                  <span className="text-left max-w-[120px]">{leftLabel}</span>
                )}
                <div className="flex-1" />
                {rightLabel && (
                  <span className="text-right max-w-[120px]">{rightLabel}</span>
                )}
              </div>

              <div className="flex justify-center items-center space-x-8">
                {scaleOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex flex-col items-center space-y-2"
                  >
                    <button
                      type="button"
                      disabled={!interactive}
                      onClick={
                        interactive
                          ? () => handleAnswerChange(question.id, option.value)
                          : undefined
                      }
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                        currentAnswer === option.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : interactive
                            ? "border-border hover:border-ring cursor-pointer"
                            : "border-border cursor-not-allowed"
                      }`}
                    >
                      {option.value}
                    </button>
                  </div>
                ))}
              </div>
              {readOnly && !currentAnswer && (
                <div className="text-center text-muted-foreground italic text-sm">
                  No rating provided
                </div>
              )}
            </div>
          </div>
        );

      case "nasa_tlx":
        const nasaTlxScales = question.question_options || [];

        return (
          <div
            key={question.id}
            className="space-y-6 p-6 bg-card rounded-lg border border-border hover:border-ring transition-colors"
          >
            <Label className="text-base font-medium text-foreground flex items-center gap-1">
              {question.question_text}
              {question.is_required && (
                <span className="text-destructive text-lg">*</span>
              )}
            </Label>

            {nasaTlxScales.length > 0 ? (
              <div className="space-y-8">
                {nasaTlxScales.map((scaleName) => (
                  <div key={scaleName} className="space-y-3">
                    <h4 className="font-medium text-foreground">{scaleName}</h4>
                    {renderNasaTlxScale(question.id, scaleName, interactive)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                No scales added yet. Add scales in the editor to see them here.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // If survey was submitted successfully, show success message
  if (submitted) {
    return (
      <div className={`${className}`}>
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
    <div className={`${className}`}>
      <Card className="shadow-sm py-0">
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
            {/* User Information Section */}
            <Card className="border border-sidebar bg-background pt-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium text-foreground">
                  Participant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-foreground flex items-center gap-1">
                      Username
                      {!readOnly && (
                        <span className="text-destructive text-lg">*</span>
                      )}
                    </Label>
                    <Input
                      value={user?.first_name || "demo_user"}
                      disabled
                      className="border-0 border-b-2 border-border rounded-none px-0 focus:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-medium text-foreground flex items-center gap-1">
                      Participant ID
                      {!readOnly && (
                        <span className="text-destructive text-lg">*</span>
                      )}
                    </Label>
                    <Input
                      value={user?.pid || "PID123456"}
                      disabled
                      className="border-0 border-b-2 border-border rounded-none px-0 focus:border-ring"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Survey Questions */}
            <div className="space-y-6">
              {survey.questions
                .sort((a, b) => a.question_number - b.question_number)
                .map(renderQuestion)}

              {survey.questions.length === 0 && (
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
            </div>

            {/* Submit Section */}
            {!readOnly && survey.questions.length > 0 && (
              <Card className="bg-card border border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <Button
                      type="submit"
                      disabled={!interactive || submitting}
                      className={`w-full sm:w-auto font-medium px-8 py-3 ${!interactive ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {submitting ? "Submitting..." : "Submit Survey"}
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      {interactive
                        ? "Please review your answers before submitting"
                        : "This is a preview - form is not functional"}
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
