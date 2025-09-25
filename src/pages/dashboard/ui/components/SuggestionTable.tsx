import { UserActivityLogItem } from "@/types/suggestion";
import { useCallback, useState, useMemo } from "react";
import { UserMode } from "@/types/user";
import { ACCEPT_EVENTS, REJECT_EVENTS } from "@/types/event";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import CustomSelect from "@/components/CustomSelect";

enum EventFilter {
  TOTAL = "Total",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

interface SuggestionTableProps {
  logItems: UserActivityLogItem[];
  startIndex?: number;
  mode: UserMode;
}

/**
 * SuggestionTable component displays a table of user activity log items and navigates to detailed view when clicked.
 * @param param0 - props for the SuggestionTable component
 * @param param0.logItems - array of log items to display in the table
 * @param param0.startIndex - starting index for numbering (default is 0)
 * @param param0.mode - user mode for suggestion context
 * @returns
 */
export const SuggestionTable = ({
  logItems,
  startIndex = 0,
  mode,
}: SuggestionTableProps) => {
  const navigate = useNavigate();
  const [eventFilter, setEventFilter] = useState<EventFilter>(
    EventFilter.TOTAL
  );

  const isAcceptEvent = useCallback((event: string) => {
    return ACCEPT_EVENTS.includes(event);
  }, []);

  const getDecisionCorrectness = (logItem: UserActivityLogItem) => {
    const isAccept = isAcceptEvent(logItem.event);
    const hasBug = logItem.hasBug || logItem.hasBug;

    const isCorrect = (isAccept && !hasBug) || (!isAccept && hasBug);
    return isCorrect ? "Correct" : "Incorrect";
  };

  const filteredLogItems = useMemo(() => {
    return logItems.filter((logItem) => {
      const isAccept = isAcceptEvent(logItem.event);
      const isReject = REJECT_EVENTS.includes(logItem.event);

      switch (eventFilter) {
        case EventFilter.ACCEPT:
          return isAccept;
        case EventFilter.REJECT:
          return isReject;
        case EventFilter.TOTAL:
          return isAccept || isReject;
        default:
          return false;
      }
    });
  }, [logItems, eventFilter, isAcceptEvent]);

  const handleRowClick = (logItem: UserActivityLogItem, index: number) => {
    navigate("/suggestion-details", {
      state: {
        logItem,
        logItems: filteredLogItems, // Use filtered items for navigation context
        currentIndex: index,
        mode,
        correctness: getDecisionCorrectness(logItem),
      },
    });
  };

  const getFilterStats = () => {
    const total = filteredLogItems.length;
    const correct = filteredLogItems.filter(
      (item) => getDecisionCorrectness(item) === "Correct"
    ).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, accuracy };
  };

  const stats = getFilterStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Suggestions</h3>
          <CustomSelect
            value={eventFilter}
            onValueChange={(value) => setEventFilter(value as EventFilter)}
            options={[
              { value: EventFilter.TOTAL, label: "Total" },
              { value: EventFilter.ACCEPT, label: "Accept" },
              { value: EventFilter.REJECT, label: "Reject" },
            ]}
            className="w-24"
          />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Total: <strong>{stats.total}</strong>
          </span>
          <span>
            Correct: <strong>{stats.correct}</strong>
          </span>
          <span>
            Accuracy: <strong>{stats.accuracy}%</strong>
          </span>
        </div>
      </div>

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
            {filteredLogItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No {eventFilter.toLowerCase()} suggestions found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogItems.map((logItem, index) => {
                const isAccept = isAcceptEvent(logItem.event);
                const hasBug = logItem.hasBug || logItem.hasBug;
                const correctness = getDecisionCorrectness(logItem);

                return (
                  <TableRow
                    key={logItem.id}
                    className="cursor-pointer bg-white/40 dark:bg-black/40 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-b border-muted text-center"
                    onClick={() => handleRowClick(logItem, index)}
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
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SuggestionTable;
