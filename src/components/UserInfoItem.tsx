import UserAvatar from "./UserAvatar";

interface UserInfoItemProps {
  firstName: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  pid?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  hexColor?: string;
  onClick?: () => void;
}

const UserInfoItem = ({
  firstName,
  lastName,
  email,
  avatarUrl,
  pid,
  size = "md",
  className,
  hexColor,
  onClick,
}: UserInfoItemProps) => {
  const getTextSizes = () => {
    switch (size) {
      case "xs":
        return { name: "text-xs", pid: "text-xs" };
      case "sm":
        return { name: "text-sm", pid: "text-xs" };
      case "md":
        return { name: "text-base", pid: "text-sm" };
      case "lg":
        return { name: "text-lg", pid: "text-base" };
      default:
        return { name: "text-sm", pid: "text-xs" };
    }
  };

  const textSizes = getTextSizes();

  return (
    <div
      className={`flex items-center gap-3 bg-muted rounded-lg ${className || ""}`}
      onClick={onClick}
    >
      <UserAvatar
        firstName={firstName}
        avatarUrl={avatarUrl}
        size={size}
        hexColor={hexColor}
      />
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${textSizes.name}`}>
          {firstName} {lastName}
        </div>
        <div className={`text-muted-foreground truncate ${textSizes.pid}`}>
          pid: {pid ? pid : "No PID"}
        </div>
      </div>
    </div>
  );
};

export default UserInfoItem;
