import React from "react";
import { Button } from "@/components/ui/Button";
import { FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 min-h-[260px]",
        className
      )}
    >
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-slate-500 mb-3.5">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
