import { LucideIcon } from "lucide-react";
import { CardHeader, CardTitle } from "./ui/card";

interface InfoCardTitleProps {
  title: string;
  icon: LucideIcon;
  button?: React.ReactNode;
}

const InfoCardTitle = ({ title, icon: Icon, button }: InfoCardTitleProps) => (
  <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
    <CardTitle className="text-lg flex items-center gap-2">
      <Icon className="h-5 w-5" />
      {title}
    </CardTitle>
    {button}
  </CardHeader>
);

interface InfoFieldProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

const InfoField = ({ label, value, icon: Icon, className }: InfoFieldProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      <span className="text-sm font-medium flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
      </span>
      <span className="text-xs font-mono bg-muted px-2 py-1 rounded break-all">
        {value}
      </span>
    </div>
  );
};

interface InfoCardProps {
  value: React.ReactNode;
  label: string;
  className?: string;
}

const InfoCardItem = ({ value, label, className }: InfoCardProps) => {
  return (
    <div
      className={`flex flex-col justify-center items-center p-3 bg-muted rounded-lg ${className || ""}`}
    >
      <div className={`font-bold text-primary text-center text-xl`}>
        {value}
      </div>
      <div className="text-sm text-muted-foreground text-center">{label}</div>
    </div>
  );
};

export { InfoCardTitle, InfoField, InfoCardItem };
