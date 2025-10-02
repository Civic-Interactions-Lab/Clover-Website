import { ClassData } from "@/types/user";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type ClassCardProps = {
  classInfo: ClassData;
  isInstructor?: boolean;
};

/**
 * ClassInfoCard component displays information about a class, including the instructor and enrolled students.
 * It allows instructors to manage student enrollment status.
 * @param {Object} props - The component props.
 * @param {UserClass | UserClassInfo} props.classInfo - The class object containing class details.
 * @param {boolean} [props.isInstructor=false] - Flag to indicate if the user is an instructor.
 */
export const ClassInfoCard = ({ classInfo }: ClassCardProps) => {
  const navigate = useNavigate();
  const {
    classTitle,
    classDescription,
    classImageCover,
    classHexColor,
    instructorName,
    id,
  } = classInfo;

  const handleCardClick = () => {
    navigate(`/dashboard/user-classes/${id}`);
  };

  return (
    <div
      className="group hover:no-underline flex flex-1"
      onClick={handleCardClick}
    >
      <Card className="pt-0 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-95 border border-border flex flex-col flex-1">
        <div className="relative h-36 w-full overflow-hidden">
          {classImageCover ? (
            <img
              src={classImageCover}
              alt={classTitle}
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="h-full w-full flex items-center justify-center"
              style={{ backgroundColor: classHexColor || "#E5E7EB" }}
            />
          )}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-lg font-bold mb-2 line-clamp-2 min-h-[3.5rem] flex items-start">
            {classTitle}
          </h3>
          <p className="text-gray-500 mb-4 line-clamp-2 flex-1 text-sm">
            {classDescription || "No description available."}
          </p>
          <div className="space-y-4 mt-auto">
            {instructorName && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="size-8 rounded-full flex items-center justify-center font-medium text-white shrink-0"
                    style={{
                      backgroundColor: classHexColor || "#E5E7EB",
                    }}
                  >
                    {instructorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-muted-foreground ml-3">
                    by {instructorName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClassInfoCard;
