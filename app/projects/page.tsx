"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { useUIStore } from "@/store/useUIStore";
import { GithubIcon } from "@/components/ui/GithubIcon";
import {
  FolderGit2,
  Plus,
  Search,
  Pin,
  ExternalLink,
  Layers,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  client?: string;
  description?: string;
  status: "IDEA" | "ACTIVE" | "PAUSED" | "SHIPPED" | "ARCHIVED";
  repoUrl?: string;
  liveUrl?: string;
  techStack: string[];
  isPinned: boolean;
  tags: { id: string; name: string; color: string }[];
  _count?: {
    environments: number;
    tasks: number;
    journalEntries: number;
  };
}

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "info" | "warning" | "secondary" | "default" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  IDEA: { label: "Idea", variant: "info" },
  PAUSED: { label: "Paused", variant: "warning" },
  SHIPPED: { label: "Shipped", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export default function ProjectsPage() {
  const { openConfirm, addToast } = useUIStore();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectItem | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (tagFilter) params.append("tag", tagFilter);
      if (searchQuery) params.append("q", searchQuery);

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load projects");

      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, tagFilter, searchQuery]);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleTogglePin = async (project: ProjectItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !project.isPinned }),
      });

      if (res.ok) {
        addToast({
          type: "success",
          message: project.isPinned ? `Unpinned ${project.name}` : `Pinned ${project.name} to Dashboard`,
        });
        fetchProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (project: ProjectItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    openConfirm({
      title: `Delete ${project.name}?`,
      message: `Are you sure you want to delete '${project.name}'? This action cannot be undone and will delete all associated environments.`,
      confirmText: "Delete Project",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: `Deleted project ${project.name}` });
          fetchProjects();
        } else {
          addToast({ type: "error", message: "Failed to delete project" });
        }
      },
    });
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your client applications, repositories, environments, and tasks.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, client, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-36 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IDEA">Idea</option>
            <option value="PAUSED">Paused</option>
            <option value="SHIPPED">Shipped</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full md:w-36 text-xs"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                #{t.name}
              </option>
            ))}
          </Select>

          {(searchQuery || statusFilter || tagFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setTagFilter("");
              }}
              className="text-xs text-slate-500"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <LoadingState message="Loading projects..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProjects} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderGit2 className="w-6 h-6 text-indigo-600" />}
          title={searchQuery || statusFilter || tagFilter ? "No matching projects found" : "No projects created yet"}
          description={
            searchQuery || statusFilter || tagFilter
              ? "Try adjusting your filters or search terms."
              : "Create your first project to organize repositories, Vercel deployments, and database branches."
          }
          actionLabel="Create Project"
          onAction={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const badge = STATUS_BADGES[project.status] || STATUS_BADGES.ACTIVE;

            return (
              <Card
                key={project.id}
                hoverable
                className="flex flex-col justify-between group relative border border-slate-200/80 hover:border-indigo-300"
              >
                <div>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div>
                      {project.client && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-0.5 block">
                          {project.client}
                        </span>
                      )}
                      <CardTitle className="text-base group-hover:text-indigo-600 transition-colors">
                        <Link href={`/projects/${project.slug}`} className="focus:outline-none">
                          {project.name}
                        </Link>
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleTogglePin(project, e)}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          project.isPinned
                            ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                        )}
                        title={project.isPinned ? "Unpin project" : "Pin project"}
                      >
                        <Pin className="w-4 h-4 fill-current" />
                      </button>

                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {project.description}
                      </CardDescription>
                    )}

                    {/* Tech stack chips */}
                    {project.techStack && project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {project.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tag chips */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTagFilter(tag.name);
                            }}
                            className="inline-flex items-center text-[10px] font-medium text-white px-2 py-0.5 rounded-md hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: tag.color }}
                          >
                            #{tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-100 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-600" title="Environments count">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {project._count?.environments || 0} envs
                    </span>
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-900 transition-colors"
                        title="GitHub Repository"
                      >
                        <GithubIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Live Site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToEdit(project);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-xs hover:bg-slate-100 transition-colors"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-xs hover:bg-slate-100 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjects}
        projectToEdit={projectToEdit}
      />
    </PageWrapper>
  );
}
