"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { useUIStore } from "@/store/useUIStore";

export interface SnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  snippetToEdit?: any | null;
  projects?: { id: string; name: string }[];
}

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "sql",
  "bash",
  "css",
  "html",
  "yaml",
  "json",
  "rust",
  "go",
];

export function SnippetModal({
  isOpen,
  onClose,
  onSuccess,
  snippetToEdit,
  projects = [],
}: SnippetModalProps) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [code, setCode] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (snippetToEdit) {
      setTitle(snippetToEdit.title || "");
      setDescription(snippetToEdit.description || "");
      setLanguage(snippetToEdit.language || "typescript");
      setCode(snippetToEdit.code || "");
      setProjectId(snippetToEdit.projectId || "");
      setIsFavorite(snippetToEdit.isFavorite || false);
      setSelectedTagIds(snippetToEdit.tags ? snippetToEdit.tags.map((t: any) => t.id) : []);
    } else {
      setTitle("");
      setDescription("");
      setLanguage("typescript");
      setCode("");
      setProjectId("");
      setIsFavorite(false);
      setSelectedTagIds([]);
    }
    setError("");
  }, [snippetToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Snippet title is required");
      return;
    }
    if (!code.trim()) {
      setError("Code content is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        language,
        code: code.trim(),
        projectId: projectId || null,
        isFavorite,
        tagIds: selectedTagIds,
      };

      const url = snippetToEdit ? `/api/snippets/${snippetToEdit.id}` : "/api/snippets";
      const method = snippetToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save snippet");
        return;
      }

      addToast({
        type: "success",
        message: snippetToEdit ? "Snippet updated!" : "Snippet created!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save snippet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={snippetToEdit ? "Edit Snippet" : "Create New Snippet"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Snippet Title"
          placeholder="e.g. Prisma Singleton Client for Next.js App Router"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Textarea
          label="Description (Optional)"
          placeholder="What does this snippet do or solve?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </Select>

          <Select
            label="Project Association (Optional)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No Project (Standalone)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Code Content"
          placeholder="Paste code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={7}
          className="font-mono text-xs"
          required
        />

        <TagInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} label="Snippet Tags" />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isFavorite"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <label htmlFor="isFavorite" className="text-xs font-medium text-slate-700 cursor-pointer">
            Mark as Favorite Snippet
          </label>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {snippetToEdit ? "Save Changes" : "Create Snippet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
