import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { BASE_ENDPOINT } from "../api/endpoints";
import { useUserClasses } from "../hooks/useUserClasses";
import ClassesDropdownMenu from "./dashboard/ui/components/ClassesDropdownMenu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Paragraph, Title } from "../components/ui/text";
import Loading from "@/components/Loading";
import { ClassInfo } from "@/types/class";

type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  userSectionId: string;
};

type QuizResult = {
  quiz_id: string;
  score: number | null;
  submitted_at: string;
};

/**
 * Props for the QuizControls component.
 */
type QuizControlsProps = {
  classes: ClassInfo[];
  selectedClassId: string | null;
  onClassSelect: (selection: {
    id: string | null;
    type: "all" | "class" | "non-class";
  }) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  previousQuizzes: QuizResult[];
  onPreviousQuizSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onOpenPreviousQuiz: () => void;
};

/**
 * Displays the controls for generating a new quiz or opening a previous one.
 */
const QuizControls = ({
  classes,
  selectedClassId,
  onClassSelect,
  onGenerate,
  isGenerating,
  previousQuizzes,
  onPreviousQuizSelect,
  onOpenPreviousQuiz,
}: QuizControlsProps) => (
  <Card className="p-6 mb-6 w-container grid grid-cols-1 sm:grid-cols-6 gap-4">
    <div className="col-span-full sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select a class:
      </label>
      <ClassesDropdownMenu
        classes={classes}
        onClassSelect={(classId) =>
          onClassSelect({ id: classId, type: "class" })
        }
        selectedId={selectedClassId}
      />
    </div>
    <div className="flex sm:col-span-1 items-end justify-start sm:justify-center pb-1">
      <Button onClick={onGenerate} disabled={isGenerating} className="">
        {isGenerating ? <Loading text="Generating" /> : "Generate"}
      </Button>
    </div>
    <div className="col-span-full sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        View Previous Quizzes:
      </label>
      <select
        className="w-full px-4 py-2 border text-sm rounded bg-white dark:bg-gray-800 border-black dark:border-white h-8"
        onChange={onPreviousQuizSelect}
        defaultValue=""
      >
        <option value="">-- Select a past quiz --</option>
        {previousQuizzes.map((q) => (
          <option key={q.quiz_id} value={q.quiz_id}>
            {new Date(q.submitted_at).toLocaleString()} – Score: {q.score} / 10
          </option>
        ))}
      </select>
    </div>
    <div className="flex sm:col-span-1 items-end justify-start sm:justify-center pb-1">
      <Button
        onClick={onOpenPreviousQuiz}
        disabled={isGenerating}
        className="px-6"
      >
        Open
      </Button>
    </div>
  </Card>
);

/**
 * Props for the QuizDisplay component.
 */
type QuizDisplayProps = {
  quiz: QuizQuestion[];
  answers: Record<string, number | null>;
  submitting: boolean;
  onAnswerSelect: (questionId: string, choiceIndex: number) => void;
};

/**
 * Renders the list of quiz questions and their choices.
 */
const QuizDisplay = ({
  quiz,
  answers,
  submitting,
  onAnswerSelect,
}: QuizDisplayProps) => (
  <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-2">
    {quiz.map((question, index) => (
      <div key={question.id}>
        <p className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
          {index + 1}. {question.question}
        </p>
        <div className="space-y-2">
          {question.choices.map((option, choiceIndex) => (
            <label
              key={choiceIndex}
              className={`block border rounded-md px-4 py-2 cursor-pointer transition-colors ${
                submitting && answers[question.id] === choiceIndex
                  ? question.answerIndex === choiceIndex
                    ? "bg-green-200 dark:bg-green-800 border-green-900" // Correct answer picked
                    : "bg-red-200 dark:bg-red-800 border-red-700" // Incorrect answer picked
                  : answers[question.id] === choiceIndex
                    ? "bg-blue-100 dark:bg-blue-900" // Selected but not submitted
                    : "bg-gray-100 dark:bg-gray-700" // Default
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                onChange={() => onAnswerSelect(question.id, choiceIndex)}
                className="hidden"
                checked={answers[question.id] === choiceIndex}
                disabled={submitting}
              />
              {option}
            </label>
          ))}
        </div>
        {submitting && (
          <p className="mt-2 text-lg text-[#50B498] dark:text-green-400 font-semibold">
            {answers[question.id] === question.answerIndex
              ? "Explanation: "
              : "Hint: "}
            {question.explanation}
          </p>
        )}
      </div>
    ))}
  </div>
);

/**
 * Props for the QuizResults component.
 */
type QuizResultsProps = {
  score: number;
  totalQuestions: number;
  passed: boolean;
  onTryAgain: () => void;
  onBackToDashboard: () => void;
};

/**
 * Displays the results of the quiz after submission.
 */
const QuizResults = ({
  score,
  totalQuestions,
  passed,
  onTryAgain,
  onBackToDashboard,
}: QuizResultsProps) => (
  <>
    <p className="mt-4 text-green-600 font-semibold">
      Your answers have been submitted!
    </p>
    <div className="mt-4">
      <p className="text-lg font-bold">
        Your Score: {score} / {totalQuestions}
      </p>
      <p className="text-lg font-bold">
        Percentage:{" "}
        {totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(2) : 0}%
      </p>

      {passed ? (
        <>
          <p className="text-2xl text-green-600 font-bold mt-4">
            Congratulations! 🎉 You passed!
          </p>
          <button
            onClick={onBackToDashboard}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Dashboard
          </button>
        </>
      ) : (
        <>
          <p className="text-2xl text-red-600 font-bold mt-4">
            Keep practicing! You'll do better next time!
          </p>
          <button
            onClick={onTryAgain}
            className="mt-4 bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </>
      )}
    </div>
  </>
);

// --- MAIN PAGE COMPONENT ---

/**
 * QuizPage component that orchestrates quiz generation, interaction, and review.
 * It holds the primary state and logic, passing data and handlers to child components.
 */
export const QuizPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { allClasses, handleClassSelect, selectedClassId } = useUserClasses(
    user?.id || ""
  );

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previousQuizzes, setPreviousQuizzes] = useState<QuizResult[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [passed, setPassed] = useState(false);

  const quizId = quiz[0]?.userSectionId || "";
  const isAllAnswered =
    quiz.length > 0 &&
    quiz.every(
      (question) =>
        answers[question.id] !== null && answers[question.id] !== undefined
    );

  const resetQuizState = () => {
    setQuiz([]);
    setAnswers({});
    setSubmitting(false);
    setScore(0);
    setPassed(false);
    setSelectedQuizId(null);
  };

  const generateQuiz = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to generate a quiz.");
      return;
    }
    if (selectedClassId === "all") {
      toast.warning("Please select a specific class to generate a quiz.");
      return;
    }

    resetQuizState();
    setIsGenerating(true);
    try {
      const response = await fetch(`${BASE_ENDPOINT}/quiz/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_class_id: selectedClassId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 404 &&
          data.message?.includes("no sections that need review")
        ) {
          const selectedClass = allClasses.find(
            (cls) => cls.id === selectedClassId
          );
          toast.success(
            `You're doing great! No sections need review${selectedClass ? ` in ${selectedClass.classTitle}` : ""}.`
          );
        } else {
          throw new Error(data?.message || "Failed to generate quiz");
        }
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quizQuestions = data.data.quiz.map((q: any) => ({
        id: q.id,
        question: q.question,
        choices: q.choices,
        answerIndex: q.answer_index,
        explanation: q.explanation,
        userSectionId: q.user_section_id,
      }));

      setQuiz(quizQuestions);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId: string, selectedIndex: number) => {
    if (submitting) return; // Prevent changing answers after submission
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const handleQuizSubmit = async () => {
    setSubmitting(true);
    const calculatedScore = quiz.reduce(
      (total, q) => (answers[q.id] === q.answerIndex ? total + 1 : total),
      0
    );
    const passThreshold = 0.8;
    const hasPassed = calculatedScore / quiz.length >= passThreshold;

    setScore(calculatedScore);
    setPassed(hasPassed);

    // Database operations
    try {
      // 1. Update each question with the user's answer
      await Promise.all(
        quiz.map((q) =>
          supabase
            .from("user_section_questions")
            .update({ user_answer_index: answers[q.id] ?? null })
            .eq("id", q.id)
        )
      );

      // 2. Upsert the quiz result
      const { error: upsertError } = await supabase.from("quiz_results").upsert(
        {
          quiz_id: quizId,
          score: calculatedScore,
          submitted_at: new Date().toISOString(),
          user_id: user?.id,
          user_class_id:
            selectedClassId === "non-class" ? null : selectedClassId,
        },
        { onConflict: "quiz_id" }
      );

      if (upsertError) throw upsertError;

      // 3. Update progress if passed
      if (hasPassed && user?.id) {
        await updateUserProgress(user.id, quizId, selectedClassId);
      }
    } catch (error) {
      console.error("Error submitting quiz results:", error);
      toast.error("There was an error saving your results.");
    }
  };

  const fetchQuizData = async (quizIdToFetch: string) => {
    resetQuizState();
    setIsGenerating(true);
    try {
      const { data: questions, error } = await supabase
        .from("user_section_questions")
        .select("*")
        .eq("user_section_id", quizIdToFetch)
        .order("created_at");

      if (error) throw error;
      if (!questions || questions.length === 0) {
        toast.warning("Could not find questions for the selected quiz.");
        return;
      }

      const loadedQuiz = questions.map((q) => ({
        id: q.id,
        question: q.question,
        choices: q.choices,
        answerIndex: q.correct_answer_index,
        explanation: q.explanation,
        userSectionId: q.user_section_id,
      }));

      const loadedAnswers = questions.reduce(
        (acc, q) => {
          acc[q.id] = q.user_answer_index;
          return acc;
        },
        {} as Record<string, number | null>
      );

      const calculatedScore = loadedQuiz.reduce(
        (total, q) =>
          loadedAnswers[q.id] === q.answerIndex ? total + 1 : total,
        0
      );

      setQuiz(loadedQuiz);
      setAnswers(loadedAnswers);
      setScore(calculatedScore);
      setPassed(calculatedScore / loadedQuiz.length >= 0.8);
      setSubmitting(true); // A previously opened quiz is always in the "submitted" state
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Failed to load the selected quiz.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateUserProgress = async (
    userId: string,
    sectionId: string | null,
    classId: string | null
  ) => {
    try {
      // Mark the section as complete
      await supabase
        .from("user_sections")
        .update({ status: "COMPLETE" })
        .eq("section_id", sectionId);

      // Update class status if applicable
      if (classId !== "non-class") {
        await supabase
          .from("class_users")
          .update({ user_class_status: "ACTIVE" })
          .eq("student_id", userId)
          .eq("class_id", classId);
      }
      toast.success("Your progress has been updated!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress status.");
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchPreviousQuizzes = async () => {
      let query = supabase
        .from("quiz_results")
        .select("quiz_id, score, submitted_at")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (selectedClassId && selectedClassId !== "all") {
        query =
          selectedClassId === "non-class"
            ? query.is("user_class_id", null)
            : query.eq("user_class_id", selectedClassId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch previous quizzes: ", error);
        toast.error("Could not load past quizzes.");
      } else {
        setPreviousQuizzes((data as QuizResult[]) || []);
      }
    };

    fetchPreviousQuizzes();
  }, [user, selectedClassId]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center width-container gap-6">
      <Title>Review Quiz</Title>

      <QuizControls
        classes={allClasses}
        selectedClassId={selectedClassId}
        onClassSelect={(selection) => handleClassSelect(selection.id)}
        onGenerate={generateQuiz}
        isGenerating={isGenerating}
        previousQuizzes={previousQuizzes}
        onPreviousQuizSelect={(e) => setSelectedQuizId(e.target.value || null)}
        onOpenPreviousQuiz={() =>
          selectedQuizId && fetchQuizData(selectedQuizId)
        }
      />

      {quiz.length > 0 ? (
        <>
          <QuizDisplay
            quiz={quiz}
            answers={answers}
            submitting={submitting}
            onAnswerSelect={handleAnswerSelect}
          />
          <div className="mt-10 pt-6 text-center border-t border-gray-200 dark:border-gray-700">
            {submitting ? (
              <QuizResults
                score={score}
                totalQuestions={quiz.length}
                passed={passed}
                onTryAgain={generateQuiz} // Retrying generates a new quiz for the same class
                onBackToDashboard={() => navigate("/dashboard")}
              />
            ) : (
              isAllAnswered && (
                <Button onClick={handleQuizSubmit}>Submit Answers</Button>
              )
            )}
            {!submitting && !isAllAnswered && (
              <Paragraph>
                *You will be able to submit once all questions have been
                answered*
              </Paragraph>
            )}
          </div>
        </>
      ) : (
        <Card className="w-container p-6">
          <Paragraph>
            Generate a new quiz or select a previous one to begin.
          </Paragraph>
        </Card>
      )}
    </div>
  );
};

export default QuizPage;
