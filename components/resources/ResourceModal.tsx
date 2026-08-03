"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { useUIStore } from "@/store/useUIStore";

export interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceToEdit?: any | null;
  projects?: { id: string; name: string }[];
}

export function ResourceModal({
  isOpen,
  onClose,
  onSuccess,
  resourceToEdit,
  projects = [],
}: ResourceModalProps) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [projectId, setProjectId] = useState("");
  const [isRead, setIsRead] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resourceToEdit) {
      setTitle(resourceToEdit.title || "");
      setUrl(resourceToEdit.url || "");
      setDescription(resourceToEdit.description || "");
      setType(resourceToEdit.type || "OTHER");
      setProjectId(resourceToEdit.projectId || "");
      setIsRead(resourceToEdit.isRead || false);
      setSelectedTagIds(resourceToEdit.tags ? resourceToEdit.tags.map((t: any) => t.id) : []);
    } else {
      setTitle("");
      setUrl("");
      setDescription("");
      setType("OTHER");
      setProjectId("");
      setIsRead(false);
      setSelectedTagIds([]);
    }
    setError("");
  }, [resourceToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Resource title is required");
      return;
    }
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        type,
        projectId: projectId || null,
        isRead,
        tagIds: selectedTagIds,
      };

      const endpoint = resourceToEdit ? `/api/resources/${resourceToEdit.id}` : "/api/resources";
      const method = resourceToEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.fields?.url) {
          setError(`URL error: ${data.fields.url.join(", ")}`);
        } else {
          setError(data.error || "Failed to save resource");
        }
        return;
      }

      addToast({
        type: "success",
        message: resourceToEdit ? "Resource updated!" : "Resource added!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resourceToEdit ? "Edit Bookmark Resource" : "Add Bookmark Resource"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Next.js App Router Documentation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="URL"
          type="url"
          placeholder="https://nextjs.org/docs/app"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Summary of this article, video, tool..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { label: "Article", value: "ARTICLE" },
              { label: "Documentation", value: "DOCS" },
              { label: "Video", value: "VIDEO" },
              { label: "Tool", value: "TOOL" },
              { label: "Repository", value: "REPO" },
              { label: "Other", value: "OTHER" },
            ]}
          />

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

        <TagInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} label="Resource Tags" />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isRead"
            checked={isRead}
            onChange={(e) => setIsRead(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <label htmlFor="isRead" className="text-xs font-medium text-slate-700 cursor-pointer">
            Mark as Read
          </label>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {resourceToEdit ? "Save Changes" : "Save Resource"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
