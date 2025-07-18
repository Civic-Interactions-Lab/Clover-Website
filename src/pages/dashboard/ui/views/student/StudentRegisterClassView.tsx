import RegisterClassDialog from "@/pages/classes/ui/components/RegisterClassDialog";
import { useUser } from "@/context/UserContext";
import { useAllClasses } from "@/hooks/useAllClasses";
import ClassesTable from "../../components/ClassesTable";
import { BookOpen, Calendar, Flame } from "lucide-react";
import Loading from "@/components/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StudentRegisterClassViewProps {
  description?: string;
}

const StudentRegisterClassView = ({
  description,
}: StudentRegisterClassViewProps) => {
  const { userData } = useUser();

  const {
    classes,
    isLoading,
    refetch: onRefresh,
  } = useAllClasses({
    userId: userData?.id,
  });

  if (isLoading) {
    return <Loading size="lg" />;
  }

  const availableClasses =
    classes?.filter(
      (cls) => !cls.enrollmentStatus && cls.instructorId !== userData?.id
    ) || [];

  const newClasses = availableClasses.filter((cls) => {
    const classDate = new Date(cls.createdAt!);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return classDate >= sevenDaysAgo;
  });

  const hotClasses = classes.filter((cls) => cls.studentCount! > 0);

  const renderNewClasses = () => {
    if (newClasses.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md shadow-sm">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No new classes
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No classes have been created in the past 7 days. Check back later
            for new opportunities!
          </p>
        </div>
      );
    }

    return (
      <ClassesTable
        classes={newClasses}
        showActions={true}
        onRefresh={onRefresh}
      />
    );
  };

  const renderHotClasses = () => {
    if (hotClasses.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md shadow-sm">
          <Flame className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No trending classes
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No classes are currently trending. Be the first to join and make
            them hot!
          </p>
        </div>
      );
    }

    return (
      <ClassesTable
        classes={hotClasses}
        showActions={true}
        onRefresh={onRefresh}
      />
    );
  };

  const renderAvailableClasses = () => {
    if (availableClasses.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md shadow-sm">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            No available classes
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You're enrolled in all available classes or there are no classes to
            register for.
          </p>
        </div>
      );
    }

    return (
      <ClassesTable
        classes={availableClasses}
        showActions={true}
        onRefresh={onRefresh}
      />
    );
  };

  const renderEmptyState = () => {
    if (
      availableClasses.length > 0 ||
      newClasses.length > 0 ||
      hotClasses.length > 0
    ) {
      return null;
    }

    return (
      <div className="text-center py-16">
        <div className="space-y-4">
          <div className="text-6xl">🎓</div>
          <h2 className="text-2xl font-bold">All caught up!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You're enrolled in all available classes. Check back later for new
            classes or ask your instructor to create more.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-end md:justify-between items-center gap-6 mb-6">
        <p className="text-sm text-muted-foreground hidden md:block">
          {description}
        </p>
        <RegisterClassDialog />
      </div>

      {renderEmptyState() || (
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-sidebar">
            <TabsTrigger
              value="new"
              className="flex items-center gap-2 text-green-600 dark:text-green-400"
            >
              <Calendar className="h-4 w-4" />
              New ({newClasses.length})
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex items-center gap-2 text-orange-600 dark:text-orange-400"
            >
              <Flame className="h-4 w-4" />
              Trending ({hotClasses.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex items-center gap-2 text-primary dark:text-primary"
            >
              <BookOpen className="h-4 w-4" />
              All Available ({availableClasses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            {renderNewClasses()}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            {renderHotClasses()}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {renderAvailableClasses()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default StudentRegisterClassView;
