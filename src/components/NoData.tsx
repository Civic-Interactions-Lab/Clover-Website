import { UserRole } from "@/types/user";
import CreateNewClassButton from "../pages/classes/ui/components/CreateNewClassButton";

interface NoDataProps {
  role?: UserRole;
  userName?: string; // For displaying specific user's name when admin is viewing
}

const NoData = ({ role, userName }: NoDataProps) => {
  return (
    <div className="flex flex-1 justify-center py-24">
      <div className="text-center card">
        {role === UserRole.STUDENT ? (
          <>
            <h2 className="text-lg font-semibold text mb-4">
              No activity found
            </h2>
            <p className="text-gray-500 mb-6">
              It seems you haven't accepted any suggestions yet. Start coding to
              see your progress here!
            </p>
            <a
              href="https://clover.nickrucinski.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-blue-400 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-700 hover:scale-105 text-white font-bold py-2 px-4 rounded transition-all"
            >
              Download CLOVER
            </a>
          </>
        ) : role === UserRole.ADMIN ? (
          <>
            <h2 className="text-lg font-semibold text mb-4">
              No activity found
            </h2>
            <p className="text-gray-500 mb-6">
              {userName
                ? `${userName} doesn't have any activity recorded yet. They may need to start coding with CLOVER to see their progress here.`
                : "This student doesn't have any activity recorded yet. They may need to start coding with CLOVER to see their progress here."}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text mb-4">
              No student activity found
            </h2>
            <p className="text-gray-500 mb-6">
              It seems there hasn't been any activity recorded from your
              students yet. Please create a new class, or switch between modes,
              or check back later.
            </p>
            <div className="flex flex-col items-center gap-4">
              <CreateNewClassButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoData;
