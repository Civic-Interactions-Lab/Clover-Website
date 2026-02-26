import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/CustomSelect.tsx";
import { supabase } from "@/lib/supabaseClient.ts";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TableName =
  | "log_event"
  | "progsnap_event"
  | "progsnap_edit"
  | "progsnap_suggestion_line"
  | "survey_response"
  | "user_settings"
  | "users";

const TABLE_OPTIONS = [
  { value: "log_event" as TableName, label: "Log Event" },
  { value: "progsnap_event" as TableName, label: "Progsnap Event" },
  { value: "progsnap_edit" as TableName, label: "Progsnap Edit" },
  {
    value: "progsnap_suggestion_line" as TableName,
    label: "Progsnap Suggestion Line",
  },
  { value: "survey_response" as TableName, label: "Survey Response" },
  { value: "user_settings" as TableName, label: "User Settings" },
  { value: "users" as TableName, label: "Users" },
];

const PAGE_SIZE = 100;

const AdminManageDataView = () => {
  const [selectedTable, setSelectedTable] = useState<TableName>("log_event");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterCol, setFilterCol] = useState<string>("");
  const [filterValue, setFilterValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setRows([]);
      setSorting([]);
      setColumnFilters([]);
      setFilterCol("");
      setFilterValue("");
      setPageIndex(0);

      const { data, error } = await supabase.from(selectedTable).select("*");

      if (error) setError(error.message);
      else setRows(data ?? []);

      setLoading(false);
    };

    fetchData();
  }, [selectedTable]);

  const colKeys = useMemo(
    () => (rows.length > 0 ? Object.keys(rows[0]) : []),
    [rows],
  );

  const filterColOptions = useMemo(
    () => colKeys.map((col) => ({ value: col, label: col })),
    [colKeys],
  );

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (rows.length === 0) return [];
    return colKeys.map(
      (col): ColumnDef<Record<string, unknown>> => ({
        accessorKey: col,
        header: col,
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue();
          return val === null || val === undefined ? (
            <span className="text-muted-foreground italic">null</span>
          ) : (
            <span className="truncate block max-w-[200px]">{String(val)}</span>
          );
        },
      }),
    );
  }, [rows, colKeys]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex, pageSize: PAGE_SIZE },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next.slice(-1));
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPageIndex(0);
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize: PAGE_SIZE })
          : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sortedColId = sorting[0]?.id;

  const applyFilter = () => {
    if (!filterCol) return;
    setColumnFilters(
      filterValue ? [{ id: filterCol, value: filterValue }] : [],
    );
    setPageIndex(0);
  };

  const clearFilter = () => {
    setFilterCol("");
    setFilterValue("");
    setColumnFilters([]);
    setPageIndex(0);
  };

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = totalFiltered === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalFiltered);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Manage Data</h2>
        <CustomSelect<TableName>
          value={selectedTable}
          onValueChange={setSelectedTable}
          options={TABLE_OPTIONS}
          className="w-52"
        />
      </div>

      {colKeys.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <CustomSelect<string>
            value={filterCol}
            onValueChange={(val) => {
              setFilterCol(val);
              setFilterValue("");
              setColumnFilters([]);
              setPageIndex(0);
            }}
            options={filterColOptions}
            placeholder="Filter by column..."
            className="w-52"
          />
          <Input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            placeholder="Enter value..."
            disabled={!filterCol}
            className="w-52 text-sm h-9"
          />
          <Button size="sm" onClick={applyFilter} disabled={!filterCol}>
            Apply
          </Button>
          {columnFilters.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearFilter}>
              Clear
            </Button>
          )}
          {columnFilters.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">Error: {error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No data found.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    <TableHead className="w-10 text-xs uppercase tracking-wide text-muted-foreground select-none">
                      #
                    </TableHead>
                    {headerGroup.headers.map((header) => {
                      const isSorted = header.column.id === sortedColId;
                      const isDesc = sorting[0]?.desc;
                      return (
                        <TableHead
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "whitespace-nowrap text-xs uppercase tracking-wide cursor-pointer select-none",
                            isSorted && "bg-muted text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {isSorted ? (
                              isDesc ? (
                                <ArrowDown className="w-3 h-3 shrink-0" />
                              ) : (
                                <ArrowUp className="w-3 h-3 shrink-0" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 shrink-0 opacity-30" />
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row, i) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm text-muted-foreground tabular-nums w-10">
                      {pageIndex * PAGE_SIZE + i + 1}
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "text-sm",
                          cell.column.id === sortedColId && "bg-muted/40",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {from}–{to} of {totalFiltered} rows
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 text-foreground font-medium">
                Page {pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminManageDataView;
