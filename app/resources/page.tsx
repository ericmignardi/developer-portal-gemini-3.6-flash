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
import { ResourceModal } from "@/components/resources/ResourceModal";
import { useUIStore } from "@/store/useUIStore";
import { extractDomain } from "@/lib/utils";
import { GithubIcon } from "@/components/ui/GithubIcon";
import {
  Bookmark,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  FolderGit2,
  Edit2,
  Trash2,
  BookOpen,
  Video,
  Wrench,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  type: "ARTICLE" | "DOCS" | "VIDEO" | "TOOL" | "REPO" | "OTHER";
  isRead: boolean;
  projectId?: string;
  project?: { id: string; name: string; slug: string };
  tags: { id: string; name: string; color: string }[];
  createdAt: string;
}

const TYPE_ICONS: Record<string, any> = {
  ARTICLE: FileText,
  DOCS: BookOpen,
  VIDEO: Video,
  TOOL: Wrench,
  REPO: GithubIcon,
  OTHER: Bookmark,
};

export default function ResourcesPage() {
  const { openConfirm, addToast } = useUIStore();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [readFilter, setReadFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<ResourceItem | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (tagFilter) params.append("tag", tagFilter);
      if (projectFilter) params.append("projectId", projectFilter);
      if (searchQuery) params.append("q", searchQuery);
      if (readFilter === "READ") params.append("isRead", "true");
      if (readFilter === "UNREAD") params.append("isRead", "false");

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load resources");

      setResources(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, tagFilter, projectFilter, searchQuery, readFilter]);

  const fetchAuxiliary = async () => {
    try {
      const [tRes, pRes] = await Promise.all([fetch("/api/tags"), fetch("/api/projects")]);
      if (tRes.ok) setTags(await tRes.json());
      if (pRes.ok) setProjects(await pRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAuxiliary();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchResources]);

  const handleToggleRead = async (resource: ResourceItem) => {
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !resource.isRead }),
      });

      if (res.ok) {
        addToast({
          type: "success",
          message: resource.isRead ? "Marked as unread" : "Marked as read",
        });
        fetchResources();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (resource: ResourceItem) => {
    openConfirm({
      title: `Delete resource?`,
      message: `Are you sure you want to delete '${resource.title}'?`,
      confirmText: "Delete Resource",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Resource deleted" });
          fetchResources();
        } else {
          addToast({ type: "error", message: "Failed to delete resource" });
        }
      },
    });
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resources</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bookmarked documentation, articles, tools, and tutorials.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setResourceToEdit(null);
            setIsModalOpen(true);
          }}
          className="shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, description, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <Select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as any)}
            className="w-full sm:w-32 text-xs font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Types</option>
            <option value="ARTICLE">Article</option>
            <option value="DOCS">Docs</option>
            <option value="VIDEO">Video</option>
            <option value="TOOL">Tool</option>
            <option value="REPO">Repo</option>
            <option value="OTHER">Other</option>
          </Select>

          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          <Select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                #{t.name}
              </option>
            ))}
          </Select>

          {(searchQuery || typeFilter || tagFilter || projectFilter || readFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("");
                setTagFilter("");
                setProjectFilter("");
                setReadFilter("ALL");
              }}
              className="text-xs text-slate-500"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading bookmarks..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchResources} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-6 h-6 text-indigo-600" />}
          title={searchQuery || typeFilter || tagFilter || projectFilter || readFilter !== "ALL" ? "No matching resources" : "No resources bookmarked yet"}
          description={
            searchQuery || typeFilter || tagFilter || projectFilter || readFilter !== "ALL"
              ? "Try adjusting your search query or filters."
              : "Save documentation links, architecture blogs, and tools for easy reference."
          }
          actionLabel="Add Resource"
          onAction={() => {
            setResourceToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource) => {
            const Icon = TYPE_ICONS[resource.type] || Bookmark;
            const domain = extractDomain(resource.url);

            return (
              <Card
                key={resource.id}
                className={cn(
                  "flex flex-col justify-between space-y-3 transition-colors",
                  resource.isRead && "bg-slate-50/50 border-slate-200/60"
                )}
              >
                <div>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggleRead(resource)}
                        className={cn(
                          "mt-0.5 p-0.5 rounded-full transition-colors shrink-0",
                          resource.isRead ? "text-emerald-500" : "text-slate-300 hover:text-slate-500"
                        )}
                        title={resource.isRead ? "Mark as unread" : "Mark as read"}
                      >
                        {resource.isRead ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                      </button>

                      <div className="min-w-0 space-y-0.5">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "font-bold text-sm text-slate-900 hover:text-indigo-600 hover:underline inline-flex items-center gap-1.5 leading-snug break-words",
                            resource.isRead && "text-slate-600 font-medium"
                          )}
                        >
                          {resource.title}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </a>
                        <span className="text-[11px] font-mono text-slate-400 block">{domain}</span>
                      </div>
                    </div>

                    <Badge variant="outline" size="sm" className="font-mono text-[10px] shrink-0 gap-1">
                      <Icon className="w-3 h-3 text-slate-500" />
                      {resource.type}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1">
                    {resource.description && (
                      <CardDescription className="text-xs text-slate-600 leading-relaxed">
                        {resource.description}
                      </CardDescription>
                    )}

                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => setTagFilter(tag.name)}
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

                <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs text-slate-500">
                  {resource.project ? (
                    <Link
                      href={`/projects/${resource.project.slug}`}
                      className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      {resource.project.name}
                    </Link>
                  ) : (
                    <span className="text-slate-400 italic">Standalone Resource</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setResourceToEdit(resource);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Edit Resource"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      title="Delete Resource"
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

      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchResources}
        resourceToEdit={resourceToEdit}
        projects={projects}
      />
    </PageWrapper>
  );
}
