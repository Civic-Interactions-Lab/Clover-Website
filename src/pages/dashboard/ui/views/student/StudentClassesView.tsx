import { useEffect, useState } from "react";
import { EnrollmentStatus } from "@/types/user";
import NoClasses from "@/pages/classes/ui/components/NoClasses";
import ClassesCarousel from "../../../../classes/ui/components/ClassesCarousel";
import Loading from "@/components/Loading";
import { useUser } from "@/context/UserContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCheck,
  Clock,
  Grid,
  List,
  UserRoundX,
} from "lucide-react";
import ClassesTable from "../../components/ClassesTable";
import { ClassData } from "@/types/user";
import { getClassesbyStudent } from "@/api/classes";

const StudentClassesView = ({ description }: { description?: string }) => {
  const { userData } = useUser();
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) return;

    const fetchClasses = async () => {
      setLoading(true);

      const { data, error } = await getClassesbyStudent(userData.id);
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setAllClasses((data ?? []) as ClassData[]);
      setLoading(false);
    };

    fetchClasses();
    const refresh = window.setInterval(fetchClasses, 30_000);
    return () => window.clearInterval(refresh);
  }, [userData?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loading size="lg" showText={false} />
      </div>
    );
  }

  if (allClasses.length === 0) {
    return <NoClasses role="student" />;
  }

  const classGroups = [
    {
      status: EnrollmentStatus.ENROLLED,
      title: "Enrolled Classes",
      icon: BookOpen,
      iconColor: "text-blue-600",
    },
    {
      status: EnrollmentStatus.WAITLISTED,
      title: "Waitlisted Classes",
      icon: Clock,
      iconColor: "text-orange-600",
    },
    {
      status: EnrollmentStatus.COMPLETED,
      title: "Completed Classes",
      icon: CheckCheck,
      iconColor: "text-green-600",
    },
    {
      status: EnrollmentStatus.REJECTED,
      title: "Rejected Classes",
      icon: UserRoundX,
      iconColor: "text-red-600",
    },
  ];

  const renderCarouselView = () => (
    <div className="space-y-8">
      {classGroups.map(({ status, title, icon: Icon, iconColor }) => {
        const filteredClasses = allClasses.filter(
          (c) => c.enrollmentStatus === status,
        );
        if (filteredClasses.length === 0) return null;
        return (
          <div className="space-y-4" key={title}>
            <div className="flex items-center gap-2">
              <Icon className={`size-6 ${iconColor}`} />
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <ClassesCarousel classes={filteredClasses} />
          </div>
        );
      })}
    </div>
  );

  const renderTableView = () => (
    <div className="space-y-8">
      {classGroups.map(({ status, title, icon: Icon, iconColor }) => {
        const filteredClasses = allClasses.filter(
          (c) => c.enrollmentStatus === status,
        );
        if (filteredClasses.length === 0) return null;
        return (
          <div className="space-y-4" key={title}>
            <div className="flex items-center gap-2">
              <Icon className={`size-6 ${iconColor}`} />
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <ClassesTable
              key={status}
              classes={filteredClasses}
              showStatus
              showActions
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <Tabs defaultValue="carousel" className="w-full">
      <div className="flex justify-between gap-6 items-center mb-6">
        <p className="text-sm text-muted-foreground hidden md:block">
          {description}
        </p>
        <TabsList className="grid w-full md:w-[200px] grid-cols-2 bg-sidebar">
          <TabsTrigger value="carousel" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <List className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="carousel" className="w-full">
        {renderCarouselView()}
      </TabsContent>

      <TabsContent value="table" className="w-full">
        {renderTableView()}
      </TabsContent>
    </Tabs>
  );
};

export default StudentClassesView;
