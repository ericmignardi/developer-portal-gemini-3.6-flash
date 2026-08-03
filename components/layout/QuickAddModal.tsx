"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useUIStore } from "@/store/useUIStore";
import { CheckSquare, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectOption {
  id: string;
  name: string;
}

export function QuickAddModal() {
  const { quickAddOpen, quickAddDefaultTab, closeQuickAdd, addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<"task" | "journal">("task");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [journalProjectId, setJournalProjectId] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (quickAddOpen) {
      setActiveTab(quickAddDefaultTab);
      fetchProjects();
    }
  }, [quickAddOpen, quickAddDefaultTab]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setError("Task title is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || undefined,
          priority: taskPriority,
          projectId: taskProjectId || undefined,
          dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create task");
        return;
      }

      addToast({ type: "success", message: "Task created successfully!" });
      resetForms();
      closeQuickAdd();
    } catch {
      setError("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) {
      setError("Journal content is required");
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: journalTitle.trim() || undefined,
          content: journalContent.trim(),
          projectId: journalProjectId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create journal entry");
        return;
      }

      addToast({ type: "success", message: "Journal entry created successfully!" });
      resetForms();
      closeQuickAdd();
    } catch {
      setError("Failed to create journal entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForms = () => {
    setTaskTitle("");
    setTaskDesc("");
    setTaskPriority("MEDIUM");
    setTaskProjectId("");
    setTaskDueDate("");
    setJournalTitle("");
    setJournalContent("");
    setJournalProjectId("");
    setError("");
  };

  return (
    <Modal isOpen={quickAddOpen} onClose={closeQuickAdd} title="Quick Add" maxWidth="lg">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("task");
            setError("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors",
            activeTab === "task"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <CheckSquare className="w-4 h-4" />
          Task
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("journal");
            setError("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors",
            activeTab === "journal"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Journal Entry
        </button>
      </div>

      {activeTab === "task" ? (
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Implement webhook retry logic"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Details, acceptance criteria..."
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Priority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              options={[
                { label: "Low", value: "LOW" },
                { label: "Medium", value: "MEDIUM" },
                { label: "High", value: "HIGH" },
                { label: "Urgent", value: "URGENT" },
              ]}
            />

            <Select
              label="Project (Optional)"
              value={taskProjectId}
              onChange={(e) => setTaskProjectId(e.target.value)}
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>

            <Input
              label="Due Date (Optional)"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={closeQuickAdd}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create Task
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJournalSubmit} className="space-y-4">
          <Input
            label="Title (Optional)"
            placeholder="e.g. Debugging Stripe session timeout"
            value={journalTitle}
            onChange={(e) => setJournalTitle(e.target.value)}
            autoFocus
          />

          <Textarea
            label="Journal Content (Markdown)"
            placeholder="Write what you accomplished, notes, code snippets..."
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            rows={5}
            required
          />

          <Select
            label="Associated Project (Optional)"
            value={journalProjectId}
            onChange={(e) => setJournalProjectId(e.target.value)}
          >
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={closeQuickAdd}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Save Entry
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
