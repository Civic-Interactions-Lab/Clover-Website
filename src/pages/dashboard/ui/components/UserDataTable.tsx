import { UserStatus, UserMode, UserRole } from "@/types/user";
import MiniPieChart from "@/components/MiniPieChart";
import PaginatedTable from "@/components/PaginatedTable";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserWithActivity,
  useAllUsersWithActivityAndSearch,
} from "@/pages/dashboard/hooks/useAllUsersActivity";
import { useMemo, useState } from "react";
import UserInfoTableCard from "./UserInfoTableCard";
import UserDataSearchFilters from "./UserDataSearchFilter";
import ModeBadge from "@/components/ModeBadge";
import RoleBadge from "@/components/RoleBadge";
import StatusBadge from "@/components/StatusBadge";
import UserAvatar from "@/components/UserAvatar";
import { formatActivityTimestamp, isOnline } from "@/utils/timeConverter";
import { useNavigate } from "react-router-dom";

const UsersDataTable = () => {
  const navigate = useNavigate();
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");

  const { users, isLoading, error } = useAllUsersWithActivityAndSearch();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchName =
        (user.firstName + " " + user.lastName)
          .toLowerCase()
          .includes(nameFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(nameFilter.toLowerCase());

      const matchRole = roleFilter === "all" || user.role === roleFilter;
      const matchStatus =
        statusFilter === "all" || user.status === statusFilter;
      const matchMode =
        modeFilter === "all" || user.activityMode === modeFilter;

      return matchName && matchRole && matchStatus && matchMode;
    });
  }, [users, nameFilter, roleFilter, statusFilter, modeFilter]);

  const handleRowClick = (userId: string) => {
    navigate(`/dashboard/users/${userId}`);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500 text-center py-8">
          Error loading users: {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <UserDataSearchFilters
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          modeFilter={modeFilter as UserMode}
          setModeFilter={setModeFilter}
        />
        {/* Loading skeleton for mobile cards */}
        <div className="block lg:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={`loading-card-${index}`} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Loading skeleton for desktop table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">No.</TableHead>
                <TableHead className="w-[25%]">User</TableHead>
                <TableHead className="w-[15%]">Mode</TableHead>
                <TableHead className="w-[15%]">Accuracy</TableHead>
                <TableHead className="w-[20%]">Last Active</TableHead>
                <TableHead className="w-[10%]">Role</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <UserActivityRow
                  key={`loading-${index}`}
                  user={{
                    id: "",
                    firstName: "",
                    lastName: "",
                    email: "",
                    role: UserRole.STUDENT,
                    status: UserStatus.ACTIVE,
                    createdAt: "",
                    settings: {
                      mode: UserMode.CODE_BLOCK,
                      showNotifications: true,
                      bugPercentage: 0,
                      enableQuiz: true,
                      enableDashboard: true,
                    },
                    totalAccepted: 0,
                    totalRejected: 0,
                    totalInteractions: 0,
                    correctAccepts: 0,
                    correctRejects: 0,
                    correctSuggestions: 0,
                    accuracyPercentage: 0,
                    lastActivity: null,
                    activityMode: null,
                  }}
                  index={index}
                  isLoading={true}
                  onClick={() => {}}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 my-4">
        <UserDataSearchFilters
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          modeFilter={modeFilter as UserMode}
          setModeFilter={setModeFilter}
        />
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        <PaginatedTable
          data={filteredUsers}
          renderTable={(currentItems, startIndex) => (
            <div className="space-y-3">
              {currentItems.map((user, index) => (
                <UserInfoTableCard
                  key={user.id}
                  onClick={() => handleRowClick(user.id)}
                  index={startIndex + index}
                  name={`${user.firstName} ${user.lastName}`}
                  email={user.email}
                  role={user.role}
                  status={user.status}
                  mode={user.settings?.mode as UserMode}
                  lastActivity={user.lastActivity}
                  totalAccepted={user.totalAccepted}
                  totalRejected={user.totalRejected}
                  totalInteractions={user.totalInteractions}
                  correctSuggestions={user.correctSuggestions}
                  accuracyPercentage={user.accuracyPercentage}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <PaginatedTable
          data={filteredUsers}
          renderTable={(currentItems, startIndex) => (
            <div className="border rounded-md shadow-sm overflow-hidden">
              <Table className="table-fixed">
                <TableHeader className="bg-[#f5f5f5] dark:bg-[#262626]">
                  <TableRow className="bg-muted">
                    <TableHead className="w-[5%] text-center">No.</TableHead>
                    <TableHead className="w-[25%]">User</TableHead>
                    <TableHead className="w-[15%]">Accuracy</TableHead>
                    <TableHead className="w-[20%]">Last Active</TableHead>
                    <TableHead className="w-[15%] text-center">Mode</TableHead>
                    <TableHead className="w-[10%] text-center">Role</TableHead>
                    <TableHead className="w-[10%] text-center">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((user, index) => (
                    <UserActivityRow
                      key={`${user.id}-${index}`}
                      user={user}
                      index={startIndex + index}
                      onClick={() => handleRowClick(user.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        />
      </div>
    </>
  );
};

// Desktop Row Component for Users with Activity
interface UserActivityRowProps {
  user: UserWithActivity;
  index: number;
  isLoading?: boolean;
  onClick: (user: UserWithActivity) => void;
}

const UserActivityRow = ({
  user,
  index,
  isLoading = false,
  onClick,
}: UserActivityRowProps) => {
  const isUserOnline = isOnline(user.lastActivity);
  const activityTimestamp = formatActivityTimestamp(user.lastActivity);

  const progressData = {
    totalAccepted: user.totalAccepted,
    totalRejected: user.totalRejected,
    totalInteractions: user.totalInteractions,
    correctSuggestions: user.correctSuggestions,
    accuracyPercentage: user.accuracyPercentage,
    correctAccepts: user.correctAccepts,
    correctRejects: user.correctRejects,
  };

  if (isLoading) {
    return (
      <TableRow>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
        </TableCell>
        <TableCell>
          <div className="h-12 w-12 bg-muted rounded-full animate-pulse mx-auto"></div>
        </TableCell>
        <TableCell>
          <div className="h-8 bg-muted rounded animate-pulse w-20"></div>
        </TableCell>
        <TableCell>
          <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
        </TableCell>
        <TableCell>
          <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      onClick={() => onClick(user)}
      className="cursor-pointer bg-white/40 dark:bg-black/40 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-b border-muted"
    >
      <TableCell className="font-medium text-center">{index + 1}</TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <UserAvatar
            firstName={user.firstName}
            avatarUrl={user.avatarUrl}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-center justify-center">
        {user.totalInteractions > 0 ? (
          <MiniPieChart progressData={progressData} size="sm" />
        ) : (
          <MiniPieChart size="sm" />
        )}
      </TableCell>

      <TableCell className="text-muted-foreground">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isUserOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span
            className={
              isUserOnline
                ? "text-green-600 font-medium"
                : "text-muted-foreground"
            }
          >
            {activityTimestamp}
          </span>
        </div>
      </TableCell>

      <TableCell className="text-center">
        <ModeBadge mode={user.settings?.mode as UserMode} />
      </TableCell>

      <TableCell className="text-center">
        <RoleBadge role={user.role} />
      </TableCell>

      <TableCell className="text-center">
        <StatusBadge status={user.status} />
      </TableCell>
    </TableRow>
  );
};

export default UsersDataTable;
