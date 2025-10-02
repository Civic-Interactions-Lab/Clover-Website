import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClassData, EnrollmentStatus } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Edit,
  FileChartColumn,
  FileSymlink,
  LogOut,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import EnrollmentBadge from "@/components/EnrollmentBadge";
import { useUser } from "@/context/UserContext";
import {
  actionType,
  ClassActionDialog,
} from "@/pages/classes/ui/components/ClassActionDialog";
import { useClassActionDialog } from "@/pages/classes/hooks/useClassActionDialog";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface ClassesTableProps {
  classes: ClassData[];
  showInstructor?: boolean;
  showStatus?: boolean;
  showActions?: boolean;
  onRefresh?: () => void;
}

const ClassesTable = ({
  classes,
  showInstructor = true,
  showStatus = false,
  showActions = false,
  onRefresh,
}: ClassesTableProps) => {
  const navigate = useNavigate();
  const { userData } = useUser();

  const queryClient = useQueryClient();

  const classActionDialog = useClassActionDialog({
    onSuccess: () => {
      onRefresh?.();

      if (userData?.id) {
        queryClient.invalidateQueries({
          queryKey: ["userClasses", userData.id],
        });

        queryClient.invalidateQueries({
          queryKey: ["allClasses", { userId: userData.id }],
        });

        queryClient.invalidateQueries({
          queryKey: ["instructorClasses", userData.id],
        });
      }
    },
  });

  if (classes.length === 0) {
    return null;
  }

  const handleRowClick = (classData: ClassData, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button, [role="button"]')) {
      return;
    }

    if (classData.id) {
      navigate(`/dashboard/user-register-classes/classes/${classData.id}`);
    }
  };

  const handleViewDetails = (classData: ClassData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (classData.id) {
      navigate(`/dashboard/user-register-classes/classes/${classData.id}`);
    }
  };

  const handleEditClass = (classData: ClassData, event: React.MouseEvent) => {
    event.stopPropagation();
    if (classData.id) {
      navigate(`/dashboard/user-register-classes/classes/${classData.id}/edit`);
    }
  };

  const handleGoToCourse = (classData: ClassData, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate("/dashboard", {
      state: {
        preselectedClassId: classData.id,
        classTitle: classData.classTitle,
        classCode: classData.classCode,
      },
    });
  };

  const handleClassAction = (
    classData: ClassData,
    action: actionType,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (!classData.id || !userData?.id) return;

    classActionDialog.openDialog({
      classId: classData.id,
      userId: userData.id,
      classTitle: classData.classTitle,
      action: action,
    });
  };

  const isInstructor = (classData: ClassData) => {
    return userData?.id === classData.instructorId;
  };

  const getActionButton = (classData: ClassData) => {
    if (isInstructor(classData)) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleViewDetails(classData, e)}>
              <FileSymlink className="mr-1 h-4 w-4" />
              View Class
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => handleEditClass(classData, e)}>
              <Edit className="mr-1 h-4 w-4" />
              Edit Class
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleClassAction(classData, "delete", e)}
              className="text-red-600 focus:text-red-600"
            >
              <X className="mr-1 h-4 w-4" />
              Delete Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const enrollmentStatus = classData.enrollmentStatus;

    if (!enrollmentStatus) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleViewDetails(classData, e)}>
              <FileSymlink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleClassAction(classData, "join", e)}
              className="text-primary focus:text-primary"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Join Class
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (enrollmentStatus) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleViewDetails(classData, e)}>
              <FileSymlink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {enrollmentStatus === "ENROLLED" && (
              <DropdownMenuItem onClick={(e) => handleGoToCourse(classData, e)}>
                <FileChartColumn className="mr-2 h-4 w-4" />
                Go to Course
              </DropdownMenuItem>
            )}

            {enrollmentStatus === "ENROLLED" && (
              <DropdownMenuItem
                onClick={(e) => handleClassAction(classData, "leave", e)}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave Class
              </DropdownMenuItem>
            )}

            {enrollmentStatus === "WAITLISTED" && (
              <DropdownMenuItem
                onClick={(e) => handleClassAction(classData, "cancel", e)}
                className="text-red-600 focus:text-red-600"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Application
              </DropdownMenuItem>
            )}

            {enrollmentStatus === "REJECTED" && (
              <DropdownMenuItem
                onClick={(e) => handleClassAction(classData, "remove", e)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from List
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return <span className="text-xs text-muted-foreground">-</span>;
  };

  const MobileCard = ({
    classData,
    index,
  }: {
    classData: ClassData;
    index: number;
  }) => {
    const studentCount = classData.studentCount || 0;
    const enrollmentStatus = classData.enrollmentStatus;

    return (
      <Card
        key={classData.id || index}
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 py-1"
        onClick={(e) => handleRowClick(classData, e)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-1 h-12 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: classData.classHexColor || "#e5e7eb",
                }}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                  {classData.classTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {classData.classCode}
                </p>
              </div>
            </div>
            {showActions && (
              <div className="flex-shrink-0 ml-2">
                {getActionButton(classData)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {showInstructor && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">By</span>
                  <span className="font-medium">
                    {classData.instructorName || "N/A"}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                {" • "}
                <Users className="h-3 w-3 text-muted-foreground ml-1" />
                <span className="font-medium">{studentCount}</span>
                {studentCount > 5 && (
                  <Badge variant="secondary" className="ml-1 px-1 text-xs">
                    🔥
                  </Badge>
                )}
              </div>
            </div>

            {showStatus && (
              <EnrollmentBadge status={enrollmentStatus as EnrollmentStatus} />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <ClassActionDialog
        isOpen={classActionDialog.isOpen}
        isLoading={classActionDialog.isLoading}
        classInfo={classActionDialog.classInfo}
        onClose={classActionDialog.closeDialog}
        onConfirm={classActionDialog.handleConfirm}
      />
      <div className="width-container mb-6">
        <div className="hidden md:block border rounded-md shadow-sm">
          <Table className="table-fixed">
            <TableHeader className="bg-sidebar dark:bg-[#262626]">
              <TableRow className="font-semibold">
                <TableHead className="w-[25%]">Title</TableHead>
                <TableHead className="w-[12%]">Code</TableHead>
                {showInstructor && (
                  <TableHead className="w-[20%]">Instructor</TableHead>
                )}
                <TableHead className="w-[10%] text-center">Students</TableHead>
                {showStatus && (
                  <TableHead className="w-[15%] text-center">Status</TableHead>
                )}
                {showActions && (
                  <TableHead className="w-[15%] text-center">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classData, index) => {
                const studentCount = classData.studentCount || 0;
                const enrollmentStatus = classData.enrollmentStatus;

                return (
                  <TableRow
                    key={classData.id || index}
                    className="hover:bg-muted cursor-pointer transition-colors duration-200"
                    onClick={(e) => handleRowClick(classData, e)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-8 rounded-md flex-shrink-0"
                          style={{
                            backgroundColor:
                              classData.classHexColor || "#e5e7eb",
                          }}
                        />
                        <div className="font-medium line-clamp-2">
                          {classData.classTitle}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{classData.classCode}</TableCell>

                    {showInstructor && (
                      <TableCell>{classData.instructorName || "N/A"}</TableCell>
                    )}

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <span className="font-medium">{studentCount}</span>
                        {studentCount > 5 && (
                          <Badge variant="secondary" className="ml-1 px-1">
                            🔥
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {showStatus && (
                      <TableCell className="text-center">
                        <EnrollmentBadge
                          status={enrollmentStatus as EnrollmentStatus}
                        />
                      </TableCell>
                    )}

                    {showActions && (
                      <TableCell className="text-center">
                        {getActionButton(classData)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden space-y-3">
          {classes.map((classData, index) => (
            <MobileCard
              key={classData.id || index}
              classData={classData}
              index={index}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default ClassesTable;
