import { ClassActionDialog } from "@/pages/classes/ui/components/ClassActionDialog";
import TagBadge from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import UserInfoItem from "@/components/UserInfoItem";
import { ProgrammingTag } from "@/constants/tags";
import { useUser } from "@/context/UserContext";
import { useClassActionDialog } from "@/pages/classes/hooks/useClassActionDialog";
import { useClassData } from "@/pages/classes/hooks/useClassData";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Star, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ClassStudentStatusList from "../components/ClassStudentStatusList";

const ClassDetailsView = () => {
  const { classId } = useParams();
  const { userData } = useUser();
  const navigate = useNavigate();

  const {
    data: classData,
    isLoading,
    error,
    isError,
    refetch,
  } = useClassData(classId, {
    includeStudents: true,
    userId: userData?.id,
    includeAllStatuses: true,
  });

  const queryClient = useQueryClient();

  const classActionDialog = useClassActionDialog({
    onSuccess: () => {
      refetch();
      if (userData?.id) {
        queryClient.invalidateQueries({
          queryKey: ["userClasses", userData.id],
        });

        queryClient.invalidateQueries({
          queryKey: ["allClasses", { userId: userData.id }],
        });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">
            {typeof error === "string"
              ? error
              : error instanceof Error
                ? error.message
                : "Failed to load class data"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Class Not Found
          </h2>
          <p className="text-gray-600">
            The requested class could not be found.
          </p>
        </div>
      </div>
    );
  }

  const {
    classTitle,
    classCode,
    classDescription,
    classHexColor,
    classImageCover,
    instructorName,
    studentCount,
    enrollmentStatus,
    students = [],
  } = classData;

  const isUserEnrolled = enrollmentStatus === "ENROLLED";
  const isUserWaitlisted = enrollmentStatus === "WAITLISTED";
  const isUserRejected = enrollmentStatus === "REJECTED";

  const isInstructor = userData && classData.instructorId === userData.id;

  const handleSaveClick = () => {
    console.log("Saving class...");
  };

  const handlePreviewClick = () => {
    navigate("/dashboard", {
      state: {
        preselectedClassId: classId,
      },
    });
  };

  const handleManageClass = () => {
    navigate("/dashboard/instructor-stats", {
      state: {
        preselectedClassId: classId,
        classTitle: classData.classTitle,
        classCode: classData.classCode,
      },
    });
  };

  const handleEditClass = () => {
    if (classData.id) {
      navigate(`/classes/${classId}/edit`);
    }
  };

  const handleClassAction = (
    action: "join" | "leave" | "cancel" | "remove"
  ) => {
    if (!userData?.id || !classId) return;

    classActionDialog.openDialog({
      classId: classId,
      userId: userData.id,
      classTitle: classData.classTitle,
      action: action,
    });
  };

  return (
    <div className="min-h-screen bg-background/80 dark:bg-[#0a0a0a]">
      <ClassActionDialog
        isOpen={classActionDialog.isOpen}
        isLoading={classActionDialog.isLoading}
        classInfo={classActionDialog.classInfo}
        onClose={classActionDialog.closeDialog}
        onConfirm={classActionDialog.handleConfirm}
      />

      <div className="w-full">
        <div
          className="h-96 w-full relative overflow-hidden"
          style={{
            backgroundColor: classHexColor || "#6366f1",
            backgroundImage: classImageCover
              ? `url(${classImageCover})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {classCode}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {classTitle}
                </h1>
                <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-6 md:items-center text-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>
                      {studentCount}{" "}
                      {studentCount === 1 ? "Student" : "Students"}
                    </span>
                  </div>

                  {(() => {
                    const tags = Object.values(ProgrammingTag)
                      .sort(() => 0.5 - Math.random())
                      .slice(0, 5);
                    return (
                      <div className="flex items-center gap-2">
                        {tags.slice(0, 3).map((tag, idx) => (
                          <TagBadge key={idx} tag={tag} size="sm" />
                        ))}
                        {tags.length > 3 && (
                          <span className="text-white/70">
                            +{tags.length - 3}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content section - constrained width */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About This Class
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {classDescription ||
                  "This comprehensive course is designed to provide you with in-depth knowledge and practical skills. You'll learn through hands-on exercises, real-world examples, and expert guidance from experienced instructors."}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What You'll Learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Master fundamental concepts and principles",
                  "Apply knowledge through practical exercises",
                  "Develop critical thinking and problem-solving skills",
                  "Gain hands-on experience with real-world projects",
                  "Build confidence in your abilities",
                  "Connect with fellow learners and instructors",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Students List */}
            <ClassStudentStatusList
              users={students}
              classHexColor={classHexColor}
              isInstructor={isInstructor || false}
              classId={classId || ""}
              classTitle={classData.classTitle}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-8 md:gap-x-6">
                {/* Instructor info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm flex-1 col-span-2 md:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Instructor
                  </h3>
                  <UserInfoItem
                    firstName={instructorName || "Instructor Name"}
                    email="Main Instructor"
                    hexColor={classHexColor}
                    className="bg-transparent"
                    size="lg"
                  />
                </div>

                {/* Course stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Course Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {studentCount} enrolled students
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {classCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        4.8 average rating
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm col-span-2 lg:col-span-1">
                  <div className="space-y-3">
                    {!isInstructor && (
                      <>
                        {isUserEnrolled ? (
                          <>
                            <Button
                              onClick={handlePreviewClick}
                              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors hover:bg-primary/80"
                            >
                              Go to Course
                            </Button>
                            <Button
                              onClick={() => handleClassAction("leave")}
                              variant="outline"
                              className="w-full bg-red-50 hover:bg-red-500 text-red-600 font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                              Leave Class
                            </Button>
                          </>
                        ) : isUserWaitlisted ? (
                          <>
                            <Button
                              disabled
                              className="w-full bg-yellow-500/50 text-white font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
                            >
                              Pending
                            </Button>
                            <Button
                              onClick={() => handleClassAction("cancel")}
                              variant="outline"
                              className="w-full bg-sidebar dark:bg-gray-100 text-sidebar-foreground border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                              Cancel Application
                            </Button>
                          </>
                        ) : isUserRejected ? (
                          <>
                            <Button
                              onClick={() => handleClassAction("remove")}
                              className="w-full bg-red-500 hover:bg-red-500/80 text-white font-semibold py-3 px-4 rounded-lg"
                            >
                              Remove
                            </Button>
                            <Button
                              onClick={handleSaveClick}
                              variant="outline"
                              className="w-full bg-sidebar dark:bg-gray-100 text-sidebar-foreground border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                              Save for Later
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleClassAction("join")}
                              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                              Enroll Now
                            </Button>
                            <Button
                              onClick={handleSaveClick}
                              variant="outline"
                              className="w-full bg-sidebar dark:bg-gray-100 text-sidebar-foreground border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                              Save for Later
                            </Button>
                          </>
                        )}
                      </>
                    )}

                    {isInstructor && (
                      <>
                        <Button
                          onClick={handleManageClass}
                          className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors hover:bg-primary/80"
                        >
                          Go to Class
                        </Button>
                        <Button
                          onClick={handleEditClass}
                          variant="outline"
                          className="w-full bg-sidebar dark:bg-gray-100 text-sidebar-foreground border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                        >
                          Edit Class
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsView;
