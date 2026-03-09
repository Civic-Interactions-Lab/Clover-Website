import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient.ts";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, X, Save, Trash2, Eye, GripVertical, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Types ─────────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  "text",
  "long_text",
  "likert",
  "rating",
  "multiple_choice",
  "checkbox",
  "nasa_tlx",
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Short answer",
  long_text: "Long answer",
  likert: "Likert scale",
  rating: "Rating (slider)",
  multiple_choice: "Multiple choice",
  checkbox: "Checkboxes",
  nasa_tlx: "NASA-TLX",
};

const TYPES_WITH_OPTIONS: QuestionType[] = ["multiple_choice", "checkbox"];

const NASA_TLX_DIMENSIONS = [
  "Mental Demand",
  "Physical Demand",
  "Temporal Demand",
  "Performance",
  "Effort",
  "Frustration",
] as const;

interface SurveyQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  required: boolean;
  options?: string[];
  points?: number;
  labels?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const QUESTION_DEFAULTS: Record<QuestionType, Partial<SurveyQuestion>> = {
  text: {},
  long_text: {},
  likert: {
    points: 5,
    labels: ["Strongly Disagree", "", "", "", "Strongly Agree"],
  },
  rating: { min: 1, max: 10, step: 1 },
  multiple_choice: { options: [] },
  checkbox: { options: [] },
  nasa_tlx: { min: 0, max: 100, step: 5 },
};

function generateId() {
  return crypto.randomUUID().slice(0, 8);
}

// ── Question config ───────────────────────────────────────────────────────────

function QuestionConfig({
  question,
  onChange,
}: {
  question: SurveyQuestion;
  onChange: (q: SurveyQuestion) => void;
}) {
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    const t = newOption.trim();
    if (!t) return;
    onChange({ ...question, options: [...(question.options ?? []), t] });
    setNewOption("");
  };

  if (question.type === "likert") {
    const pts = question.points ?? 5;
    const labels = question.labels ?? [];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium w-32">Scale Size</Label>
          <Select
            value={String(pts)}
            onValueChange={(v) => {
              const n = Number(v);
              const defaultLabels = QUESTION_DEFAULTS.likert.labels ?? [];
              onChange({
                ...question,
                points: n,
                labels: Array.from(
                  { length: n },
                  (_, i) => labels[i] ?? defaultLabels[i] ?? `${i + 1}`,
                ),
              });
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 7, 9].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}-point scale
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Left end", index: 0 },
            { label: "Right end", index: pts - 1 },
          ].map(({ label, index }) => (
            <div key={index}>
              <Label className="block text-sm font-medium mb-2">{label}</Label>
              <Input
                value={labels[index] ?? ""}
                onChange={(e) => {
                  const next = [...labels];
                  next[index] = e.target.value;
                  onChange({ ...question, labels: next });
                }}
                placeholder={label}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === "rating") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {(["min", "max", "step"] as const).map((field) => (
            <div key={field}>
              <Label className="block text-sm font-medium mb-2 capitalize">
                {field}
              </Label>
              <Input
                type="number"
                value={
                  question[field] ??
                  (field === "min" ? 1 : field === "max" ? 10 : 1)
                }
                onChange={(e) =>
                  onChange({ ...question, [field]: Number(e.target.value) })
                }
              />
            </div>
          ))}
        </div>
        <div>
          <Label className="block text-sm font-medium mb-2">Preview</Label>
          <Slider
            min={question.min ?? 1}
            max={question.max ?? 10}
            step={question.step ?? 1}
            defaultValue={[question.min ?? 1]}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{question.min ?? 1}</span>
            <span>{question.max ?? 10}</span>
          </div>
        </div>
      </div>
    );
  }

  if (TYPES_WITH_OPTIONS.includes(question.type)) {
    return (
      <div>
        <Label className="block text-sm font-medium mb-2">Options</Label>
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(question.options ?? [])];
                  newOptions[i] = e.target.value;
                  onChange({ ...question, options: newOptions });
                }}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    ...question,
                    options: question.options?.filter((_, idx) => idx !== i),
                  })
                }
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
              placeholder="Add option..."
            />
            <Button variant="outline" size="sm" onClick={addOption}>
              Add
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (question.type === "nasa_tlx") {
    const selected = question.options ?? [];
    const toggle = (dim: string) => {
      const next = selected.includes(dim)
        ? selected.filter((d) => d !== dim)
        : [...selected, dim];
      onChange({ ...question, options: next });
    };
    return (
      <div>
        <Label className="block text-sm font-medium mb-2">Dimensions</Label>
        <div className="flex flex-wrap gap-2">
          {NASA_TLX_DIMENSIONS.map((d) => {
            const active = selected.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:border-border"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        {selected.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">
            Select at least one dimension.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {selected.length} selected · 0–100 slider · step 5
        </p>
      </div>
    );
  }

  return null;
}

// ── Sortable question card ────────────────────────────────────────────────────

function SortableQuestionCard({
  question,
  index,
  isEditing,
  onToggleEdit,
  onChange,
  onDelete,
}: {
  question: SurveyQuestion;
  index: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onChange: (q: SurveyQuestion) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="border p-4 rounded-lg"
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical size={16} />
          </button>
          <span className="text-xs px-2 py-1 rounded bg-muted">
            {QUESTION_TYPE_LABELS[question.type]}
          </span>
          {question.required && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              Required
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isEditing ? "outline" : "default"}
            onClick={onToggleEdit}
          >
            {isEditing ? (
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
            onClick={onDelete}
            className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-700/70 border-red-200 hover:border-red-300"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Collapsed preview */}
      {!isEditing && (
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
          {question.prompt || (
            <span className="italic text-muted-foreground">No prompt set</span>
          )}
        </p>
      )}

      {/* Expanded edit form */}
      {isEditing && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label className="block text-sm font-medium mb-2">
              Question Text
            </Label>
            <Textarea
              value={question.prompt}
              onChange={(e) =>
                onChange({ ...question, prompt: e.target.value })
              }
              placeholder="Enter your question..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="block text-sm font-medium mb-2">Type</Label>
              <Select
                value={question.type}
                onValueChange={(v) => {
                  const type = v as QuestionType;
                  onChange({
                    id: question.id,
                    type,
                    prompt: question.prompt,
                    required: question.required,
                    ...QUESTION_DEFAULTS[type],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                id={`req-${question.id}`}
                checked={question.required}
                onCheckedChange={(v) => onChange({ ...question, required: v })}
              />
              <Label
                htmlFor={`req-${question.id}`}
                className="text-sm cursor-pointer"
              >
                Required
              </Label>
            </div>
          </div>

          <QuestionConfig question={question} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface SurveyRow {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  questions: SurveyQuestion[];
}

const CreateEditSurveyView = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (!surveyId || initialized.current) return;
    initialized.current = true;

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        const { data, error } = await supabase
          .from("surveys")
          .select("*")
          .eq("id", surveyId)
          .single<SurveyRow>();

        if (error) throw error;

        setTitle(data.title);
        setDescription(data.description ?? "");
        setIsActive(data.is_active);
        setQuestions((data.questions as SurveyQuestion[]) ?? []);
      } catch (err) {
        console.error("Error loading survey:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [surveyId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setQuestions((prev) => {
      const oldIndex = prev.findIndex((q) => q.id === active.id);
      const newIndex = prev.findIndex((q) => q.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = useCallback(async () => {
    if (!surveyId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("surveys")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          is_active: isActive,
          questions,
        })
        .eq("id", surveyId);

      if (error) throw error;
    } catch (err) {
      console.error("Error saving survey:", err);
    } finally {
      setSaving(false);
    }
  }, [surveyId, title, description, isActive, questions]);

  const addQuestion = () => {
    const newQ: SurveyQuestion = {
      id: generateId(),
      type: "text",
      prompt: "",
      required: false,
    };
    setQuestions((prev) => [...prev, newQ]);
    setEditingId(newQ.id);
  };

  const updateQuestion = (i: number, q: SurveyQuestion) =>
    setQuestions((prev) => prev.map((x, idx) => (idx === i ? q : x)));

  const deleteQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
    setDeleteIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p>Loading survey editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header bar */}
        <div className="flex justify-between items-center rounded-t-lg bg-gray-300 dark:bg-gray-800 border border-b-0 p-6">
          <div>
            <h2 className="text-xl font-semibold">Edit Survey</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/survey?surveyId=${surveyId}&userId=${currentUserId ?? ""}`,
                )
              }
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Survey"}
            </Button>
          </div>
        </div>

        <div className="border border-t-0 rounded-b-lg space-y-6 p-6">
          {/* Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Overview</h3>
            <div className="border p-6 rounded-lg space-y-4">
              <div>
                <Label className="block text-sm font-medium mb-2">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter survey title"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter survey description"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="survey-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label
                  htmlFor="survey-active"
                  className="text-sm cursor-pointer"
                >
                  Open for responses
                </Label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions</h3>

            {questions.length === 0 && (
              <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                No questions yet. Add some questions to get started.
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <SortableQuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      isEditing={editingId === q.id}
                      onToggleEdit={() =>
                        setEditingId(editingId === q.id ? null : q.id)
                      }
                      onChange={(updated) => updateQuestion(i, updated)}
                      onDelete={() => setDeleteIndex(i)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <Button
              variant="outline"
              className="w-full flex items-center gap-2 mt-2"
              onClick={addQuestion}
            >
              <Plus size={16} />
              Add question
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={(o) => !o && setDeleteIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove Q{(deleteIndex ?? 0) + 1}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteIndex !== null && deleteQuestion(deleteIndex)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateEditSurveyView;
