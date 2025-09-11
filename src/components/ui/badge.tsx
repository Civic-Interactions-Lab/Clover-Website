import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-blue-500 text-white dark:text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-beta text-destructive-foreground shadow hover:bg-beta/80",
        error:
          "border-transparent bg-red-500 text-white dark:text-destructive-foreground hover:bg-red-500/80",
        warning:
          "border-transparent bg-yellow-500 text-white dark:text-warning-foreground hover:bg-yellow-500/80",
        critical:
          "border-transparent bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
