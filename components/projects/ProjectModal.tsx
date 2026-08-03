"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { useUIStore } from "@/store/useUIStore";
import { X, Plus } from "lucide-react";

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: any | null;
}

export function ProjectModal({ isOpen, onClose, onSuccess, projectToEdit }: ProjectModalProps) {
  const { addToast } = useUIStore();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || "");
      setClient(projectToEdit.client || "");
      setDescription(projectToEdit.description || "");
      setStatus(projectToEdit.status || "ACTIVE");
      setRepoUrl(projectToEdit.repoUrl || "");
      setLiveUrl(projectToEdit.liveUrl || "");
      setTechStack(projectToEdit.techStack || []);
      setSelectedTagIds(projectToEdit.tags ? projectToEdit.tags.map((t: any) => t.id) : []);
      setIsPinned(projectToEdit.isPinned || false);
    } else {
      setName("");
      setClient("");
      setDescription("");
      setStatus("ACTIVE");
      setRepoUrl("");
      setLiveUrl("");
      setTechStack([]);
      setSelectedTagIds([]);
      setIsPinned(false);
    }
    setError("");
  }, [projectToEdit, isOpen]);

  const addTechChip = () => {
    const trimmed = techInput.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
      setTechInput("");
    }
  };

  const removeTechChip = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        name: name.trim(),
        client: client.trim() || undefined,
        description: description.trim() || undefined,
        status,
        repoUrl: repoUrl.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
        techStack,
        tagIds: selectedTagIds,
        isPinned,
      };

      const url = projectToEdit ? `/api/projects/${projectToEdit.id}` : "/api/projects";
      const method = projectToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save project");
        return;
      }

      addToast({
        type: "success",
        message: projectToEdit ? "Project updated successfully!" : "Project created successfully!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("An error occurred while saving the project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? "Edit Project" : "Create New Project"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Project Name"
            placeholder="e.g. Pulse Analytics"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Client / Organization"
            placeholder="e.g. Acme Corp"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>

        <Textarea
          label="Description (Markdown supported)"
          placeholder="Brief description of what this client project does..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Active", value: "ACTIVE" },
              { label: "Idea", value: "IDEA" },
              { label: "Paused", value: "PAUSED" },
              { label: "Shipped", value: "SHIPPED" },
              { label: "Archived", value: "ARCHIVED" },
            ]}
          />

          <Input
            label="GitHub Repo URL"
            placeholder="https://github.com/org/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
          />

          <Input
            label="Live Production URL"
            placeholder="https://app.example.com"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
          />
        </div>

        {/* Tech Stack Chips */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Tech Stack Technologies
          </label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add tech (e.g. Next.js, Prisma, FastAPI)"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTechChip();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTechChip} className="shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {tech}
                  <button type="button" onClick={() => removeTechChip(tech)} className="hover:text-slate-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <TagInput selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} label="Project Tags" />

        {/* Pin toggle */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPinned"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <label htmlFor="isPinned" className="text-xs font-medium text-slate-700 cursor-pointer">
            Pin project to Dashboard
          </label>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {projectToEdit ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
