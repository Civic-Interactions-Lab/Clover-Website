import { ReactNode, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleChartSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
}

const CollapsibleChartSection = ({
  title,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
}: CollapsibleChartSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn("overflow-hidden py-0", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b",
          headerClassName,
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isExpanded && <div className="px-3">{children}</div>}
    </Card>
  );
};

export default CollapsibleChartSection;
