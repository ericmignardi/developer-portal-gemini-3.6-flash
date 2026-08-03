"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/useUIStore";

const TITLE_MAP: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of projects, tasks, and learning progress" },
  "/projects": { title: "Projects", subtitle: "Manage client applications, repositories, and environments" },
  "/tasks": { title: "Tasks", subtitle: "Track open items, priorities, and deadlines" },
  "/snippets": { title: "Snippets", subtitle: "Reusable code library with syntax highlighting" },
  "/resources": { title: "Resources", subtitle: "Bookmarked articles, docs, tools, and repos" },
  "/journal": { title: "Dev Journal", subtitle: "Daily logs, session notes, and architectural records" },
  "/learning": { title: "Learning", subtitle: "Track learning goals and online course progress" },
};

export function Header() {
  const pathname = usePathname();
  const { openQuickAdd } = useUIStore();

  let info = TITLE_MAP[pathname];
  if (!info) {
    if (pathname.startsWith("/projects/")) {
      info = { title: "Project Detail", subtitle: "Environments, tasks, snippets, and project context" };
    } else if (pathname.startsWith("/journal/")) {
      info = { title: "Journal Entry", subtitle: "View and edit developer log" };
    } else {
      info = { title: "Atlas Portal", subtitle: "Personal Developer Hub" };
    }
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{info.title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => openQuickAdd("task")} className="gap-1.5 text-xs font-medium">
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          Quick Task / Journal
        </Button>
      </div>
    </header>
  );
}
