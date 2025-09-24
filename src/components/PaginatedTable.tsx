import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import CustomSelect from "./CustomSelect";

interface PaginatedTableProps<T> {
  data: T[];
  renderTable: (filteredData: T[], startIndex: number) => React.ReactNode;
  filterFn?: (item: T) => boolean;
  defaultItemsPerPage?: number;
  serverPagination?: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    totalItems: number;
    isLoading?: boolean;
  };
}

/**
 * A generic paginated table component that supports both client-side and server-side pagination.
 * @param {PaginatedTableProps} props - The properties for the paginated table.
 * @param props.data - The data to be displayed in the table.
 * @param props.renderTable - A function that takes the filtered data and returns the table JSX.
 * @param props.filterFn - An optional filter function to filter the data before displaying it (client-side only).
 * @param props.defaultItemsPerPage - The default number of items to display per page.
 * @param props.serverPagination - Configuration for server-side pagination.
 * @returns {JSX.component} A paginated table component.
 */
export const PaginatedTable = <T,>({
  data,
  renderTable,
  filterFn,
  defaultItemsPerPage = 10,
  serverPagination,
}: PaginatedTableProps<T>) => {
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);

  // Use server pagination if provided, otherwise fall back to client-side
  const isServerPagination = !!serverPagination;

  // Client-side pagination logic
  const filteredData = useMemo(
    () => (filterFn && !isServerPagination ? data.filter(filterFn) : data),
    [data, filterFn, isServerPagination]
  );

  const clientTotalPages = Math.max(
    1,
    Math.ceil(filteredData.length / itemsPerPage)
  );
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const currentItems = isServerPagination
    ? data
    : filteredData.slice(start, end);

  // Get pagination values from server or client
  const totalPages = isServerPagination
    ? serverPagination.totalPages
    : clientTotalPages;
  const actualCurrentPage = isServerPagination
    ? serverPagination.currentPage
    : currentPage;
  const hasNextPage = isServerPagination
    ? serverPagination.hasNextPage
    : currentPage < clientTotalPages;
  const hasPreviousPage = isServerPagination
    ? serverPagination.hasPreviousPage
    : currentPage > 1;
  const totalItems = isServerPagination
    ? serverPagination.totalItems
    : filteredData.length;

  const handlePageChange = (newPage: number) => {
    if (isServerPagination) {
      serverPagination.onPageChange(newPage);
    } else {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);

    if (isServerPagination) {
      serverPagination.onItemsPerPageChange(newItemsPerPage);
    } else {
      setCurrentPage(1);
    }
  };

  // Reset to page 1 when items per page changes (client-side only)
  useEffect(() => {
    if (!isServerPagination) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, isServerPagination]);

  // Calculate start index for renderTable
  const startIndex = isServerPagination
    ? (serverPagination.currentPage - 1) * itemsPerPage
    : start;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Show:</label>
          <CustomSelect
            value={itemsPerPage.toString()}
            onValueChange={(value) => handleItemsPerPageChange(Number(value))}
            options={[
              { value: "10", label: "10 per page" },
              { value: "20", label: "20 per page" },
              { value: "50", label: "50 per page" },
              { value: "100", label: "100 per page" },
              { value: "200", label: "200 per page" },
              { value: "500", label: "500 per page" },
            ]}
            placeholder="Items per page"
            className="w-32"
            disabled={isServerPagination && serverPagination.isLoading}
          />
        </div>

        <div className="text-xs md:text-sm flex flex-col md:flex-row items-end text-muted-foreground md:space-x-2">
          <span>
            Page {actualCurrentPage} of {totalPages}
          </span>
          <span>
            ({totalItems} total {totalItems === 1 ? "result" : "results"})
          </span>
        </div>
      </div>

      <div className="w-full">{renderTable(currentItems, startIndex)}</div>

      <div className="flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(actualCurrentPage - 1)}
          disabled={
            !hasPreviousPage ||
            (isServerPagination && serverPagination.isLoading)
          }
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (actualCurrentPage <= 3) {
              pageNum = i + 1;
            } else if (actualCurrentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = actualCurrentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={actualCurrentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
                disabled={isServerPagination && serverPagination.isLoading}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(actualCurrentPage + 1)}
          disabled={
            !hasNextPage || (isServerPagination && serverPagination.isLoading)
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PaginatedTable;
