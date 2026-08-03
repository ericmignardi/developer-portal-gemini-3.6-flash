"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { JournalModal } from "@/components/journal/JournalModal";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useUIStore } from "@/store/useUIStore";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Search,
  FolderGit2,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface JournalEntryItem {
  id: string;
  title?: string;
  content: string;
  entryDate: string;
  projectId?: string;
  project?: { id: string; name: string; slug: string };
  tags: { id: string; name: string; color: string }[];
  createdAt: string;
}

export default function JournalPage() {
  const { openConfirm, addToast } = useUIStore();

  const [entries, setEntries] = useState<JournalEntryItem[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntryItem | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (projectFilter) params.append("projectId", projectFilter);
      if (searchQuery) params.append("q", searchQuery);

      const res = await fetch(`/api/journal?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load journal entries");

      setEntries(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load journal");
    } finally {
      setIsLoading(false);
    }
  }, [projectFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchEntries]);

  const handleDelete = (entry: JournalEntryItem) => {
    openConfirm({
      title: `Delete journal entry?`,
      message: `Are you sure you want to delete this journal entry from ${formatDate(entry.entryDate)}?`,
      confirmText: "Delete Entry",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Journal entry deleted" });
          fetchEntries();
        } else {
          addToast({ type: "error", message: "Failed to delete entry" });
        }
      },
    });
  };

  // Group entries by Date string for reverse-chronological view
  const groupedEntries: Record<string, JournalEntryItem[]> = {};
  entries.forEach((e) => {
    const dateStr = formatDate(e.entryDate);
    if (!groupedEntries[dateStr]) groupedEntries[dateStr] = [];
    groupedEntries[dateStr].push(e);
  });

  return (
    <PageWrapper className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dev Journal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily dev logs, architectural decisions, and session retrospectives.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEntryToEdit(null);
            setIsModalOpen(true);
          }}
          className="shadow-sm gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search journal entries by title or markdown content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-44 text-xs"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          {(searchQuery || projectFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setProjectFilter("");
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
        <LoadingState message="Loading journal entries..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEntries} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          title={searchQuery || projectFilter ? "No matching journal entries" : "No dev log entries yet"}
          description={
            searchQuery || projectFilter
              ? "Try adjusting your search terms or project filter."
              : "Record your daily work, retros, and solutions to kill context switching friction."
          }
          actionLabel="Write First Entry"
          onAction={() => {
            setEntryToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([dateLabel, dayEntries]) => (
            <div key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs text-slate-800 tracking-wide uppercase">{dateLabel}</h3>
                <span className="text-[11px] font-mono text-slate-400">({dayEntries.length} entries)</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {dayEntries.map((entry) => (
                  <Card key={entry.id} className="space-y-3 hover:border-slate-300 transition-colors">
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-1">
                      <div>
                        <Link href={`/journal/${entry.id}`}>
                          <CardTitle className="text-base text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1.5">
                            {entry.title || "Untitled Journal Entry"}
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </CardTitle>
                        </Link>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEntryToEdit(entry);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="bg-slate-50/50 p-3.5 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
                        <MarkdownRenderer content={entry.content} />
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center text-[10px] font-medium text-white px-2 py-0.5 rounded-md"
                              style={{ backgroundColor: tag.color }}
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      {entry.project ? (
                        <Link
                          href={`/projects/${entry.project.slug}`}
                          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                        >
                          <FolderGit2 className="w-3.5 h-3.5" />
                          {entry.project.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">General Log</span>
                      )}

                      <Link
                        href={`/journal/${entry.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Read Full Log →
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <JournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEntries}
        entryToEdit={entryToEdit}
        projects={projects}
      />
    </PageWrapper>
  );
}
