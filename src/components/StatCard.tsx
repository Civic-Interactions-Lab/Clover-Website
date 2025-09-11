import { CustomTooltip } from "./CustomTooltip";
import { Card } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltipContent?: string | React.ReactNode;
  textSize?: string;
}

/**
 * A card to be used in the stats section of the dashboard.
 * It displays a title and a value.
 * @param props - The props for the StatCard component.
 * @param {string} props.title - The title of the stat card.
 * @param {string | number} props.value - The value to be displayed in the stat card.
 * @returns
 */
const StatCard = ({
  title,
  value,
  subtitle,
  tooltipContent,
  textSize = "text-xl",
}: StatCardProps) => {
  return (
    <Card className="w-full h-full p-4 flex flex-col gap-1">
      <CustomTooltip
        trigger={
          <p className={`font-bold text-primary ${textSize}`}>{title}</p>
        }
        align="start"
      >
        {tooltipContent}
      </CustomTooltip>
      <p className="text-2xl font-bold text-text">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </Card>
  );
};

export default StatCard;
