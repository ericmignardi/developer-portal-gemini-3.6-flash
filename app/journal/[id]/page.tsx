"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { JournalModal } from "@/components/journal/JournalModal";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { useUIStore } from "@/store/useUIStore";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Calendar, FolderGit2, Edit2, Trash2 } from "lucide-react";

interface PageParams {
  id: string;
}

export default function JournalDetailPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { openConfirm, addToast } = useUIStore();

  const [entry, setEntry] = useState<any | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/journal/${resolvedParams.id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Journal entry not found");
        throw new Error("Failed to load journal entry");
      }

      setEntry(await res.json());
    } catch (err: any) {
      setError(err.message || "Failed to load journal entry");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

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
    fetchEntry();
  }, [fetchEntry]);

  const handleDelete = () => {
    if (!entry) return;
    openConfirm({
      title: `Delete journal entry?`,
      message: `Are you sure you want to delete this journal entry from ${formatDate(entry.entryDate)}?`,
      confirmText: "Delete Entry",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/journal/${entry.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Journal entry deleted" });
          router.push("/journal");
        } else {
          addToast({ type: "error", message: "Failed to delete entry" });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <LoadingState message="Loading entry..." />
      </PageWrapper>
    );
  }

  if (error || !entry) {
    return (
      <PageWrapper>
        <ErrorState message={error || "Entry not found"} onRetry={fetchEntry} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dev Journal
      </Link>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">
              {entry.title || "Untitled Journal Entry"}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {formatDate(entry.entryDate)}
              </span>
              {entry.project && (
                <Link
                  href={`/projects/${entry.project.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  {entry.project.name}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit Raw
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-0.5 rounded-md text-xs font-medium text-white shadow-2xs"
                  style={{ backgroundColor: tag.color }}
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Rendered Markdown Body */}
          <div className="pt-2">
            <MarkdownRenderer content={entry.content} />
          </div>
        </CardContent>
      </Card>

      <JournalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchEntry}
        entryToEdit={entry}
        projects={projects}
      />
    </PageWrapper>
  );
}
