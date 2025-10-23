import { useAllClassesWithSearch } from "@/hooks/useAllClasses";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaginatedTable from "@/components/PaginatedTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { User } from "@/types/user";
import UserDataSearchFilters from "../../../dashboard/ui/components/UserDataSearchFilter";
import { formatActivityTimestamp } from "@/utils/timeConverter";
import { useNavigate } from "react-router-dom";

interface ClassData {
  id: string;
  classTitle: string;
  classCode: string;
  classHexColor?: string;
  classDescription?: string;
  classImageCover?: string;
  instructorId?: string;
  instructorName?: string;
  studentCount: number;
  students?: User[];
  createdAt: string;
}

const ClassesDataTable = () => {
  const [nameFilter, setNameFilter] = useState("");

  const { classes, isLoading, error } = useAllClassesWithSearch("", true);

  const navigate = useNavigate();

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const matchName =
        classItem.classTitle.toLowerCase().includes(nameFilter.toLowerCase()) ||
        classItem.classCode?.toLowerCase().includes(nameFilter.toLowerCase()) ||
        (classItem.instructorName &&
          classItem.instructorName
            .toLowerCase()
            .includes(nameFilter.toLowerCase())) ||
        (classItem.classDescription &&
          classItem.classDescription
            .toLowerCase()
            .includes(nameFilter.toLowerCase()));

      return matchName;
    });
  }, [classes, nameFilter]);

  const handleRowClick = (instructorId: string, classId: string) => {
    navigate(`${instructorId}/${classId}`);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500 text-center py-8">
          Error loading classes: {error}
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
          namePlaceholder="Filter by class name, code, or instructor"
          gridClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
        />
        {/* Loading skeleton for mobile cards */}
        <div className="block lg:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={`loading-card-${index}`} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-muted"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-8"></div>
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
                <TableHead className="w-[35%]">Class</TableHead>
                <TableHead className="w-[20%]">Code</TableHead>
                <TableHead className="w-[15%]">Students</TableHead>
                <TableHead className="w-[25%]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <ClassRow
                  key={`loading-${index}`}
                  classData={{
                    id: "",
                    classTitle: "",
                    classCode: "",
                    studentCount: 0,
                    createdAt: "",
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
          gridClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
        />
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        <PaginatedTable
          data={filteredClasses}
          renderTable={(currentItems, startIndex) => (
            <div className="space-y-3">
              {currentItems.map((classItem, index) => (
                <ClassCard
                  key={classItem.id}
                  classData={classItem as ClassData}
                  index={startIndex + index}
                  onClick={() =>
                    handleRowClick(
                      classItem.instructorId as string,
                      classItem.id as string
                    )
                  }
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <PaginatedTable
          data={filteredClasses}
          renderTable={(currentItems, startIndex) => (
            <div className="border rounded-md shadow-sm overflow-hidden">
              <Table className="table-fixed">
                <TableHeader className="bg-[#f5f5f5] dark:bg-[#262626]">
                  <TableRow className="bg-muted">
                    <TableHead className="w-[5%] text-center">No.</TableHead>
                    <TableHead className="">Class</TableHead>
                    <TableHead className="w-[10%]">Code</TableHead>
                    <TableHead className="w-[10%] text-center">
                      Students
                    </TableHead>
                    <TableHead className="w-[15%]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((classItem, index) => (
                    <ClassRow
                      key={`${classItem.id}-${index}`}
                      classData={classItem as ClassData}
                      index={startIndex + index}
                      onClick={() =>
                        handleRowClick(
                          classItem.instructorId as string,
                          classItem.id as string
                        )
                      }
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

export default ClassesDataTable;

interface ClassCardProps {
  classData: ClassData;
  index: number;
  onClick: () => void;
}

const ClassCard = ({ classData, index, onClick }: ClassCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:bg-muted hover:dark:bg-muted transition-shadow bg-white/40 dark:bg-black/40 pt-3 pb-0 text-xs md:text-sm"
      style={{
        borderLeft: `4px solid ${classData.classHexColor || "#50B498"}`,
      }}
      onClick={onClick}
    >
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">
                #{index + 1}
              </span>
              <div>
                <span className="font-medium">
                  {classData.classTitle || "Untitled Class"}
                </span>
                <div className="font-medium truncate text-muted-foreground">
                  {classData.classCode}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground hidden md:block">
              Created at {formatActivityTimestamp(classData.createdAt)}
            </div>
          </div>

          <div className="flex flex-col w-28 text-center -mr-3 space-y-1">
            <div className="text-lg md:text-2xl flex items-center justify-center font-semibold gap-1">
              {classData.studentCount} <Users className="size-5 md:size-7" />
            </div>
            <div className="text-xs text-muted-foreground">
              by {classData.instructorName || "Unknown Instructor"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Desktop Row Component
interface ClassRowProps {
  classData: ClassData;
  index: number;
  isLoading?: boolean;
  onClick: () => void;
}

const ClassRow = ({
  classData,
  index,
  isLoading = false,
  onClick,
}: ClassRowProps) => {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell>
          <div className="h-4 bg-muted rounded animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-lg animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded w-8 animate-pulse mx-auto"></div>
        </TableCell>
        <TableCell>
          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow
      onClick={onClick}
      className="cursor-pointer bg-white/40 dark:bg-black/40 hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors border-b border-muted"
    >
      <TableCell className="font-medium text-center">{index + 1}</TableCell>

      <TableCell>
        <div className="flex items-center gap-3 pr-4">
          <Avatar className="size-10">
            {classData.classImageCover ? (
              <img
                src={classData.classImageCover}
                alt={classData.classTitle}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <AvatarFallback
                className=" text-white text-lg font-semibold rounded-lg"
                style={{
                  backgroundColor: classData.classHexColor || "#50B498",
                }}
              >
                {classData.classTitle?.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="truncate">{classData.classTitle}</div>
            {classData.classDescription && (
              <div className="text-sm text-muted-foreground truncate">
                {classData.classDescription}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="font-mono text-sm">{classData.classCode}</div>
      </TableCell>

      <TableCell className="text-center">
        <div className="font-semibold">{classData.studentCount}</div>
      </TableCell>

      <TableCell>
        <div className="text-xs text-muted-foreground">
          {formatActivityTimestamp(classData.createdAt)}
        </div>
      </TableCell>
    </TableRow>
  );
};
