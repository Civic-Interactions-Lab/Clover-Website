import { Badge } from "@/components/ui/badge";
import { BugIcon } from "lucide-react";

interface BugBadgeProps {
  bugPercentage: number;
  className?: string;
}

const BugBadge = ({ bugPercentage, className }: BugBadgeProps) => {
  return (
    <Badge
      variant="secondary"
      className={`bg-orange-900 text-orange-200 rounded-xl justify-center py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center gap-1 ${className || ""}`}
    >
      <BugIcon className="size-3" />
      {bugPercentage}%
    </Badge>
  );
};

export default BugBadge;
