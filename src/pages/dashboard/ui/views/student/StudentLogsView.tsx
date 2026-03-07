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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomSelect from "@/components/CustomSelect.tsx";
import { useUser } from "@/context/UserContext";
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
  Activity,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogRow {
  id: string;
  event: string | null;
  client_timestamp: number;
  server_timestamp: number;
  snapshot: string | null;
  line_suggestion_id: string | null;
  run_id: number | null;
}

interface ProgsnapRow {
  id: string;
  event_type: string;
  client_timestamp: number | null;
  server_timestamp: number | null;
  code_snippet: string | null;
  file_name: string | null;
  language: string | null;
  context_id: string | null;
}

type LogFilterCol = "event" | "snapshot" | "run_id" | "line_suggestion_id";
type ProgsnapFilterCol =
  | "event_type"
  | "file_name"
  | "language"
  | "code_snippet";

const LOG_FILTER_OPTIONS: { value: LogFilterCol; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "snapshot", label: "Snapshot" },
  { value: "run_id", label: "Run ID" },
  { value: "line_suggestion_id", label: "Suggestion ID" },
];

const PROGSNAP_FILTER_OPTIONS: { value: ProgsnapFilterCol; label: string }[] = [
  { value: "event_type", label: "Event Type" },
  { value: "file_name", label: "File Name" },
  { value: "language", label: "Language" },
  { value: "code_snippet", label: "Code Snippet" },
];

// ─── Reusable Table Renderer ──────────────────────────────────────────────────

function DataTable<T>({
  data,
  columns,
  loading,
  emptyText,
  label,
}: {
  data: T[];
  columns: ColumnDef<T>[];
  loading: boolean;
  emptyText: string;
  label: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const table = useReactTable({
    data,
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
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const from = totalFiltered === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const to = Math.min((pageIndex + 1) * PAGE_SIZE, totalFiltered);

  if (loading)
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (data.length === 0)
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
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
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={cn(
                        "whitespace-nowrap text-xs uppercase tracking-wide select-none",
                        canSort && "cursor-pointer",
                        isSorted && "bg-muted text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort &&
                          (isSorted ? (
                            isDesc ? (
                              <ArrowDown className="w-3 h-3 shrink-0" />
                            ) : (
                              <ArrowUp className="w-3 h-3 shrink-0" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 shrink-0 opacity-30" />
                          ))}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row, i) => (
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 transition-colors"
              >
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {from}–{to} of {totalFiltered} {label}
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
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar<T extends string>({
  filterCol,
  filterValue,
  options,
  onColChange,
  onValueChange,
  onApply,
  onClear,
  hasFilter,
  resultCount,
}: {
  filterCol: T | "";
  filterValue: string;
  options: { value: T; label: string }[];
  onColChange: (val: T) => void;
  onValueChange: (val: string) => void;
  onApply: () => void;
  onClear: () => void;
  hasFilter: boolean;
  resultCount: number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <CustomSelect<T>
        value={filterCol as T}
        onValueChange={onColChange}
        options={options}
        placeholder="Filter by column..."
        className="w-52"
      />
      <Input
        value={filterValue}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onApply()}
        placeholder="Enter value..."
        disabled={!filterCol}
        className="w-52 text-sm h-9"
      />
      <Button size="sm" onClick={onApply} disabled={!filterCol}>
        Apply
      </Button>
      {hasFilter && (
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      )}
      {hasFilter && (
        <span className="text-xs text-muted-foreground">
          {resultCount} result{resultCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentLogsView = () => {
  const { userData } = useUser();

  // log_event state
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logFilterCol, setLogFilterCol] = useState<LogFilterCol | "">("");
  const [logFilterValue, setLogFilterValue] = useState("");
  const [logColumnFilters, setLogColumnFilters] = useState<ColumnFiltersState>(
    [],
  );

  // progsnap state
  const [progsnap, setProgsnap] = useState<ProgsnapRow[]>([]);
  const [progsnapLoading, setProgsnapLoading] = useState(true);
  const [psFilterCol, setPsFilterCol] = useState<ProgsnapFilterCol | "">("");
  const [psFilterValue, setPsFilterValue] = useState("");
  const [psColumnFilters, setPsColumnFilters] = useState<ColumnFiltersState>(
    [],
  );

  const [activeTab, setActiveTab] = useState("events");

  // ── Fetch log_event ──
  const fetchLogs = async () => {
    if (!userData?.id) return;
    const { data, error } = await supabase
      .from("log_event")
      .select(
        "id, event, client_timestamp, server_timestamp, snapshot, line_suggestion_id, run_id",
      )
      .eq("user_id", userData.id)
      .order("client_timestamp", { ascending: false });
    if (error) {
      console.error(error);
      setLogsLoading(false);
      return;
    }
    setLogs((data ?? []) as LogRow[]);
    setLogsLoading(false);
  };

  // ── Fetch progsnap_event ──
  const fetchProgsnap = async () => {
    if (!userData?.id) return;
    const { data, error } = await supabase
      .from("progsnap_event")
      .select(
        "id, event_type, client_timestamp, server_timestamp, code_snippet, file_name, language, context_id",
      )
      .eq("user_id", userData.id)
      .order("server_timestamp", { ascending: false });
    if (error) {
      console.error(error);
      setProgsnapLoading(false);
      return;
    }
    setProgsnap((data ?? []) as ProgsnapRow[]);
    setProgsnapLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    fetchProgsnap();
  }, [userData?.id]);

  // ── Realtime: both tables on one channel ──
  useEffect(() => {
    if (!userData?.id) return;

    const channel = supabase
      .channel(`student-logs-realtime-${userData.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "log_event",
          filter: `user_id=eq.${userData.id}`,
        },
        () => fetchLogs(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "progsnap_event",
          filter: `user_id=eq.${userData.id}`,
        },
        () => fetchProgsnap(),
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED")
          console.log("[Realtime] Student logs connected");
        else if (err) console.error("[Realtime] Error:", err.message);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.id]);

  // ── log_event columns ──
  const logColumns = useMemo<ColumnDef<LogRow>[]>(
    () => [
      {
        accessorKey: "event",
        header: "Event",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{String(getValue() ?? "—")}</span>
        ),
      },
      {
        accessorKey: "client_timestamp",
        header: "Client Time",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(Number(getValue())).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "server_timestamp",
        header: "Server Time",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(Number(getValue())).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "run_id",
        header: "Run ID",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as number | null;
          return val != null ? (
            <span className="font-mono text-sm">{val}</span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "line_suggestion_id",
        header: "Suggestion ID",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="font-mono text-xs truncate block max-w-[160px]">
              {val}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "snapshot",
        header: "Snapshot",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="truncate block max-w-[200px] text-sm text-muted-foreground">
              {val}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
    ],
    [],
  );

  // ── progsnap_event columns ──
  const progsnapColumns = useMemo<ColumnDef<ProgsnapRow>[]>(
    () => [
      {
        accessorKey: "event_type",
        header: "Event Type",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "client_timestamp",
        header: "Client Time",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as number | null;
          return val ? (
            <span className="text-xs text-muted-foreground">
              {new Date(val).toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "server_timestamp",
        header: "Server Time",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as number | null;
          return val ? (
            <span className="text-xs text-muted-foreground">
              {new Date(val).toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "file_name",
        header: "File",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="font-mono text-sm">{val}</span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "language",
        header: "Language",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="text-sm">{val}</span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "code_snippet",
        header: "Code Snippet",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="truncate block max-w-[200px] font-mono text-xs text-muted-foreground">
              {val}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
      {
        accessorKey: "context_id",
        header: "Context ID",
        filterFn: "includesString",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          return val ? (
            <span className="font-mono text-xs truncate block max-w-[160px]">
              {val}
            </span>
          ) : (
            <span className="text-muted-foreground italic text-sm">—</span>
          );
        },
      },
    ],
    [],
  );

  // ── Filter helpers for log_event ──
  const applyLogFilter = () => {
    if (!logFilterCol) return;
    setLogColumnFilters(
      logFilterValue ? [{ id: logFilterCol, value: logFilterValue }] : [],
    );
  };
  const clearLogFilter = () => {
    setLogFilterCol("");
    setLogFilterValue("");
    setLogColumnFilters([]);
  };

  // ── Filter helpers for progsnap ──
  const applyPsFilter = () => {
    if (!psFilterCol) return;
    setPsColumnFilters(
      psFilterValue ? [{ id: psFilterCol, value: psFilterValue }] : [],
    );
  };
  const clearPsFilter = () => {
    setPsFilterCol("");
    setPsFilterValue("");
    setPsColumnFilters([]);
  };

  // We need a filtered row count for the filter bars — build minimal tables here just for counts
  const logTableForCount = useReactTable({
    data: logs,
    columns: logColumns,
    state: { columnFilters: logColumnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const psTableForCount = useReactTable({
    data: progsnap,
    columns: progsnapColumns,
    state: { columnFilters: psColumnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-6 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-lg font-semibold">User Insights Table</h2>
          <TabsList className="max-w-[300px]">
            <TabsTrigger
              value="events"
              className="flex items-center gap-2 w-full"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden lg:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger
              value="progsnap"
              className="flex items-center gap-2 w-full"
            >
              <FileCode className="w-4 h-4" />
              <span className="hidden lg:inline">Progsnap</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Filter bar — per tab */}
        {activeTab === "events" && (
          <FilterBar<LogFilterCol>
            filterCol={logFilterCol}
            filterValue={logFilterValue}
            options={LOG_FILTER_OPTIONS}
            onColChange={(val) => {
              setLogFilterCol(val);
              setLogFilterValue("");
              setLogColumnFilters([]);
            }}
            onValueChange={setLogFilterValue}
            onApply={applyLogFilter}
            onClear={clearLogFilter}
            hasFilter={logColumnFilters.length > 0}
            resultCount={logTableForCount.getFilteredRowModel().rows.length}
          />
        )}
        {activeTab === "progsnap" && (
          <FilterBar<ProgsnapFilterCol>
            filterCol={psFilterCol}
            filterValue={psFilterValue}
            options={PROGSNAP_FILTER_OPTIONS}
            onColChange={(val) => {
              setPsFilterCol(val);
              setPsFilterValue("");
              setPsColumnFilters([]);
            }}
            onValueChange={setPsFilterValue}
            onApply={applyPsFilter}
            onClear={clearPsFilter}
            hasFilter={psColumnFilters.length > 0}
            resultCount={psTableForCount.getFilteredRowModel().rows.length}
          />
        )}

        <TabsContent value="events" className="mt-6 space-y-4">
          <DataTable<LogRow>
            data={logs}
            columns={logColumns}
            loading={logsLoading}
            emptyText="No events found."
            label="events"
          />
        </TabsContent>

        <TabsContent value="progsnap" className="mt-0 space-y-4">
          <DataTable<ProgsnapRow>
            data={progsnap}
            columns={progsnapColumns}
            loading={progsnapLoading}
            emptyText="No progsnap events found."
            label="events"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentLogsView;
