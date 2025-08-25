import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, Hash } from "lucide-react";
import { useErrors } from "@/pages/dashboard/hooks/useErrors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/CustomSelect";
import { ErrorLog } from "@/types/error";

interface ErrorsTableProps {
  onErrorSelect: (errorId: string) => void;
  className?: string;
}

const ErrorsTable = ({ onErrorSelect, className }: ErrorsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortByFilter, setSortByFilter] = useState("createdAt");

  // Fetch table data with its own queryId
  const {
    errors,
    pagination,
    isLoading,
    error,
    setPage,
    setLimit,
    setLevel,
    setResolved,
    setSearch,
    setSortBy,
    resetFilters,
  } = useErrors({
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  const formatDate = (dateString: string, showFull: boolean = false) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      if (showFull) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    setLevel(value as any);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setResolved(value as any);
  };

  const handleSortChange = (value: string) => {
    setSortByFilter(value);
    setSortBy(value as any);
  };

  const handleResetFilters = () => {
    setLevelFilter("all");
    setStatusFilter("all");
    setSortByFilter("createdAt");
    setSearchTerm("");
    resetFilters();
  };

  const shouldResetFilter =
    searchTerm ||
    levelFilter !== "all" ||
    statusFilter !== "all" ||
    sortByFilter !== "createdAt";

  const handleSelectError = (errorId: string) => {
    const mainContent = document.querySelector("main.overflow-auto");
    mainContent?.scrollTo(0, 0);
    onErrorSelect(errorId);
  };

  const renderErrorsTable = (filteredData: ErrorLog[], startIndex: number) => (
    <div className="rounded-md shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-16 text-center text-xs">No.</TableHead>
              <TableHead className="w-24 text-center text-xs">Level</TableHead>
              <TableHead className="w-32 text-center text-xs">
                Category
              </TableHead>
              <TableHead className="w-64 text-xs">Message</TableHead>
              <TableHead className="w-48 text-center text-xs">
                Created
              </TableHead>
              <TableHead className="w-20 text-center text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((errorItem, index) => (
              <TableRow
                key={errorItem.id}
                className="cursor-pointer bg-white/40 dark:bg-black/40 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectError(errorItem.id)}
              >
                <TableCell className="text-center py-3 text-xs">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell className="text-center text-xs">
                  <Badge
                    variant={
                      errorItem.level === "CRITICAL"
                        ? "critical"
                        : errorItem.level === "ERROR"
                          ? "error"
                          : errorItem.level === "WARNING"
                            ? "warning"
                            : "default"
                    }
                    className="w-20 justify-center text-xs"
                  >
                    {errorItem.level}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-xs">
                  <Badge variant="outline" className="text-xs">
                    {errorItem.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs w-64">
                  <p className="truncate" title={errorItem.message}>
                    {errorItem.message}
                  </p>
                  {errorItem.errorCode && (
                    <p className="text-xs mt-1 flex items-center gap-1 opacity-70">
                      <Hash className="w-3 h-3" />
                      {errorItem.errorCode}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center text-xs">
                  {formatDate(errorItem.createdAt)}
                </TableCell>
                <TableCell className="text-center text-xs">
                  <Badge
                    variant={errorItem.resolved ? "default" : "destructive"}
                    className="w-20 justify-center text-xs"
                  >
                    {errorItem.resolved ? "Resolved" : "Open"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(filteredData.length === 0 || error) && (
        <div className="px-6 py-12 text-center text-muted-foreground">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg">No errors found matching your criteria</p>
        </div>
      )}
    </div>
  );

  // Custom pagination component for errors
  const ErrorPagination = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Show:</label>
          <CustomSelect
            value={pagination?.limit?.toString() || "10"}
            onValueChange={(value) => handleLimitChange(Number(value))}
            options={[
              { value: "10", label: "10 per page" },
              { value: "20", label: "20 per page" },
              { value: "50", label: "50 per page" },
            ]}
            placeholder="Items per page"
            className="w-32"
          />
        </div>

        <div className="text-xs md:text-sm flex flex-col md:flex-row items-end text-muted-foreground md:space-x-2">
          <span>
            Page {pagination?.page || 1} of {pagination?.totalPages || 1}
          </span>
          <span>
            ({pagination?.totalCount || 0} total{" "}
            {pagination?.totalCount === 1 ? "result" : "results"})
          </span>
        </div>
      </div>

      <div className="w-full">
        {renderErrorsTable(
          errors,
          ((pagination?.page || 1) - 1) * (pagination?.limit || 10)
        )}
      </div>

      <div className="flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((pagination?.page || 1) - 1)}
          disabled={(pagination?.page || 1) === 1}
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from(
            { length: Math.min(5, pagination?.totalPages || 1) },
            (_, i) => {
              const totalPages = pagination?.totalPages || 1;
              const currentPage = pagination?.page || 1;
              let pageNum;

              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            }
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((pagination?.page || 1) + 1)}
          disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <Card className={`shadow-xl py-3 bg-sidebar ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <CardTitle>Errors</CardTitle>
          <CardDescription className="text-muted-foreground">
            Click on any error to view detailed information
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          disabled={!shouldResetFilter}
          className="bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Reset
        </Button>
      </CardHeader>

      {/* Embedded Filters */}
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearch(e.target.value);
                  }}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Level
              </label>
              <CustomSelect
                value={levelFilter}
                onValueChange={handleLevelChange}
                options={[
                  { value: "all", label: "All" },
                  { value: "CRITICAL", label: "Critical" },
                  { value: "ERROR", label: "Error" },
                  { value: "WARNING", label: "Warning" },
                  { value: "INFO", label: "Info" },
                ]}
                placeholder="All"
                className="h-9"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Status
              </label>
              <CustomSelect
                value={statusFilter}
                onValueChange={handleStatusChange}
                options={[
                  { value: "all", label: "All" },
                  { value: "false", label: "Open" },
                  { value: "true", label: "Resolved" },
                ]}
                placeholder="All statuses"
                className="h-9"
              />
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Sort by
              </label>
              <CustomSelect
                value={sortByFilter}
                onValueChange={handleSortChange}
                options={[
                  { value: "createdAt", label: "Created date" },
                  { value: "level", label: "Level" },
                  { value: "category", label: "Category" },
                  { value: "resolved", label: "Status" },
                ]}
                placeholder="Created date"
                className="h-9"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardContent className="px-6 pt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
          </div>
        ) : (
          <ErrorPagination />
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorsTable;
