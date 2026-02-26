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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatActivityTimestamp } from "@/utils/timeConverter";
import { useNavigate } from "react-router-dom";
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
import { supabase } from "@/lib/supabaseClient.ts";

const PAGE_SIZE = 100;

interface ClassRow {
  id: string;
  class_title: string;
  class_code: string;
  class_hex_color: string | null;
  class_image_cover: string | null;
  class_description: string | null;
  instructor_id: string;
  instructor_name: string;
  student_count: number;
}

type FilterCol =
  | "class_title"
  | "class_code"
  | "instructor_name"
  | "student_count";

const FILTER_OPTIONS: { value: FilterCol; label: string }[] = [
  { value: "class_title", label: "Class Name" },
  { value: "class_code", label: "Code" },
  { value: "instructor_name", label: "Instructor" },
];

const AdminClassDataView = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterCol, setFilterCol] = useState<FilterCol | "">("");
  const [filterValue, setFilterValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from("classes").select(`
          id,
          class_title,
          class_code,
          class_hex_color,
          class_image_cover,
          class_description,
          instructor_id,
          users!classes_instructor_id_fkey ( first_name, last_name ),
          user_class ( count )
        `);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped: ClassRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        class_title: row.class_title ?? "",
        class_code: row.class_code ?? "",
        class_hex_color: row.class_hex_color,
        class_image_cover: row.class_image_cover,
        class_description: row.class_description,
        instructor_id: row.instructor_id,
        instructor_name: row.users
          ? `${row.users.first_name ?? ""} ${row.users.last_name ?? ""}`.trim()
          : "Unknown",
        student_count: row.user_class?.[0]?.count ?? 0,
      }));

      setClasses(mapped);
      setLoading(false);
    };

    fetchClasses();
  }, []);

  const columns = useMemo<ColumnDef<ClassRow>[]>(
    () => [
      {
        accessorKey: "class_title",
        header: "Class",
        filterFn: "includesString",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {c.class_image_cover ? (
                  <img
                    src={c.class_image_cover}
                    alt={c.class_title}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <AvatarFallback
                    className="text-white text-lg font-semibold rounded-lg"
                    style={{ backgroundColor: c.class_hex_color || "#50B498" }}
                  >
                    {c.class_title?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {c.class_title || "Untitled Class"}
                </div>
                {c.class_description && (
                  <div className="text-sm text-muted-foreground truncate">
                    {c.class_description}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "class_code",
        header: "Code",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "instructor_name",
        header: "Instructor",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "student_count",
        header: "Students",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <span className="font-semibold">{String(getValue())}</span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: classes,
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

  if (error) {
    return <p className="text-sm text-destructive">Error: {error}</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Insights About Classes</h2>
      </div>

      {/* Filter bar */}
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

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {!loading && classes.length === 0 && (
        <p className="text-sm text-muted-foreground">No classes found.</p>
      )}

      {!loading && classes.length > 0 && (
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
                  <TableRow
                    key={row.id}
                    onClick={() =>
                      navigate(
                        `${row.original.instructor_id}/${row.original.id}`,
                      )
                    }
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
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
              {from}–{to} of {totalFiltered} classes
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

export default AdminClassDataView;
