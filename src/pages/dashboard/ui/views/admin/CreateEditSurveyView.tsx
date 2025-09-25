import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Edit,
  FileText,
  List,
  Plus,
  Trash2,
  X,
  Save,
  AlertTriangle,
  Heading2,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import SurveyPreview, {
  Survey,
  SurveyQuestion,
} from "../../components/SurveyPreview";
import CustomSelect from "@/components/CustomSelect";

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
    if (!surveyId) return;

    try {
      setLoading(true);

      await loadExistingSurvey(surveyId);
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
      // Always update local state
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId ? { ...question, ...updates } : question
        )
      );

      setHasUnsavedChanges(true);

      // Add to pending updates for debounced save (now includes section titles)
      setPendingUpdates((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(questionId) || {};
        newMap.set(questionId, { ...existing, ...updates });
        return newMap;
      });
    },
    [questions]
  );

  const addQuestion = async (
    type:
      | "text"
      | "multiple_choice"
      | "multiple_select"
      | "likert"
      | "section_title"
  ) => {
    // Get the next order number for all questions (including section titles)
    const maxQuestionNumber = Math.max(
      ...questions.map((q) => q.question_number),
      0
    );
    const newQuestionNumber = maxQuestionNumber + 1;

    let newQuestionData;

    if (type === "section_title") {
      newQuestionData = {
        survey_id: survey.id,
        question_type: type,
        question_number: newQuestionNumber,
        question_text: "New Section",
        question_options: [""], // For optional description
        is_required: false,
      };
    } else {
      switch (type) {
        case "multiple_select":
          newQuestionData = {
            survey_id: survey.id,
            question_type: type,
            question_number: newQuestionNumber,
            question_text: "New multiple select question",
            question_options: ["Option 1", "Option 2", "Option 3"],
            is_required: false,
          };
          break;

        case "likert":
          newQuestionData = {
            survey_id: survey.id,
            question_type: type,
            question_number: newQuestionNumber,
            question_text: "New Likert scale question",
            question_options: ["5", "Strongly Disagree", "Strongly Agree"],
            is_required: false,
          };
          break;

        case "multiple_choice":
          newQuestionData = {
            survey_id: survey.id,
            question_type: type,
            question_number: newQuestionNumber,
            question_text: "New multiple choice question",
            question_options: ["Option 1", "Option 2"],
            is_required: false,
          };
          break;

        case "text":
        default:
          newQuestionData = {
            survey_id: survey.id,
            question_type: type,
            question_number: newQuestionNumber,
            question_text: "New text question",
            is_required: false,
          };
          break;
      }
    }

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

        // Renumber all questions to maintain proper order
        return filtered.map((question, index) => ({
          ...question,
          question_number: index + 1,
        }));
      });

      // Update question numbers in database for remaining questions
      const remainingQuestions = questions
        .filter((q) => q.id !== questionId)
        .map((question, index) => ({
          ...question,
          question_number: index + 1,
        }));

      for (const question of remainingQuestions) {
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

    // Update in database (now includes section titles)
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

    // Update in database (now includes section titles)
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
    if (!survey.id) return;

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
      if (hasUnsavedChanges) {
        e.preventDefault();
        deleteSurvey();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, survey.id]);

  const AddQuestionsSection = () => {
    return (
      <div className="border p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Add Questions & Sections</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => addQuestion("section_title")}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Heading2 size={16} />
            Section Title
          </Button>

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

          <Button
            onClick={() => addQuestion("multiple_select")}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckSquare size={16} />
            Multiple Select
          </Button>

          <Button
            onClick={() => addQuestion("likert")}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <BarChart3 size={16} />
            Likert Scale
          </Button>
        </div>

        <div className="mt-4 p-3 text-sm text-orange-300">
          <strong>Tip:</strong> Use Section Titles to organize your survey into
          logical groups of questions.
        </div>
      </div>
    );
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Editor */}
          <div className="rounded-lg lg:sticky lg:top-8 border">
            <div className="flex justify-between items-center rounded-t-lg bg-gray-300 dark:bg-gray-800 border-b p-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-semibold">Edit Survey</h2>
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
            <div className="space-y-6 lg:max-h-screen lg:overflow-y-auto px-4">
              {/* Survey metadata editor */}
              <h2 className="text-lg font-semibold mt-6 mb-4">Overview</h2>
              <div className="border p-6 rounded-lg mt-6">
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">
                      Title
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
                      placeholder="e.g., classroom, labs, one-on-one"
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
              <AddQuestionsSection />
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
  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      text: "TEXT",
      multiple_choice: "MULTIPLE CHOICE",
      multiple_select: "MULTIPLE SELECT",
      likert: "LIKERT SCALE",
      section_title: "SECTION",
    };
    return labels[type as keyof typeof labels] || type.toUpperCase();
  };

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
          <span className="text-xs px-2 py-1 rounded">
            {getQuestionTypeLabel(question.question_type)}
          </span>
          {question.is_required &&
            question.question_type !== "section_title" && (
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
          {question.question_type === "section_title" ? (
            <div>
              <div className="font-semibold text-lg text-muted-foreground">
                {question.question_text}
              </div>
              {question.question_options?.[0] && (
                <div className="text-sm mt-1">
                  {question.question_options[0]}
                </div>
              )}
            </div>
          ) : (
            question.question_text
          )}
        </div>
      )}

      {/* Question editor */}
      {editingQuestion === question.id && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label className="block text-sm font-medium mb-2">
              {question.question_type === "section_title"
                ? "Section Title"
                : "Question Text"}
            </Label>
            <Textarea
              value={question.question_text}
              onChange={(e) =>
                updateQuestion(question.id, {
                  question_text: e.target.value,
                })
              }
              placeholder={
                question.question_type === "section_title"
                  ? "Enter section title..."
                  : "Enter your question..."
              }
              rows={2}
            />
          </div>

          {question.question_type === "section_title" && (
            <div>
              <Label className="block text-sm font-medium mb-2">
                Section Description (Optional)
              </Label>
              <Textarea
                value={question.question_options?.[0] || ""}
                onChange={(e) =>
                  updateQuestion(question.id, {
                    question_options: [e.target.value],
                  })
                }
                placeholder="Enter section description..."
                rows={2}
              />
            </div>
          )}

          {question.question_type !== "section_title" && (
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
          )}

          {(question.question_type === "multiple_choice" ||
            question.question_type === "multiple_select") && (
            <div>
              <Label className="block text-sm font-medium mb-2">Options</Label>
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

          {question.question_type === "likert" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium w-32">Scale Size</Label>
                <CustomSelect
                  value={question.question_options?.[0] || "5"}
                  onValueChange={(value) => {
                    const currentOptions = question.question_options || ["5"];
                    const newOptions = [
                      value,
                      currentOptions[1] || "",
                      currentOptions[2] || "",
                    ];
                    updateQuestion(question.id, {
                      question_options: newOptions,
                    });
                  }}
                  options={[
                    { value: "3", label: "3-point scale" },
                    { value: "5", label: "5-point scale" },
                    { value: "7", label: "7-point scale" },
                  ]}
                  placeholder="Select scale"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Left Label (Optional)
                  </Label>
                  <Input
                    value={question.question_options?.[1] || ""}
                    onChange={(e) => {
                      const currentOptions = question.question_options || [
                        "5",
                        "",
                        "",
                      ];
                      const newOptions = [
                        currentOptions[0],
                        e.target.value,
                        currentOptions[2],
                      ];
                      updateQuestion(question.id, {
                        question_options: newOptions,
                      });
                    }}
                    placeholder="e.g., Strongly Disagree"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Right Label (Optional)
                  </Label>
                  <Input
                    value={question.question_options?.[2] || ""}
                    onChange={(e) => {
                      const currentOptions = question.question_options || [
                        "5",
                        "",
                        "",
                      ];
                      const newOptions = [
                        currentOptions[0],
                        currentOptions[1],
                        e.target.value,
                      ];
                      updateQuestion(question.id, {
                        question_options: newOptions,
                      });
                    }}
                    placeholder="e.g., Strongly Agree"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
