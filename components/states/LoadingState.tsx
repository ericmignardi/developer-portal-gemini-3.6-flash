import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading content...", className }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-100 bg-white/50 backdrop-blur-xs min-h-[220px]",
        className
      )}
    >
      <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-xs font-medium text-slate-600 tracking-wide">{message}</p>
    </div>
  );
}
