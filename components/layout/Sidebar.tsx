"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderGit2 },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Journal", href: "/journal", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, openQuickAdd } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = mounted ? sidebarCollapsed : false;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r border-slate-200/80 bg-white shadow-2xs transition-all duration-300 z-30 shrink-0 select-none",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-sm shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base tracking-tight leading-none">
                Atlas
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-0.5">Developer Portal</span>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Add Button */}
      <div className="p-3">
        {isCollapsed ? (
          <Tooltip content="Quick Add" side="right">
            <Button
              variant="primary"
              size="icon"
              className="w-full h-10 rounded-lg shadow-xs"
              onClick={() => openQuickAdd("task")}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            className="w-full justify-center gap-2 shadow-xs text-xs font-semibold"
            onClick={() => openQuickAdd("task")}
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href} content={item.label} side="right">
                {linkContent}
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* Footer Profile / Version */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px]">v1.0.0</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="System Operational" />
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
