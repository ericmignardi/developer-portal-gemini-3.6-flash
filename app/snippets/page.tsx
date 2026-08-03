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
import { CodeHighlight } from "@/components/ui/CodeHighlight";
import { SnippetModal } from "@/components/snippets/SnippetModal";
import { useUIStore } from "@/store/useUIStore";
import {
  Code2,
  Plus,
  Search,
  Star,
  FolderGit2,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SnippetItem {
  id: string;
  title: string;
  description?: string;
  language: string;
  code: string;
  isFavorite: boolean;
  projectId?: string;
  project?: { id: string; name: string; slug: string };
  tags: { id: string; name: string; color: string }[];
  createdAt: string;
}

export default function SnippetsPage() {
  const { openConfirm, addToast } = useUIStore();

  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState<SnippetItem | null>(null);

  const fetchSnippets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (languageFilter) params.append("language", languageFilter);
      if (tagFilter) params.append("tag", tagFilter);
      if (searchQuery) params.append("q", searchQuery);
      if (favoriteOnly) params.append("favorite", "true");

      const res = await fetch(`/api/snippets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load snippets");

      setSnippets(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load snippets");
    } finally {
      setIsLoading(false);
    }
  }, [languageFilter, tagFilter, searchQuery, favoriteOnly]);

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
      fetchSnippets();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchSnippets]);

  const handleToggleFavorite = async (snippet: SnippetItem) => {
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !snippet.isFavorite }),
      });

      if (res.ok) {
        addToast({
          type: "success",
          message: snippet.isFavorite ? "Removed from favorites" : "Added to favorites",
        });
        fetchSnippets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (snippet: SnippetItem) => {
    openConfirm({
      title: `Delete snippet?`,
      message: `Are you sure you want to delete '${snippet.title}'?`,
      confirmText: "Delete Snippet",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/snippets/${snippet.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Snippet deleted" });
          fetchSnippets();
        } else {
          addToast({ type: "error", message: "Failed to delete snippet" });
        }
      },
    });
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Snippets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your personal code library with light-themed syntax highlighting.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSnippetToEdit(null);
            setIsModalOpen(true);
          }}
          className="shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Snippet
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, description, or code content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <Select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Languages</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="sql">SQL</option>
            <option value="bash">Bash</option>
            <option value="css">CSS</option>
            <option value="yaml">YAML</option>
            <option value="json">JSON</option>
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

          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
              favoriteOnly
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", favoriteOnly ? "fill-amber-500 text-amber-500" : "text-slate-400")} />
            Favorites Only
          </button>

          {(searchQuery || languageFilter || tagFilter || favoriteOnly) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setLanguageFilter("");
                setTagFilter("");
                setFavoriteOnly(false);
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
        <LoadingState message="Loading snippets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSnippets} />
      ) : snippets.length === 0 ? (
        <EmptyState
          icon={<Code2 className="w-6 h-6 text-indigo-600" />}
          title={searchQuery || languageFilter || tagFilter || favoriteOnly ? "No matching snippets" : "No snippets saved yet"}
          description={
            searchQuery || languageFilter || tagFilter || favoriteOnly
              ? "Try adjusting your search query or filters."
              : "Save useful SQL queries, Docker configs, and utility functions for instant access."
          }
          actionLabel="Create Snippet"
          onAction={() => {
            setSnippetToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {snippets.map((snippet) => (
            <Card key={snippet.id} className="flex flex-col justify-between space-y-3">
              <div>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold truncate">{snippet.title}</CardTitle>
                      <Badge variant="outline" size="sm" className="font-mono uppercase">
                        {snippet.language}
                      </Badge>
                    </div>

                    {snippet.description && (
                      <CardDescription className="text-xs text-slate-500 line-clamp-2">
                        {snippet.description}
                      </CardDescription>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleFavorite(snippet)}
                    className={cn(
                      "p-1.5 rounded-md transition-colors shrink-0",
                      snippet.isFavorite
                        ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                        : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
                    )}
                    title={snippet.isFavorite ? "Remove favorite" : "Favorite snippet"}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <CodeHighlight code={snippet.code} language={snippet.language} />

                  {/* Tags */}
                  {snippet.tags && snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {snippet.tags.map((tag) => (
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
                {snippet.project ? (
                  <Link
                    href={`/projects/${snippet.project.slug}`}
                    className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    {snippet.project.name}
                  </Link>
                ) : (
                  <span className="text-slate-400 italic">Standalone Snippet</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSnippetToEdit(snippet);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="Edit Snippet"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(snippet)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                    title="Delete Snippet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <SnippetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSnippets}
        snippetToEdit={snippetToEdit}
        projects={projects}
      />
    </PageWrapper>
  );
}
