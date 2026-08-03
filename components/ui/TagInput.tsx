"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

export interface TagInputProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  label?: string;
  error?: string;
}

const DEFAULT_COLORS = [
  "#6366f1", // Indigo
  "#06b6d4", // Cyan
  "#3178c6", // TS Blue
  "#2d3748", // Slate
  "#336791", // Postgres
  "#00e599", // Neon Green
  "#171717", // Dark Slate
  "#38bdf8", // Sky
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#10b981", // Emerald
];

export function TagInput({ selectedTagIds, onChange, label, error }: TagInputProps) {
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (e) {
      console.error("Failed to load tags", e);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim().toLowerCase();
    if (!trimmed) return;

    if (availableTags.some((t) => t.name.toLowerCase() === trimmed)) {
      setCreateError("Tag already exists");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError("");
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, color: newTagColor }),
      });

      if (!res.ok) {
        const err = await res.json();
        setCreateError(err.error || "Failed to create tag");
        return;
      }

      const created = await res.json();
      setAvailableTags((prev) => [...prev, created]);
      onChange([...selectedTagIds, created.id]);
      setNewTagName("");
      setIsCreating(false);
    } catch {
      setCreateError("Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-white min-h-[42px]">
        {availableTags
          .filter((t) => selectedTagIds.includes(t.id))
          .map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white shadow-2xs transition-transform active:scale-95"
              style={{ backgroundColor: tag.color }}
            >
              #{tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="hover:opacity-80 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

        {availableTags.length === 0 && !isCreating && (
          <span className="text-xs text-slate-400">No tags created yet.</span>
        )}

        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Tag
          </button>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap p-1 bg-slate-50 border border-slate-200 rounded-md w-full mt-1">
            <input
              type="text"
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="h-7 px-2 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
              autoFocus
            />
            <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] p-0.5">
              {DEFAULT_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  className={cn(
                    "w-4 h-4 rounded-full border shrink-0 transition-transform",
                    newTagColor === c ? "scale-125 border-slate-900 shadow-2xs" : "border-transparent opacity-80"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isSubmitting || !newTagName.trim()}
              className="h-7 px-2 text-xs bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setCreateError("");
              }}
              className="h-7 px-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {createError && <p className="text-xs text-rose-600 font-medium">{createError}</p>}
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Available tags dropdown / selector pill options */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="text-[11px] font-medium text-slate-400 self-center mr-1">Available:</span>
          {availableTags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-all border",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 opacity-90 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
