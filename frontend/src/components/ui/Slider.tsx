import React, { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, value, min = 0, max = 1, step = 0.01, displayValue, onChange, ...props }, ref) => {
    const pct = ((value - (min ?? 0)) / ((max ?? 1) - (min ?? 0))) * 100;

    return (
      <div className="w-full space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <span className="text-sm font-mono text-primary tabular-nums">
              {displayValue ?? value.toFixed(2)}
            </span>
          </div>
        )}
        <div className="relative h-5 flex items-center">
          <div className="relative w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-75"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className={cn(
              "absolute w-full h-full opacity-0 cursor-pointer",
              className
            )}
            {...props}
          />
          {/* Thumb */}
          <div
            className="absolute w-4 h-4 rounded-full bg-primary border-2 border-background shadow-glow-sm pointer-events-none transition-all duration-75"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";
