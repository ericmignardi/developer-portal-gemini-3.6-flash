"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useUIStore } from "@/store/useUIStore";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import {
  FolderGit2,
  CheckSquare,
  Code2,
  Bookmark,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Clock,
  Pin,
  ExternalLink,
  Plus,
  ArrowRight,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "info" | "warning" | "secondary" | "default" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  IDEA: { label: "Idea", variant: "info" },
  PAUSED: { label: "Paused", variant: "warning" },
  SHIPPED: { label: "Shipped", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export default function DashboardPage() {
  const { openQuickAdd, addToast } = useUIStore();

  const [pinnedProjects, setPinnedProjects] = useState<any[]>([]);
  const [needsAttentionTasks, setNeedsAttentionTasks] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    activeProjects: 0,
    openTasks: 0,
    snippets: 0,
    unreadResources: 0,
  });
  const [recentJournal, setRecentJournal] = useState<any | null>(null);
  const [learningGoals, setLearningGoals] = useState<any[]>([]);
  const [isFreshDb, setIsFreshDb] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pRes, tRes, sRes, rRes, jRes, gRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/snippets"),
        fetch("/api/resources"),
        fetch("/api/journal"),
        fetch("/api/learning/goals"),
      ]);

      if (!pRes.ok || !tRes.ok || !sRes.ok || !rRes.ok || !jRes.ok || !gRes.ok) {
        throw new Error("Failed to load dashboard statistics");
      }

      const allProjects = await pRes.json();
      const allTasks = await tRes.json();
      const allSnippets = await sRes.json();
      const allResources = await rRes.json();
      const allJournal = await jRes.json();
      const allGoals = await gRes.json();

      if (
        allProjects.length === 0 &&
        allTasks.length === 0 &&
        allSnippets.length === 0 &&
        allResources.length === 0
      ) {
        setIsFreshDb(true);
      } else {
        setIsFreshDb(false);
      }

      // Pinned projects
      const pinned = allProjects.filter((p: any) => p.isPinned);
      setPinnedProjects(pinned);

      // Counts
      const activeCount = allProjects.filter((p: any) => p.status === "ACTIVE").length;
      const openTaskCount = allTasks.filter((t: any) => t.status !== "DONE").length;
      const unreadResCount = allResources.filter((r: any) => !r.isRead).length;

      setCounts({
        activeProjects: activeCount,
        openTasks: openTaskCount,
        snippets: allSnippets.length,
        unreadResources: unreadResCount,
      });

      // Needs Attention tasks sorting: overdue tasks first, then due today, then due within 7 days
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const in7Days = new Date(now.getTime() + 7 * 86400000);

      const openTasks = allTasks.filter((t: any) => t.status !== "DONE");

      const overdue: any[] = [];
      const dueToday: any[] = [];
      const dueNext7: any[] = [];
      const otherTasks: any[] = [];

      openTasks.forEach((t: any) => {
        if (!t.dueDate) {
          otherTasks.push(t);
          return;
        }
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);

        if (due.getTime() < now.getTime()) {
          overdue.push(t);
        } else if (due.getTime() === now.getTime()) {
          dueToday.push(t);
        } else if (due.getTime() <= in7Days.getTime()) {
          dueNext7.push(t);
        } else {
          otherTasks.push(t);
        }
      });

      setNeedsAttentionTasks([...overdue, ...dueToday, ...dueNext7, ...otherTasks].slice(0, 6));

      // Most recent journal entry
      setRecentJournal(allJournal.length > 0 ? allJournal[0] : null);

      // Learning goals in progress
      setLearningGoals(allGoals.filter((g: any) => g.status === "IN_PROGRESS"));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (res.ok) {
        addToast({ type: "success", message: "Task completed!" });
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingState message="Loading developer portal dashboard..." />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <ErrorState message={error} onRetry={fetchDashboardData} />
      </PageWrapper>
    );
  }

  if (isFreshDb) {
    return (
      <PageWrapper>
        <EmptyState
          icon={<FolderGit2 className="w-8 h-8 text-indigo-600" />}
          title="Welcome to Atlas Developer Portal"
          description="Your database is fresh and unpopulated. Start by creating your first client project to track environments, tasks, and snippets."
          actionLabel="Create First Project"
          onAction={() => {
            window.location.href = "/projects";
          }}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6">
      {/* Top Banner / Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 p-4 border-slate-200">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {counts.activeProjects}
            </span>
            <p className="text-xs text-slate-500 font-medium">Active Projects</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-slate-200">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {counts.openTasks}
            </span>
            <p className="text-xs text-slate-500 font-medium">Open Tasks</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-slate-200">
          <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {counts.snippets}
            </span>
            <p className="text-xs text-slate-500 font-medium">Saved Snippets</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 border-slate-200">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {counts.unreadResources}
            </span>
            <p className="text-xs text-slate-500 font-medium">Unread Resources</p>
          </div>
        </Card>
      </div>

      {/* Grid Layout: Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Pinned Projects & Needs Attention Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pinned Projects Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Pinned Projects</h3>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All Projects →
              </Link>
            </div>

            {pinnedProjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl bg-white">
                No pinned projects. Pin projects from the Projects page to access them quickly here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pinnedProjects.map((project) => {
                  const badge = STATUS_BADGES[project.status] || STATUS_BADGES.ACTIVE;
                  return (
                    <Card
                      key={project.id}
                      hoverable
                      className="flex flex-col justify-between border-slate-200 hover:border-indigo-300"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {project.client && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                                {project.client}
                              </span>
                            )}
                            <h4 className="font-bold text-sm text-slate-900">
                              <Link href={`/projects/${project.slug}`} className="hover:text-indigo-600 transition-colors">
                                {project.name}
                              </Link>
                            </h4>
                          </div>
                          <Badge variant={badge.variant} size="sm">
                            {badge.label}
                          </Badge>
                        </div>

                        {project.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{project.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {project._count?.environments || 0} envs
                        </span>
                        <Link
                          href={`/projects/${project.slug}`}
                          className="font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          Workspace <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Needs Attention Panel (PRD §7.2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Needs Attention</h3>
              </div>
              <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Task Board →
              </Link>
            </div>

            {needsAttentionTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl bg-white">
                All clear! No overdue or upcoming urgent tasks.
              </p>
            ) : (
              <div className="space-y-2.5">
                {needsAttentionTasks.map((task) => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const isOverdueTask = task.dueDate && new Date(task.dueDate).getTime() < now.getTime();

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border bg-white shadow-2xs gap-3 text-xs transition-colors",
                        isOverdueTask ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="w-5 h-5 rounded border border-slate-300 hover:border-emerald-500 flex items-center justify-center shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                          title="Mark complete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">{task.title}</span>
                          {task.project && (
                            <Link
                              href={`/projects/${task.project.slug}`}
                              className="text-[11px] font-medium text-indigo-600 hover:underline"
                            >
                              @{task.project.name}
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {task.dueDate && (
                          <span
                            className={cn(
                              "font-mono font-medium inline-flex items-center gap-1",
                              isOverdueTask ? "text-rose-600 font-bold" : "text-slate-500"
                            )}
                          >
                            {isOverdueTask ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                        <Badge
                          variant={
                            task.priority === "URGENT"
                              ? "danger"
                              : task.priority === "HIGH"
                              ? "warning"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Recent Journal Entry & Learning Goals Rollup */}
        <div className="space-y-6">
          {/* Recent Journal Entry (PRD §7.2) */}
          <Card className="space-y-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm">Latest Dev Log</CardTitle>
              </div>
              <Link href="/journal" className="text-xs font-semibold text-indigo-600 hover:underline">
                All Logs →
              </Link>
            </CardHeader>
            <CardContent>
              {recentJournal ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                    <span>{formatDate(recentJournal.entryDate)}</span>
                    <span>{formatRelativeTime(recentJournal.entryDate)}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    <Link href={`/journal/${recentJournal.id}`} className="hover:text-indigo-600 transition-colors">
                      {recentJournal.title || "Untitled Entry"}
                    </Link>
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
                    <MarkdownRenderer content={recentJournal.content} />
                  </div>
                  <Link
                    href={`/journal/${recentJournal.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline pt-1 text-xs"
                  >
                    Read full entry <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No journal entries written yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Learning Goals Rollup Panel (PRD §7.2) */}
          <Card className="space-y-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm">In-Progress Goals</CardTitle>
              </div>
              <Link href="/learning" className="text-xs font-semibold text-indigo-600 hover:underline">
                View Goals →
              </Link>
            </CardHeader>
            <CardContent>
              {learningGoals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active learning goals in progress.</p>
              ) : (
                <div className="space-y-4">
                  {learningGoals.map((goal) => (
                    <div key={goal.id} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate">{goal.title}</span>
                        <span className="font-mono font-bold text-indigo-600 shrink-0 ml-2">
                          {goal.progressRollup}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${goal.progressRollup}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border-indigo-100 p-4">
            <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wider mb-2">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openQuickAdd("task")}
                className="bg-white text-xs gap-1 justify-start"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Quick Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openQuickAdd("journal")}
                className="bg-white text-xs gap-1 justify-start"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Quick Journal
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
