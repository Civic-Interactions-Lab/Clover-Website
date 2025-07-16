import { Star } from "lucide-react";
import { User } from "../types/user";
import ProfileCard from "../components/ProfileCard";
import { useInstructorClasses } from "../hooks/useInstructorClasses";
import Loading from "@/components/Loading";

const AdminProfile = ({ userData }: { userData: User }) => {
  const { originalClasses, loading: userClassLoading } = useInstructorClasses();

  if (userClassLoading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loading size="lg" showText={false} />
      </div>
    );
  }

  return (
    <div className="width-container items-center justify-center">
      <div className="md:col-span-2 lg:col-span-1 space-y-4">
        <ProfileCard
          userData={userData}
          detailsContent={[
            {
              label: "Ratings",
              value: (
                <>
                  5.0{" "}
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                </>
              ),
            },
            {
              label: "Courses",
              value: originalClasses?.length ?? 0,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminProfile;
