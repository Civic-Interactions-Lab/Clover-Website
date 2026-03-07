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
import { UserMode, UserRole, UserStatus } from "@/types/user";
import { useNavigate } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import ModeBadge from "@/components/ModeBadge";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import BugBadge from "@/components/BugBadge";
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

interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  status: UserStatus;
  pid: string | null;
  mode: UserMode | null;
  bug_percentage: number | null;
}

type FilterCol = "first_name" | "email" | "role" | "status" | "mode" | "pid";

const FILTER_OPTIONS: { value: FilterCol; label: string }[] = [
  { value: "first_name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "role", label: "Role" },
  { value: "status", label: "Status" },
  { value: "mode", label: "Mode" },
  { value: "pid", label: "PID" },
];

const AdminUserDataView = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterCol, setFilterCol] = useState<FilterCol | "">("");
  const [filterValue, setFilterValue] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from("users").select(`
          id,
          email,
          first_name,
          last_name,
          role,
          status,
          pid,
          user_settings ( mode, bug_percentage )
        `);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped: UserRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        status: row.status,
        pid: row.pid,
        mode: row.user_settings?.mode ?? null,
        bug_percentage: row.user_settings?.bug_percentage ?? null,
      }));

      setUsers(mapped);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "first_name",
        header: "User",
        filterFn: "includesString",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <UserAvatar firstName={u.first_name ?? ""} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {u.first_name} {u.last_name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {u.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        filterFn: "includesString",
        cell: () => null,
      },
      {
        accessorKey: "pid",
        header: "PID",
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
        accessorKey: "role",
        header: "Role",
        filterFn: "includesString",
        cell: ({ getValue }) => <RoleBadge role={getValue() as UserRole} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as UserStatus} />
        ),
      },
      {
        accessorKey: "mode",
        header: "Mode",
        filterFn: "includesString",
        cell: ({ getValue }) => <ModeBadge mode={getValue() as UserMode} />,
      },
      {
        accessorKey: "bug_percentage",
        header: "Bug %",
        filterFn: "includesString",
        cell: ({ getValue }) => (
          <BugBadge bugPercentage={(getValue() as number) ?? 0} />
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex, pageSize: PAGE_SIZE },
      columnVisibility: { email: false },
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
        <h2 className="text-lg font-semibold">Insights About Users</h2>
      </div>

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
      {!loading && users.length === 0 && (
        <p className="text-sm text-muted-foreground">No users found.</p>
      )}

      {!loading && users.length > 0 && (
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
                      navigate(`/dashboard/users/${row.original.id}`)
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
              {from}–{to} of {totalFiltered} users
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

export default AdminUserDataView;
