import React, { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "indigo" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-primary/15 text-primary border border-primary/30",
    secondary: "bg-secondary text-secondary-foreground border border-border",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    destructive: "bg-destructive/15 text-red-400 border border-destructive/30",
    outline: "bg-transparent text-muted-foreground border border-border",
    indigo: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    purple: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
