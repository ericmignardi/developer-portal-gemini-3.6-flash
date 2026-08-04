"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EnvironmentList } from "@/components/environments/EnvironmentList";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { useUIStore } from "@/store/useUIStore";
import { formatDate } from "@/lib/utils";
import { GithubIcon } from "@/components/ui/GithubIcon";
import {
  ArrowLeft,
  Pin,
  ExternalLink,
  Calendar,
  Layers,
  CheckSquare,
  BookOpen,
  Edit2,
  Trash2,
  GitCommit,
  GitPullRequest,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageParams {
  slug: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "info" | "warning" | "secondary" | "default" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  IDEA: { label: "Idea", variant: "info" },
  PAUSED: { label: "Paused", variant: "warning" },
  SHIPPED: { label: "Shipped", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export default function ProjectDetailPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { openConfirm, addToast } = useUIStore();

  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "environments" | "tasks" | "journal">("overview");

  // GitHub integration state
  const [githubData, setGithubData] = useState<any | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/projects/${resolvedParams.slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Project not found");
        throw new Error("Failed to load project detail");
      }

      const data = await res.json();
      setProject(data);

      if (data.repoUrl) {
        fetchGitHubInfo(data.repoUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.slug]);

  const fetchGitHubInfo = async (repoUrl: string) => {
    try {
      setGithubLoading(true);
      const res = await fetch(`/api/github?repoUrl=${encodeURIComponent(repoUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setGithubData(data);
      }
    } catch {
      // Non-fatal
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleTogglePin = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !project.isPinned }),
      });
      if (res.ok) {
        addToast({
          type: "success",
          message: project.isPinned ? "Unpinned project" : "Pinned project to Dashboard",
        });
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    openConfirm({
      title: `Delete ${project.name}?`,
      message: `Are you sure you want to delete '${project.name}'? This action cannot be undone and will delete all associated environments.`,
      confirmText: "Delete Project",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: `Deleted ${project.name}` });
          router.push("/projects");
        } else {
          addToast({ type: "error", message: "Failed to delete project" });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingState message="Loading project workspace..." />
      </PageWrapper>
    );
  }

  if (error || !project) {
    return (
      <PageWrapper>
        <ErrorState message={error || "Project not found"} onRetry={fetchProject} />
      </PageWrapper>
    );
  }

  const badge = STATUS_BADGES[project.status] || STATUS_BADGES.ACTIVE;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers, count: null },
    { id: "environments", label: "Environments", icon: Layers, count: project.environments?.length || 0 },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: project.tasks?.length || 0 },
    { id: "journal", label: "Journal", icon: BookOpen, count: project.journalEntries?.length || 0 },
  ];

  return (
    <PageWrapper className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              {project.client && (
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {project.client}
                </span>
              )}
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>

            {project.description && (
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{project.description}</p>
            )}

            {/* Quick Links & Meta */}
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  <GithubIcon className="w-4 h-4" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live Production
                </a>
              )}
              {project.startedAt && (
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Started {formatDate(project.startedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={handleTogglePin}
              className={cn(
                "p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium",
                project.isPinned
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              title={project.isPinned ? "Unpin project" : "Pin project to Dashboard"}
            >
              <Pin className="w-4 h-4 fill-current" />
              <span>{project.isPinned ? "Pinned" : "Pin"}</span>
            </button>

            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>

            <Button variant="ghost" size="sm" onClick={handleDeleteProject} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 text-[10px] rounded-full font-mono",
                    isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tech Stack & Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack & Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.techStack && project.techStack.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStack.map((tech: string) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-lg border border-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.tags && project.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="px-2.5 py-1 text-xs font-medium text-white rounded-md shadow-2xs"
                          style={{ backgroundColor: tag.color }}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GitHub Integration Widget */}
            {project.repoUrl && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GithubIcon className="w-5 h-5 text-slate-900" />
                    <CardTitle>GitHub Activity</CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {githubData?.owner}/{githubData?.repo}
                  </span>
                </CardHeader>
                <CardContent>
                  {githubLoading ? (
                    <LoadingState message="Fetching recent commits and PRs..." />
                  ) : githubData?.disabled ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                      <p className="font-semibold mb-1">GitHub Integration Status</p>
                      <p>{githubData.message}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Commits */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <GitCommit className="w-3.5 h-3.5" />
                          Recent Commits (5)
                        </h4>
                        {githubData?.commits && githubData.commits.length > 0 ? (
                          <div className="space-y-2">
                            {githubData.commits.map((c: any) => (
                              <div
                                key={c.sha}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                                    {c.sha}
                                  </span>
                                  <span className="truncate text-slate-800 font-medium">{c.message}</span>
                                </div>
                                <span className="text-[11px] text-slate-400 shrink-0 ml-2">{c.author}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No recent commits found.</p>
                        )}
                      </div>

                      {/* Pull Requests */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <GitPullRequest className="w-3.5 h-3.5" />
                          Open Pull Requests
                        </h4>
                        {githubData?.pullRequests && githubData.pullRequests.length > 0 ? (
                          <div className="space-y-2">
                            {githubData.pullRequests.map((pr: any) => (
                              <div
                                key={pr.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="font-mono font-semibold text-emerald-700">#{pr.number}</span>
                                  <a
                                    href={pr.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="truncate text-slate-900 hover:text-emerald-700 font-medium hover:underline"
                                  >
                                    {pr.title}
                                  </a>
                                </div>
                                <span className="text-[11px] text-slate-400 shrink-0 ml-2">@{pr.author}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No open pull requests.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Environments</span>
                  <span className="font-semibold text-slate-900">{project.environments?.length || 0}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Open Tasks</span>
                  <span className="font-semibold text-slate-900">
                    {project.tasks?.filter((t: any) => t.status !== "DONE").length || 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Journal Entries</span>
                  <span className="font-semibold text-slate-900">{project.journalEntries?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "environments" && (
        <EnvironmentList
          projectId={project.id}
          environments={project.environments || []}
          onRefresh={fetchProject}
        />
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Project Tasks</h3>
            <Button
              size="sm"
              onClick={() => {
                useUIStore.getState().openQuickAdd("task");
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Task
            </Button>
          </div>

          {project.tasks?.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 text-center border border-dashed rounded-xl">
              No tasks associated with this project.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {project.tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={cn("w-4 h-4", task.status === "DONE" ? "text-emerald-500" : "text-slate-300")}
                    />
                    <div>
                      <span className={cn("font-medium text-slate-900", task.status === "DONE" && "line-through text-slate-400")}>
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.status === "DONE" ? "success" : "outline"} size="sm">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "journal" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Project Dev Log</h3>
          {project.journalEntries?.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-6 text-center border border-dashed rounded-xl">
              No journal entries associated with this project.
            </p>
          ) : (
            <div className="space-y-4">
              {project.journalEntries.map((j: any) => (
                <Card key={j.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">{j.title || "Untitled Entry"}</CardTitle>
                    <span className="text-[11px] text-slate-400 font-mono">{formatDate(j.entryDate)}</span>
                  </CardHeader>
                  <CardContent>
                    <MarkdownRenderer content={j.content} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchProject}
        projectToEdit={project}
      />
    </PageWrapper>
  );
}
