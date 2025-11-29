import { UserMode } from "@/types/user";
import { Badge } from "@/components/ui/badge";

interface ModeBadgeProps {
  mode: UserMode;
  className?: string;
}

const ModeBadge = ({ mode, className }: ModeBadgeProps) => {
  const getModeDisplay = (mode: UserMode) => {
    const modeConfig = {
      LINE_BY_LINE: {
        label: "Line",
        color: "bg-blue-900 text-blue-200",
      },
      CODE_BLOCK: {
        label: "Block",
        color: "bg-green-900 text-green-200",
      },
      CODE_SELECTION: {
        label: "Selection",
        color: "bg-purple-900 text-purple-200",
      },
    };

    const config = modeConfig[mode as keyof typeof modeConfig];
    if (!config) {
      return (
        <Badge
          variant="outline"
          className={`text-[10px] sm:text-xs ${className || ""}`}
        >
          {mode}
        </Badge>
      );
    }

    return (
      <Badge
        variant="secondary"
        className={`${config.color} w-14 rounded-xl justify-center py-0.5 sm:py-1 text-[10px] sm:text-xs ${className || ""}`}
      >
        {config.label}
      </Badge>
    );
  };

  return getModeDisplay(mode);
};

export default ModeBadge;
