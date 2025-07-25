import UserAvatar from "./UserAvatar";

interface UserInfoItemProps {
  firstName: string;
  lastName?: string;
  email: string;
  avatarUrl?: string;
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
  size = "md",
  className,
  hexColor,
  onClick,
}: UserInfoItemProps) => {
  const getTextSizes = () => {
    switch (size) {
      case "xs":
        return { name: "text-xs", email: "text-xs" };
      case "sm":
        return { name: "text-sm", email: "text-xs" };
      case "md":
        return { name: "text-base", email: "text-sm" };
      case "lg":
        return { name: "text-lg", email: "text-base" };
      default:
        return { name: "text-sm", email: "text-xs" };
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
        <div className={`text-muted-foreground truncate ${textSizes.email}`}>
          {email.includes("anonymous.com") ? "Anonymous" : email}
        </div>
      </div>
    </div>
  );
};

export default UserInfoItem;
