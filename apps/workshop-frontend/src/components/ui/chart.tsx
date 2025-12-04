// apps/frontend/src/components/ui/chart.tsx

import * as React from "react"
import { cn } from "../../lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
  }
>(({ className, config, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("w-full h-full", className)}
    {...props}
  >
    {children}
  </div>
))
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cursor?: boolean;
    content?: React.ComponentType<any>;
  }
>(({ className, cursor, content, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
))
ChartTooltip.displayName = "ChartTooltip"

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hideLabel?: boolean;
    formatter?: (value: any, name: any) => [string, string];
  }
>(({ className, hideLabel, formatter, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-background p-2 shadow-md",
      className
    )}
    {...props}
  />
))
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }