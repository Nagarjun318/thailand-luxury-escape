import * as React from "react";
import { cn, clamp } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-white/5",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-700 ease-out",
          indicatorClassName
        )}
        style={{ width: `${clamp(value)}%` }}
      />
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
