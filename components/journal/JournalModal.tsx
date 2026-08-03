"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { useUIStore } from "@/store/useUIStore";

export interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entryToEdit?: any | null;
  projects?: { id: string; name: string }[];
}

export function JournalModal({
  isOpen,
  onClose,
  onSuccess,
  entryToEdit,
  projects = [],
}: JournalModalProps) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (entryToEdit) {
      setTitle(entryToEdit.title || "");
      setContent(entryToEdit.content || "");
      setEntryDate(
        entryToEdit.entryDate
          ? new Date(entryToEdit.entryDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setProjectId(entryToEdit.projectId || "");
      setSelectedTagIds(entryToEdit.tags ? entryToEdit.tags.map((t: any) => t.id) : []);
    } else {
      setTitle("");
      setContent("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setProjectId("");
      setSelectedTagIds([]);
    }
    setError("");
  }, [entryToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Journal content is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        title: title.trim() || undefined,
        content: content.trim(),
        entryDate: entryDate ? new Date(entryDate).toISOString() : new Date().toISOString(),
        projectId: projectId || null,
        tagIds: selectedTagIds,
      };

      const url = entryToEdit ? `/api/journal/${entryToEdit.id}` : "/api/journal";
      const method = entryToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save journal entry");
        return;
      }

      addToast({
        type: "success",
        message: entryToEdit ? "Journal entry updated!" : "Journal entry saved!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save journal entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? "Edit Journal Entry" : "New Journal Entry"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Title (Optional)"
            placeholder="e.g. Database Migration & Query Fix"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <Input
            label="Entry Date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>

        <Textarea
          label="Content (Raw Markdown)"
          placeholder="Write your session log, architectural decisions, technical notes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="font-mono text-xs"
          required
        />

        <Select
          label="Associated Project (Optional)"
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

        <TagInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} label="Entry Tags" />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {entryToEdit ? "Save Changes" : "Save Entry"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
