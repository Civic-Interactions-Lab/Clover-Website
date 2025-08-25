import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Code,
  FileText,
  Zap,
  Clock,
  Bug,
} from "lucide-react";
import { getSuggestionByModeAndId } from "@/api/suggestion";
import Loading from "@/components/Loading";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  UserActivityLogItem,
  SuggestionData,
  CodeBlockSuggestion,
  LineByLineSuggestion,
  CodeSelectionSuggestion,
} from "@/types/suggestion";
import { UserMode } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import CodeDiffViewer from "@/components/CodeDiffViewer";

const SuggestionDetailsView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from navigation state
  const logItem = location.state?.logItem as UserActivityLogItem;
  const mode = location.state?.mode as UserMode;
  const correctness = location.state?.correctness as string;

  const [suggestionDetail, setSuggestionDetail] =
    useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    originalPrompt: false,
    refinedPrompt: false,
    explanation: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Redirect if no data is passed
  useEffect(() => {
    if (!logItem || !mode) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const fetchSuggestion = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const result = await getSuggestionByModeAndId(logItem, mode);

        if (result.error) {
          setFetchError(result.error);
          setSuggestionDetail(null);
        }

        if (result.data) {
          setSuggestionDetail(result.data);
        }
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : "Failed to fetch suggestion"
        );
        setSuggestionDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestion();
  }, [logItem, mode, navigate]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (!logItem || !mode) {
    return null; // Will redirect via useEffect
  }

  const isAccepted =
    logItem.event.includes("ACCEPT") || logItem.event.includes("accept");
  const isCorrect = correctness === "Correct";

  const renderSuggestionContent = () => {
    if (!suggestionDetail) return null;

    try {
      switch (mode) {
        case "CODE_BLOCK": {
          const codeBlockSuggestion = suggestionDetail as CodeBlockSuggestion;

          if (
            !codeBlockSuggestion.suggestionArray ||
            !Array.isArray(codeBlockSuggestion.suggestionArray)
          ) {
            return (
              <div className="text-red-500 p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p>No suggestion array found in the data</p>
              </div>
            );
          }

          return (
            <div className="space-y-8">
              {!isCorrect &&
              isAccepted &&
              codeBlockSuggestion.suggestionArray.length >= 2 ? (
                <CodeDiffViewer
                  oldCode={
                    codeBlockSuggestion.suggestionArray[1] || "No code provided"
                  }
                  newCode={
                    codeBlockSuggestion.suggestionArray[0] || "No code provided"
                  }
                  oldTitle="Incorrect Suggestion"
                  newTitle="Correct Suggestion"
                  language={suggestionDetail.language || "javascript"}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Code className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Suggested Code</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
                    <pre className="p-6 text-sm font-mono overflow-auto">
                      <code className="text-blue-800 dark:text-blue-200">
                        {codeBlockSuggestion.suggestionArray[0] ||
                          "No code provided"}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        }

        case "LINE_BY_LINE": {
          const lineSuggestion = suggestionDetail as LineByLineSuggestion;
          return (
            <CodeDiffViewer
              oldCode={
                lineSuggestion.correctLine || "No original line provided"
              }
              newCode={lineSuggestion.incorrectLine || "No fixed line provided"}
              oldTitle="Original Line"
              newTitle="Fixed Line"
              language={suggestionDetail.language || "javascript"}
            />
          );
        }

        case "CODE_SELECTION": {
          const selectionSuggestion =
            suggestionDetail as CodeSelectionSuggestion;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Code className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Selection Suggestion</h3>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
                <pre className="p-6 text-sm font-mono overflow-auto">
                  <code className="text-purple-800 dark:text-purple-200">
                    {selectionSuggestion.suggestionText ||
                      "No suggestion text provided"}
                  </code>
                </pre>
              </div>
            </div>
          );
        }

        default:
          return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-12">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Unknown suggestion type</p>
            </div>
          );
      }
    } catch (error) {
      console.error("Error rendering suggestion content:", error);
      return (
        <div className="text-red-500 p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p>Error rendering suggestion content. Check console for details.</p>
        </div>
      );
    }
  };

  const ExpandableSection = ({
    title,
    content,
    sectionKey,
    icon: Icon,
  }: {
    title: string;
    content: string;
    sectionKey: keyof typeof expandedSections;
    icon: any;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="space-y-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-left">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          )}
        </button>

        {isExpanded && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              {sectionKey === "explanation" ? (
                <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300 leading-relaxed marker:text-blue-500">
                  {((content as any) || ["Explanations not generated yet"]).map(
                    (item: string, index: number) => (
                      <li key={index} className="pl-2">
                        {item}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-auto">
                  {content}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen py-24 px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Code Suggestion Details
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={isAccepted ? "default" : "destructive"}
                className="px-3 py-1 text-sm font-medium rounded-2xl"
              >
                {isAccepted ? "Accepted" : "Rejected"}
              </Badge>
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="px-3 py-1 text-sm font-medium rounded-2xl"
              >
                {correctness}
              </Badge>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loading size="lg" text="Loading suggestion details..." />
            </div>
          ) : fetchError ? (
            <div className="text-red-500 p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 text-center">
              <Bug className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Error Loading Suggestion
              </h3>
              <p>{fetchError}</p>
            </div>
          ) : suggestionDetail ? (
            <div className="space-y-12">
              {/* Main Suggestion Content */}
              <section>{renderSuggestionContent()}</section>

              {/* Metadata Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Date Created</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {new Date(
                      logItem.createdAt || logItem.createdAt
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Bug className="w-4 h-4" />
                    <span className="text-sm font-medium">Bug Detected</span>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      suggestionDetail.hasBug
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {suggestionDetail.hasBug ? "Yes" : "No"}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">Vendor</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {suggestionDetail.vendor}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Code className="w-4 h-4" />
                    <span className="text-sm font-medium">Model</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {suggestionDetail.model || "N/A"}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Response Time</span>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      suggestionDetail.duration < 3000
                        ? "text-green-600 dark:text-green-400"
                        : suggestionDetail.duration < 10000
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {suggestionDetail.duration} ms
                  </p>
                </div>

                {suggestionDetail.language && (
                  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Language</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {suggestionDetail.language}
                    </p>
                  </div>
                )}
              </section>

              {/* Expandable Sections */}
              <section className="space-y-6">
                <ExpandableSection
                  title="Original Prompt"
                  content={suggestionDetail.prompt || "Unknown prompt"}
                  sectionKey="originalPrompt"
                  icon={FileText}
                />

                <ExpandableSection
                  title="Refined Prompt"
                  content={
                    suggestionDetail.refinedPrompt ||
                    "Refined prompt not generated yet"
                  }
                  sectionKey="refinedPrompt"
                  icon={Zap}
                />

                {suggestionDetail.explanations && (
                  <ExpandableSection
                    title="Explanation"
                    content={suggestionDetail.explanations as any}
                    sectionKey="explanation"
                    icon={Bug}
                  />
                )}
              </section>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-12">
              <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No suggestion details available</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuggestionDetailsView;
