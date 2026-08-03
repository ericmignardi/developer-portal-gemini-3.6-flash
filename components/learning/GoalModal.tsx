"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/useUIStore";

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goalToEdit?: any | null;
}

export function GoalModal({ isOpen, onClose, onSuccess, goalToEdit }: GoalModalProps) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("NOT_STARTED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || "");
      setDescription(goalToEdit.description || "");
      setTargetDate(
        goalToEdit.targetDate ? new Date(goalToEdit.targetDate).toISOString().split("T")[0] : ""
      );
      setStatus(goalToEdit.status || "NOT_STARTED");
    } else {
      setTitle("");
      setDescription("");
      setTargetDate("");
      setStatus("NOT_STARTED");
    }
    setError("");
  }, [goalToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Goal title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        status,
      };

      const url = goalToEdit ? `/api/learning/goals/${goalToEdit.id}` : "/api/learning/goals";
      const method = goalToEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save goal");
        return;
      }

      addToast({
        type: "success",
        message: goalToEdit ? "Learning goal updated!" : "Learning goal created!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? "Edit Learning Goal" : "New Learning Goal"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Goal Title"
          placeholder="e.g. Master Rust for Systems & WebAssembly"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Textarea
          label="Description / Motivation"
          placeholder="Why are you pursuing this goal?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: "Not Started", value: "NOT_STARTED" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "COMPLETED" },
              { label: "Abandoned", value: "ABANDONED" },
            ]}
          />

          <Input
            label="Target Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            {goalToEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
