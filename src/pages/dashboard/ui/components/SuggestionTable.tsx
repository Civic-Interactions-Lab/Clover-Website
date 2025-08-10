import {
  CodeBlockSuggestion,
  CodeSelectionSuggestion,
  LineByLineSuggestion,
  SuggestionData,
  UserActivityLogItem,
} from "@/types/suggestion";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { UserMode } from "@/types/user";
import { ACCEPT_EVENTS } from "@/types/event";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSuggestionByModeAndId } from "@/api/suggestion";
import Loading from "@/components/Loading";
import ModalContainer from "@/components/ModalContainer";

interface SuggestionTableProps {
  logItems: UserActivityLogItem[];
  startIndex?: number;
  mode: UserMode;
}

/**
 * SuggestionTable component displays a table of user activity log items and allows the user to view details of a selected suggestion.
 * It fetches suggestion details from the server when a log item is clicked.
 * @param param0 - props for the SuggestionTable component
 * @param param0.logItems - array of log items to display in the table
 * @param param0.range - range of log items to display (default is [0, 10])
 * @returns
 */
export const SuggestionTable = ({
  logItems,
  startIndex = 0,
  mode,
}: SuggestionTableProps) => {
  const [selectedLogItem, setSelectedLogItem] =
    useState<UserActivityLogItem | null>(null);
  const [suggestionDetail, setSuggestionDetail] =
    useState<SuggestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isAcceptEvent = useCallback((event: string) => {
    return ACCEPT_EVENTS.includes(event);
  }, []);

  const getDecisionCorrectness = (logItem: UserActivityLogItem) => {
    const isAccept = isAcceptEvent(logItem.event);
    const hasBug = logItem.hasBug || logItem.hasBug;

    const isCorrect = (isAccept && !hasBug) || (!isAccept && hasBug);
    return isCorrect ? "Correct" : "Incorrect";
  };

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (!selectedLogItem?.id) return;

      setLoading(true);
      setFetchError(null);

      try {
        const result = await getSuggestionByModeAndId(selectedLogItem, mode);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLogItem]);

  return (
    <>
      <div className="border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-16 text-center">No.</TableHead>
              <TableHead className="w-32 text-center">Date</TableHead>
              <TableHead className="w-32 text-center">Decision</TableHead>
              <TableHead className="w-32 text-center">Has Bug</TableHead>
              <TableHead className="w-32 text-center">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logItems.map((logItem, index) => {
              const isAccept = isAcceptEvent(logItem.event);
              const hasBug = logItem.hasBug || logItem.hasBug;
              const correctness = getDecisionCorrectness(logItem);

              return (
                <TableRow
                  key={logItem.id}
                  className="cursor-pointer bg-white/40 dark:bg-black/40 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-b border-muted text-center"
                  onClick={() => setSelectedLogItem(logItem)}
                >
                  <TableCell className="py-3">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      logItem.createdAt || logItem.createdAt
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isAccept ? "default" : "destructive"}
                      className="w-20 justify-center"
                    >
                      {isAccept ? "Accepted" : "Rejected"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={hasBug ? "destructive" : "default"}
                      className="w-10 justify-center"
                    >
                      {hasBug ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        correctness === "Correct" ? "default" : "destructive"
                      }
                      className="w-20 justify-center"
                    >
                      {correctness}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedLogItem && (
        <ModalContainer
          isOpen={!!selectedLogItem}
          onClose={() => setSelectedLogItem(null)}
        >
          <Card className="p-6 max-w-3xl lg:max-w-5xl w-full max-h-[90vh] relative bg-white dark:bg-black border border-gray-200 dark:border-gray-900 overflow-y-auto">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedLogItem(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <h3 className="text-xl font-bold text-primary mb-4">
              Code Suggestion Details
            </h3>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loading />
              </div>
            ) : fetchError ? (
              <div className="text-destructive p-4 bg-destructive/10 rounded-md">
                {fetchError}
              </div>
            ) : suggestionDetail ? (
              <SuggestionDetailCard
                log={selectedLogItem}
                suggestion={suggestionDetail}
                mode={mode}
                isCorrect={
                  getDecisionCorrectness(selectedLogItem) === "Correct"
                }
              />
            ) : (
              <p className="text-muted-foreground">
                No suggestion details available
              </p>
            )}
          </Card>
        </ModalContainer>
      )}
    </>
  );
};

export default SuggestionTable;

/**
 * SuggestionDetailCard component displays the details of a code suggestion.
 * It shows the suggested code, status, bug detection, model, response time, and prompt.
 * @param param0 - props for the SuggestionDetailCard component
 * @param param0.suggestion - suggestion object containing details of the suggestion
 */
export const SuggestionDetailCard = ({
  log,
  suggestion,
  mode,
  isCorrect = true,
}: {
  log: UserActivityLogItem;
  suggestion: SuggestionData;
  mode: UserMode;
  isCorrect?: boolean;
}) => {
  const isAccepted =
    log.event.includes("ACCEPT") || log.event.includes("accept");

  const renderSuggestionContent = () => {
    try {
      switch (mode) {
        case "CODE_BLOCK": {
          const codeBlockSuggestion = suggestion as CodeBlockSuggestion;

          // Add defensive check for suggestionArray
          if (
            !codeBlockSuggestion.suggestionArray ||
            !Array.isArray(codeBlockSuggestion.suggestionArray)
          ) {
            return (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="text-destructive p-4 bg-destructive/10 rounded-md">
                  Error: No suggestion array found in the data
                </div>
              </div>
            );
          }

          return (
            <div className="flex-1 flex flex-col min-h-0">
              {!isCorrect && isAccepted ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                      Correct Suggestion
                    </h4>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                      Incorrect Suggestion
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                    <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                      {codeBlockSuggestion.suggestionArray[0] ||
                        "No code provided"}
                    </pre>
                    <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                      {codeBlockSuggestion.suggestionArray[1] ||
                        "No code provided"}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Suggested Code
                  </h4>
                  <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                    {codeBlockSuggestion.suggestionArray[0] ||
                      "No code provided"}
                  </pre>
                </>
              )}
            </div>
          );
        }

        case "LINE_BY_LINE": {
          const lineSuggestion = suggestion as LineByLineSuggestion;
          return (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                  Original Line
                </h4>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                  Fixed Line
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                  {lineSuggestion.correctLine || "No original line provided"}
                </pre>
                <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                  {lineSuggestion.incorrectLine || "No fixed line provided"}
                </pre>
              </div>
            </div>
          );
        }

        case "CODE_SELECTION": {
          const selectionSuggestion = suggestion as CodeSelectionSuggestion;
          return (
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selection Suggestion
              </h4>
              <pre className="bg-sidebar p-4 rounded-md overflow-x-auto text-sm overflow-auto max-h-36">
                {selectionSuggestion.suggestionText ||
                  "No suggestion text provided"}
              </pre>
            </div>
          );
        }

        default:
          return (
            <div className="text-muted-foreground">Unknown suggestion type</div>
          );
      }
    } catch (error) {
      console.error("Error rendering suggestion content:", error);
      console.log("Suggestion data:", suggestion);
      return (
        <div className="text-destructive p-4 bg-destructive/10 rounded-md">
          Error rendering suggestion content. Check console for details.
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {renderSuggestionContent()}

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Status
          </h4>
          <p className={isAccepted ? "text-primary" : "text-beta"}>
            {isAccepted ? "Accepted" : "Rejected"}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Bug Detected
          </h4>
          <p className={suggestion.hasBug ? "text-beta" : "text-primary"}>
            {suggestion.hasBug ? "Yes" : "No"}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Vendor
          </h4>
          <p className="text-cyan-500">{suggestion.vendor}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Model
          </h4>
          <p className="text-cyan-500">{suggestion.model || "N/A"}</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Response Time
          </h4>
          <p
            className={`${
              suggestion.duration < 3000
                ? "text-primary"
                : suggestion.duration < 10000
                  ? "text-beta"
                  : "text-red-500"
            }`}
          >
            {suggestion.duration} ms
          </p>
        </div>

        {suggestion.language && (
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              Language
            </h4>
            <p className="text-cyan-500">{suggestion.language}</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Prompt
        </h4>
        <div className="bg-sidebar p-4 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-36">
          {suggestion.prompt || "Unknown prompt"}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Refined Prompt
        </h4>
        <div className="bg-sidebar p-4 rounded-md text-sm whitespace-pre-wrap overflow-auto max-h-36">
          {suggestion.refinedPrompt || "Refined prompt not generated yet"}
        </div>
      </div>
      {suggestion.explanations && (
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Explanation
          </h4>
          <div className="bg-sidebar p-4 rounded-md text-sm overflow-auto max-h-62">
            <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300 leading-relaxed marker:text-primary">
              {(
                suggestion.explanations ?? "Explanations not generated yet"
              ).map((item, index) => (
                <li key={index} className="pl-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
