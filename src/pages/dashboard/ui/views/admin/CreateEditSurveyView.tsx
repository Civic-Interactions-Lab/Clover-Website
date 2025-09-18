import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Edit,
  FileText,
  List,
  Plus,
  Trash2,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

// Types
interface Survey {
  id: string;
  title: string;
  description: string;
  context: string;
  type: string;
  created_at: string;
  questions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_type: "text" | "multiple_choice";
  question_number: number;
  question_text: string;
  question_options?: string[];
  is_required: boolean;
  created_at: string;
}

// Question Item Component
interface QuestionItemProps {
  question: SurveyQuestion;
  editingQuestion: string | null;
  setEditingQuestion: (id: string | null) => void;
  updateQuestion: (
    questionId: string,
    updates: Partial<SurveyQuestion>
  ) => void;
  deleteQuestion: (questionId: string) => void;
  moveUp: (questionId: string) => void;
  moveDown: (questionId: string) => void;
  questionsCount: number;
}

const QuestionItem = ({
  question,
  editingQuestion,
  setEditingQuestion,
  updateQuestion,
  deleteQuestion,
  moveUp,
  moveDown,
  questionsCount,
}: QuestionItemProps) => {
  const handleDeleteOption = (optionIndex: number) => {
    if (!question.question_options) return;

    const newOptions = question.question_options.filter(
      (_, index) => index !== optionIndex
    );
    updateQuestion(question.id, { question_options: newOptions });
  };

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">Q{question.question_number}</span>
          <span className="mb-1">|</span>
          <span className="text-xs">
            {question.question_type.replace(/_/g, " ").toUpperCase()}
          </span>
          {question.is_required && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => moveUp(question.id)}
            disabled={question.question_number <= 1}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => moveDown(question.id)}
            disabled={question.question_number >= questionsCount}
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant={editingQuestion === question.id ? "outline" : "default"}
            onClick={() =>
              setEditingQuestion(
                editingQuestion === question.id ? null : question.id
              )
            }
          >
            {editingQuestion === question.id ? (
              <span className="flex items-center gap-1.5">
                <X size={16} /> Close
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Edit size={16} /> Edit
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteQuestion(question.id)}
            className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-700/70 border-red-200 hover:border-red-300"
          >
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </div>

      {/* Question preview when not editing */}
      {editingQuestion !== question.id && (
        <div className="text-sm text-gray-600 mb-2">
          {question.question_text}
        </div>
      )}

      {/* Question editor */}
      {editingQuestion === question.id && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label className="block text-sm font-medium mb-2">
              Question Text
            </Label>
            <Textarea
              value={question.question_text}
              onChange={(e) =>
                updateQuestion(question.id, {
                  question_text: e.target.value,
                })
              }
              placeholder="Enter your question..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`required-${question.id}`}
              checked={question.is_required}
              onChange={(e) =>
                updateQuestion(question.id, {
                  is_required: e.target.checked,
                })
              }
              className="rounded"
            />
            <Label htmlFor={`required-${question.id}`} className="text-sm">
              Required
            </Label>
          </div>

          {question.question_type === "multiple_choice" && (
            <div>
              <Label className="block text-sm font-medium mb-2">
                Multiple Choice Options
              </Label>
              <div className="space-y-2">
                {question.question_options?.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [
                          ...(question.question_options || []),
                        ];
                        newOptions[index] = e.target.value;
                        updateQuestion(question.id, {
                          question_options: newOptions,
                        });
                      }}
                      className="px-2"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                )) || []}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentOptions = question.question_options || [];
                    updateQuestion(question.id, {
                      question_options: [
                        ...currentOptions,
                        `Option ${currentOptions.length + 1}`,
                      ],
                    });
                  }}
                  className="w-full mt-2"
                >
                  <Plus size={16} className="mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Survey Preview Component - Non-Interactive
const SurveyPreview = ({ survey }: { survey: Survey }) => {
  return (
    <div className="py-4">
      <Card className="shadow-lg bg-gray-900">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            {survey.title || "Untitled Survey"}
          </CardTitle>
          {survey.description && (
            <CardDescription className="text-gray-300 mt-2">
              {survey.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* User Information Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Username</Label>
              <Input
                value="demo_user"
                disabled
                className="border cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">
                Participant ID
              </Label>
              <Input
                value="PID123456"
                disabled
                className="border cursor-not-allowed"
              />
            </div>
          </div>

          <Separator className="bg-gray-400" />

          <div className="space-y-8">
            {survey.questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium text-white">
                    {question.question_text}
                    {question.is_required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </Label>

                  {question.question_type === "text" ? (
                    <Input
                      value=""
                      disabled
                      placeholder="Enter your response..."
                      className="border cursor-not-allowed"
                    />
                  ) : question.question_type === "multiple_choice" ? (
                    <RadioGroup
                      disabled
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 pointer-events-none"
                    >
                      {question.question_options?.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.toLowerCase().replace(/\s+/g, "_")}
                            id={`${question.id}-${optIndex}`}
                            disabled
                          />
                          <Label
                            htmlFor={`${question.id}-${optIndex}`}
                            className="text-sm text-white cursor-not-allowed"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : null}
                </div>
              </div>
            ))}

            {survey.questions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No questions added yet. Add questions in the editor to see them
                here.
              </div>
            )}
          </div>

          {/* Submit Button Preview */}
          {survey.questions.length > 0 && (
            <div className="pt-4">
              <Button disabled className="w-full cursor-not-allowed">
                Submit Survey
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
const CreateEditSurveyView = () => {
  const [survey, setSurvey] = useState<Survey>({
    id: "",
    title: "",
    description: "",
    context: "",
    type: "research",
    created_at: "",
    questions: [],
  });

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [isNewSurvey, setIsNewSurvey] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(
    new Map()
  );

  // Get surveyId from URL - you'll need to replace this with your router logic
  const pathname = window.location.pathname;
  const surveyId = pathname.includes("/survey/")
    ? pathname.split("/survey/")[1]
    : null;

  const debouncedUpdates = useDebounce(pendingUpdates, 500) as Map<string, any>;

  useEffect(() => {
    initializeSurvey();
  }, []);

  // Handle debounced updates
  useEffect(() => {
    const processUpdates = async () => {
      if (debouncedUpdates.size === 0) return;

      const updates = Array.from(debouncedUpdates.entries());
      setPendingUpdates(new Map());

      for (const [questionId, updateData] of updates) {
        try {
          const { error } = await supabase
            .from("survey_questions")
            .update(updateData)
            .eq("id", questionId);

          if (error) throw error;
        } catch (err) {
          console.error("Failed to update question:", err);
        }
      }
    };

    processUpdates();
  }, [debouncedUpdates]);

  const initializeSurvey = async () => {
    try {
      setLoading(true);

      if (surveyId && surveyId !== "new") {
        // Edit existing survey
        setIsNewSurvey(false);
        await loadExistingSurvey(surveyId);
      } else {
        // Create new survey
        setIsNewSurvey(true);
        await createNewSurvey();
      }
    } catch (error) {
      console.error("Error initializing survey:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSurvey = async (id: string) => {
    try {
      // Load survey
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", id)
        .single();

      if (surveyError) throw surveyError;

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", id)
        .order("question_number");

      if (questionsError) throw questionsError;

      setSurvey({ ...surveyData, questions: questionsData || [] });
      setQuestions(questionsData || []);
    } catch (error) {
      console.error("Error loading survey:", error);
    }
  };

  const createNewSurvey = async () => {
    try {
      const newSurveyData = {
        title: "New Survey",
        description: "",
        context: "",
        type: "research",
      };

      const { data, error } = await supabase
        .from("surveys")
        .insert([newSurveyData])
        .select()
        .single();

      if (error) throw error;

      setSurvey({ ...data, questions: [] });
      setQuestions([]);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error creating new survey:", error);
    }
  };

  const updateSurveyField = async (field: keyof Survey, value: string) => {
    setSurvey((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);

    // Immediate update for survey fields
    try {
      const { error } = await supabase
        .from("surveys")
        .update({ [field]: value })
        .eq("id", survey.id);

      if (error) throw error;
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  };

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<SurveyQuestion>) => {
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId ? { ...question, ...updates } : question
        )
      );
      setHasUnsavedChanges(true);

      // Add to pending updates for debounced save
      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(questionId) || {};
        newMap.set(questionId, { ...existing, ...updates });
        return newMap;
      });
    },
    []
  );

  const addQuestion = async (type: "text" | "multiple_choice") => {
    const newQuestionNumber =
      Math.max(...questions.map((q) => q.question_number), 0) + 1;

    const newQuestionData = {
      survey_id: survey.id,
      question_type: type,
      question_number: newQuestionNumber,
      question_text:
        type === "text" ? "New text question" : "New multiple choice question",
      question_options:
        type === "multiple_choice" ? ["Option 1", "Option 2"] : null,
      is_required: false,
    };

    try {
      const { data, error } = await supabase
        .from("survey_questions")
        .insert([newQuestionData])
        .select()
        .single();

      if (error) throw error;

      setQuestions((prev) => [...prev, data]);
      setEditingQuestion(data.id);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from("survey_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setQuestions((prev) => {
        const filtered = prev.filter((question) => question.id !== questionId);
        return filtered.map((question, index) => ({
          ...question,
          question_number: index + 1,
        }));
      });

      // Update question numbers in database
      const updatedQuestions = questions
        .filter((q) => q.id !== questionId)
        .map((question, index) => ({
          ...question,
          question_number: index + 1,
        }));

      for (const question of updatedQuestions) {
        await supabase
          .from("survey_questions")
          .update({ question_number: question.question_number })
          .eq("id", question.id);
      }

      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const moveQuestionUp = async (questionId: string) => {
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex <= 0) return;

    const newQuestions = [...questions];
    [newQuestions[questionIndex - 1], newQuestions[questionIndex]] = [
      newQuestions[questionIndex],
      newQuestions[questionIndex - 1],
    ];

    const updatedQuestions = newQuestions.map((question, idx) => ({
      ...question,
      question_number: idx + 1,
    }));

    setQuestions(updatedQuestions);
    setHasUnsavedChanges(true);

    // Update in database
    try {
      for (const question of updatedQuestions) {
        await supabase
          .from("survey_questions")
          .update({ question_number: question.question_number })
          .eq("id", question.id);
      }
    } catch (error) {
      console.error("Error updating question order:", error);
    }
  };

  const moveQuestionDown = async (questionId: string) => {
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex >= questions.length - 1) return;

    const newQuestions = [...questions];
    [newQuestions[questionIndex], newQuestions[questionIndex + 1]] = [
      newQuestions[questionIndex + 1],
      newQuestions[questionIndex],
    ];

    const updatedQuestions = newQuestions.map((question, idx) => ({
      ...question,
      question_number: idx + 1,
    }));

    setQuestions(updatedQuestions);
    setHasUnsavedChanges(true);

    // Update in database
    try {
      for (const question of updatedQuestions) {
        await supabase
          .from("survey_questions")
          .update({ question_number: question.question_number })
          .eq("id", question.id);
      }
    } catch (error) {
      console.error("Error updating question order:", error);
    }
  };

  const saveSurvey = async () => {
    try {
      setSaving(true);
      setHasUnsavedChanges(false);
      // All updates are already handled in real-time
    } catch (error) {
      console.error("Error saving survey:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSurvey = async () => {
    if (!survey.id || !isNewSurvey) return;

    try {
      const { error } = await supabase
        .from("surveys")
        .delete()
        .eq("id", survey.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting survey:", error);
    }
  };

  const getPreviewData = (): Survey => ({
    ...survey,
    questions: questions.sort((a, b) => a.question_number - b.question_number),
  });

  // Handle page unload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isNewSurvey) {
        e.preventDefault();
        e.returnValue = "";
        deleteSurvey();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isNewSurvey, survey.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p>Loading survey editor...</p>
        </div>
      </div>
    );
  }

  const previewData = getPreviewData();

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header with save button */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {isNewSurvey ? "Create Survey" : "Edit Survey"}
            </h1>
            {hasUnsavedChanges && (
              <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={16} />
                You have unsaved changes
              </p>
            )}
          </div>
          <Button
            onClick={saveSurvey}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Survey"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Editor */}
          <div className="rounded-lg lg:sticky lg:top-8 border">
            <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900 rounded-t-lg">
              <h2 className="text-xl font-semibold">Edit Survey</h2>
            </div>
            <div className="space-y-6 lg:max-h-screen lg:overflow-y-auto px-4">
              {/* Survey metadata editor */}
              <div className="border p-6 rounded-lg mt-6">
                <h2 className="text-xl font-semibold mb-4">Survey Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Survey Title
                    </Label>
                    <Input
                      type="text"
                      value={survey.title}
                      onChange={(e) =>
                        updateSurveyField("title", e.target.value)
                      }
                      placeholder="Enter survey title"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Description
                    </Label>
                    <Textarea
                      value={survey.description}
                      onChange={(e) =>
                        updateSurveyField("description", e.target.value)
                      }
                      placeholder="Enter survey description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Context
                    </Label>
                    <Input
                      type="text"
                      value={survey.context}
                      onChange={(e) =>
                        updateSurveyField("context", e.target.value)
                      }
                      placeholder="e.g., pre_survey, post_survey"
                    />
                  </div>
                </div>
              </div>

              {/* Questions editor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Questions</h3>

                {questions
                  .sort((a, b) => a.question_number - b.question_number)
                  .map((question) => (
                    <QuestionItem
                      key={question.id}
                      question={question}
                      editingQuestion={editingQuestion}
                      setEditingQuestion={setEditingQuestion}
                      updateQuestion={updateQuestion}
                      deleteQuestion={deleteQuestion}
                      moveUp={moveQuestionUp}
                      moveDown={moveQuestionDown}
                      questionsCount={questions.length}
                    />
                  ))}

                {questions.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    No questions yet. Add some questions to get started.
                  </div>
                )}
              </div>

              {/* Add question controls */}
              <div className="border p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-4">Add Questions</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => addQuestion("text")}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Text Question
                  </Button>
                  <Button
                    onClick={() => addQuestion("multiple_choice")}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <List size={16} />
                    Multiple Choice
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div className="border rounded-lg lg:sticky lg:top-8">
            <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
              <h2 className="text-xl font-semibold">Live Preview</h2>
            </div>
            <div className="lg:max-h-screen lg:overflow-y-auto">
              <SurveyPreview survey={previewData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEditSurveyView;
