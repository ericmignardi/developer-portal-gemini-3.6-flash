"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/useUIStore";

export interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseToEdit?: any | null;
  goals?: { id: string; title: string }[];
  defaultGoalId?: string;
}

export function CourseModal({
  isOpen,
  onClose,
  onSuccess,
  courseToEdit,
  goals = [],
  defaultGoalId = "",
}: CourseModalProps) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("NOT_STARTED");
  const [progressPercent, setProgressPercent] = useState(0);
  const [learningGoalId, setLearningGoalId] = useState(defaultGoalId);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title || "");
      setProvider(courseToEdit.provider || "");
      setUrl(courseToEdit.url || "");
      setStatus(courseToEdit.status || "NOT_STARTED");
      setProgressPercent(courseToEdit.progressPercent || 0);
      setLearningGoalId(courseToEdit.learningGoalId || "");
      setNotes(courseToEdit.notes || "");
    } else {
      setTitle("");
      setProvider("");
      setUrl("");
      setStatus("NOT_STARTED");
      setProgressPercent(0);
      setLearningGoalId(defaultGoalId || "");
      setNotes("");
    }
    setError("");
  }, [courseToEdit, isOpen, defaultGoalId]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === "COMPLETED") {
      setProgressPercent(100);
    }
  };

  const handleProgressChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setProgressPercent(clamped);
    if (clamped === 100) {
      setStatus("COMPLETED");
    } else if (clamped > 0 && status === "NOT_STARTED") {
      setStatus("IN_PROGRESS");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Course title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        title: title.trim(),
        provider: provider.trim() || undefined,
        url: url.trim() || undefined,
        status,
        progressPercent,
        learningGoalId: learningGoalId || null,
        notes: notes.trim() || undefined,
      };

      const endpoint = courseToEdit ? `/api/learning/courses/${courseToEdit.id}` : "/api/learning/courses";
      const method = courseToEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save course");
        return;
      }

      addToast({
        type: "success",
        message: courseToEdit ? "Course updated!" : "Course added!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save course");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={courseToEdit ? "Edit Course" : "Add Course"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Course Title"
          placeholder="e.g. Ultimate Rust Foundations"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Provider / Platform"
            placeholder="e.g. Frontend Masters, Udemy, Coursera"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          />

          <Input
            label="URL (Optional)"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Learning Goal Association"
            value={learningGoalId}
            onChange={(e) => setLearningGoalId(e.target.value)}
          >
            <option value="">No Goal (Standalone Course)</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Select>

          <Select
            label="Status"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={[
              { label: "Not Started", value: "NOT_STARTED" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Abandoned", value: "ABANDONED" },
            ]}
          />
        </div>

        {/* Progress percent slider & number input */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Progress ({progressPercent}%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={progressPercent}
              onChange={(e) => handleProgressChange(parseInt(e.target.value) || 0)}
              className="w-20 text-center h-7 text-xs"
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent}
            onChange={(e) => handleProgressChange(parseInt(e.target.value) || 0)}
            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <Textarea
          label="Notes / Reflections"
          placeholder="Key takeaways, chapter notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {courseToEdit ? "Save Changes" : "Save Course"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
