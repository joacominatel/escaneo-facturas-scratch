/* eslint-disable @typescript-eslint/no-empty-object-type */
import type React from "react";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "../theme-provider";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <ThemeProvider defaultTheme="light">
      <div className={cn("grid items-start gap-8", className)} {...props}>
        {children}
      </div>
    </ThemeProvider>
  );
}
