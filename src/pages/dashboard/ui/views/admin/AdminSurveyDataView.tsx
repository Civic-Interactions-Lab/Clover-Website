import { supabase } from "@/lib/supabaseClient.ts";
import { useState, useEffect, useMemo } from "react";
import SurveyResult from "../../components/SurveyResult";
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
import { useNavigate } from "react-router-dom";
import { BarChart3, Table2, Eye, FileText, AlertTriangle } from "lucide-react";
import CustomSelect from "@/components/CustomSelect.tsx";
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

const PAGE_SIZE = 100;

type SurveyResponse = {
  id: string;
  created_at: string;
  answers: { questionId: string; value: string }[];
  survey: {
    title: string | null;
    description: string | null;
    id?: string;
  } | null;
  user: {
    id: string;
    first_name: string | null;
    pid?: string | null;
  } | null;
};

type Survey = {
  id: string;
  title: string | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  questions?: any[];
};

interface SurveyResultData {
  id: string;
  survey_id: string;
  user_id: string;
  submitted_at: string;
  answers: { questionId: string; value: string }[];
}

interface ResponseRow {
  id: string;
  survey_id: string | undefined;
  survey_title: string;
  survey_description: string;
  user_name: string;
  pid: string;
  created_at: string;
  user_id: string;
  raw: SurveyResponse;
}

type FilterCol = "survey_title" | "user_name" | "pid";

const FILTER_OPTIONS: { value: FilterCol; label: string }[] = [
  { value: "survey_title", label: "Survey Title" },
  { value: "user_name", label: "User" },
  { value: "pid", label: "PID" },
];

const AdminSurveyDataView = () => {
  const navigate = useNavigate();
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("table");
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [resultResponses, setResultResponses] = useState<SurveyResultData[]>(
    [],
  );
  const [loadingResults, setLoadingResults] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterCol, setFilterCol] = useState<FilterCol | "">("");
  const [filterValue, setFilterValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const loadSurveys = async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title, description, is_active, created_at");
      if (!error) setSurveys(data ?? []);
    };
    loadSurveys();
  }, []);

  useEffect(() => {
    const loadResponses = async () => {
      let query = supabase.from("survey_responses").select(`
        id, created_at, answers,
        survey:survey_id ( id, title, description ),
        user:user_id ( id, first_name, pid )
      `);
      if (selectedSurveyId !== "all")
        query = query.eq("survey_id", selectedSurveyId);
      const { data, error } = await query;
      if (error) return;
      setSurveyResponses(
        (data ?? []).map((r: any) => ({
          ...r,
          survey: Array.isArray(r.survey) ? r.survey[0] : r.survey,
          user: Array.isArray(r.user) ? r.user[0] : r.user,
        })),
      );
      setPageIndex(0);
    };
    loadResponses();
  }, [selectedSurveyId]);

  const loadSurveyForResults = async (surveyId: string) => {
    setLoadingResults(true);
    try {
      // questions are embedded in the surveys row
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .single();
      if (surveyError) throw surveyError;

      const { data: responsesData, error: responsesError } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", surveyId)
        .order("created_at", { ascending: false });
      if (responsesError) throw responsesError;

      setSelectedSurvey(surveyData);
      setResultResponses(responsesData ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "results" && selectedSurveyId !== "all" && !selectedSurvey) {
      loadSurveyForResults(selectedSurveyId);
    }
  };

  const handleSurveySelection = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setSelectedSurvey(null);
    if (surveyId !== "all" && activeTab === "results") {
      loadSurveyForResults(surveyId);
    }
  };

  const rows = useMemo<ResponseRow[]>(
    () =>
      surveyResponses.map((r) => ({
        id: r.id,
        survey_id: r.survey?.id,
        survey_title: r.survey?.title ?? "",
        survey_description: r.survey?.description ?? "",
        user_name: r.user?.first_name ?? "",
        pid: r.user?.pid ?? "",
        created_at: r.created_at,
        user_id: r.user?.id ?? "",
        raw: r,
      })),
    [surveyResponses],
  );

  const columns = useMemo<ColumnDef<ResponseRow>[]>(
    () => [
      {
        accessorKey: "survey_title",
        header: "Survey Title",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-medium">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "survey_description",
        header: "Description",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="truncate block max-w-[200px] text-sm text-muted-foreground">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "user_name",
        header: "User",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="text-sm">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "pid",
        header: "PID",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{String(getValue()) || "—"}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(getValue() as string).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(
                `/dashboard/admin-surveys/completed?surveyId=${row.original.survey_id}&userId=${row.original.user_id}`,
              );
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

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

  const surveyOptions = [
    { value: "all", label: "All Surveys" },
    ...surveys.map((s) => ({ value: s.id, label: s.title ?? "Untitled" })),
  ];

  const renderResultsTab = () => {
    if (selectedSurveyId === "all") {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Select a survey to view analytics</p>
        </div>
      );
    }
    if (loadingResults) {
      return (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <div className="w-6 h-6 animate-spin border-2 border-primary border-t-transparent rounded-full mr-3" />
          Loading results...
        </div>
      );
    }
    if (!selectedSurvey) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Could not load survey</p>
        </div>
      );
    }
    if (resultResponses.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No responses yet</p>
        </div>
      );
    }
    return (
      <SurveyResult
        survey={selectedSurvey as any}
        responses={resultResponses}
        className="max-w-none"
      />
    );
  };

  return (
    <div className="p-6 space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-lg font-semibold">Insights About Surveys</h2>
          <div className="flex items-center justify-between w-full gap-6">
            <TabsList className="min-w-[300px]">
              <TabsTrigger
                value="table"
                className="flex items-center gap-2 w-full"
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden lg:inline">Responses</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex items-center gap-2 w-full"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden lg:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
            <CustomSelect
              value={selectedSurveyId}
              onValueChange={handleSurveySelection}
              options={surveyOptions}
              placeholder="All Surveys"
              className="w-52"
            />
          </div>
        </div>

        {activeTab === "table" && (
          <div className="flex items-center gap-2 flex-wrap">
            <CustomSelect<FilterCol>
              value={filterCol as FilterCol}
              onValueChange={(val) => {
                setFilterCol(val);
                setFilterValue("");
                setColumnFilters([]);
                setPageIndex(0);
              }}
              options={FILTER_OPTIONS}
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

        <TabsContent value="table" className="mt-6 space-y-4">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No responses found.</p>
          ) : (
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
                  {from}–{to} of {totalFiltered} responses
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
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          {renderResultsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSurveyDataView;
