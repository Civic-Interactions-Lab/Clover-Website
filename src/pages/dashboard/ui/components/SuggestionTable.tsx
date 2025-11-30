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
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/CustomSelect";

enum EventFilter {
  ALL = "All",
  ACCEPT = "Accept",
  REJECT = "Reject",
}

enum BugFilter {
  ALL = "All",
  HAS_BUG = "Has Bug",
  NO_BUG = "No Bug",
}

enum CorrectnessFilter {
  ALL = "All",
  CORRECT = "Correct",
  INCORRECT = "Incorrect",
}

interface SuggestionTableProps {
  logItems: UserActivityLogItem[];
  mode?: UserMode;
  defaultItemsPerPage?: number;
  onRowClick?: (
    logItem: UserActivityLogItem,
    index: number,
    allLogItems: UserActivityLogItem[],
  ) => void;
}

export const SuggestionTable = ({
  logItems,
  mode = UserMode.LINE_BY_LINE,
  defaultItemsPerPage = 10,
  onRowClick,
}: SuggestionTableProps) => {
  const [eventFilter, setEventFilter] = useState<EventFilter>(EventFilter.ALL);
  const [bugFilter, setBugFilter] = useState<BugFilter>(BugFilter.ALL);
  const [correctnessFilter, setCorrectnessFilter] = useState<CorrectnessFilter>(
    CorrectnessFilter.ALL,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const isAcceptEvent = useCallback((event: string) => {
    return ACCEPT_EVENTS.includes(event);
  }, []);

  const getDecisionCorrectness = (logItem: UserActivityLogItem) => {
    const isAccept = isAcceptEvent(logItem.event);
    const hasBug = logItem.hasBug || logItem.hasBug;
    const isCorrect = (isAccept && !hasBug) || (!isAccept && hasBug);
    return isCorrect ? "Correct" : "Incorrect";
  };

  // Filter data based on all filters
  const filteredLogItems = useMemo(() => {
    return logItems.filter((logItem) => {
      const isAccept = isAcceptEvent(logItem.event);
      const isReject = REJECT_EVENTS.includes(logItem.event);
      const hasBug = logItem.hasBug || logItem.hasBug;
      const correctness = getDecisionCorrectness(logItem);

      // Event filter
      let passesEventFilter = false;
      switch (eventFilter) {
        case EventFilter.ACCEPT:
          passesEventFilter = isAccept;
          break;
        case EventFilter.REJECT:
          passesEventFilter = isReject;
          break;
        case EventFilter.ALL:
          passesEventFilter = isAccept || isReject;
          break;
      }

      // Bug filter
      let passesBugFilter = false;
      switch (bugFilter) {
        case BugFilter.HAS_BUG:
          passesBugFilter = hasBug || false;
          break;
        case BugFilter.NO_BUG:
          passesBugFilter = !hasBug;
          break;
        case BugFilter.ALL:
          passesBugFilter = true;
          break;
      }

      // Correctness filter
      let passesCorrectnessFilter = false;
      switch (correctnessFilter) {
        case CorrectnessFilter.CORRECT:
          passesCorrectnessFilter = correctness === "Correct";
          break;
        case CorrectnessFilter.INCORRECT:
          passesCorrectnessFilter = correctness === "Incorrect";
          break;
        case CorrectnessFilter.ALL:
          passesCorrectnessFilter = true;
          break;
      }

      return passesEventFilter && passesBugFilter && passesCorrectnessFilter;
    });
  }, [logItems, eventFilter, bugFilter, correctnessFilter, isAcceptEvent]);

  // Calculate pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogItems.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredLogItems.slice(startIndex, endIndex);

  // Reset to page 1 when filter or items per page changes
  useMemo(() => {
    setCurrentPage(1);
  }, [eventFilter, bugFilter, correctnessFilter, itemsPerPage]);

  const handleRowClick = (logItem: UserActivityLogItem, index: number) => {
    if (onRowClick) {
      onRowClick(logItem, startIndex + index, filteredLogItems);
    }
  };

  const getFilterStats = () => {
    const total = filteredLogItems.length;
    const correct = filteredLogItems.filter(
      (item) => getDecisionCorrectness(item) === "Correct",
    ).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, accuracy };
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages: number[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const stats = getFilterStats();

  const eventFilterOptions = [
    { value: EventFilter.ALL, label: "All" },
    { value: EventFilter.ACCEPT, label: "Accept" },
    { value: EventFilter.REJECT, label: "Reject" },
  ];

  const bugFilterOptions = [
    { value: BugFilter.ALL, label: "All" },
    { value: BugFilter.HAS_BUG, label: "Has Bug" },
    { value: BugFilter.NO_BUG, label: "No Bug" },
  ];

  const correctnessFilterOptions = [
    { value: CorrectnessFilter.ALL, label: "All" },
    { value: CorrectnessFilter.CORRECT, label: "Correct" },
    { value: CorrectnessFilter.INCORRECT, label: "Incorrect" },
  ];

  const itemsPerPageOptions = [
    { value: "10", label: "10 per page" },
    { value: "20", label: "20 per page" },
    { value: "50", label: "50 per page" },
    { value: "100", label: "100 per page" },
    { value: "200", label: "200 per page" },
    { value: "500", label: "500 per page" },
  ];

  return (
    <div className="space-y-4">
      {/* Header with filters and stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h3 className="font-semibold text-sm">Suggestions</h3>
          <div className="flex flex-wrap items-center gap-2">
            <CustomSelect
              value={eventFilter}
              onValueChange={setEventFilter}
              options={eventFilterOptions}
              className="w-24"
            />
            <CustomSelect
              value={bugFilter}
              onValueChange={setBugFilter}
              options={bugFilterOptions}
              className="w-28"
            />
            <CustomSelect
              value={correctnessFilter}
              onValueChange={setCorrectnessFilter}
              options={correctnessFilterOptions}
              className="w-28"
            />
          </div>
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

      {/* Pagination controls - Top */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-semibold">Show</label>
          <CustomSelect
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
            options={itemsPerPageOptions}
            className="w-32"
          />
        </div>

        <div className="text-xs md:text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {totalPages} ({filteredLogItems.length} total{" "}
            {filteredLogItems.length === 1 ? "result" : "results"})
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md shadow-sm overflow-auto">
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
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No suggestions found matching the selected filters
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((logItem, index) => {
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
                        logItem.createdAt || logItem.createdAt,
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

      {/* Pagination controls - Bottom */}
      {filteredLogItems.length > 0 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default SuggestionTable;
