"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { TaskModal } from "@/components/tasks/TaskModal";
import { useUIStore } from "@/store/useUIStore";
import { formatDate } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Clock,
  AlertCircle,
  FolderGit2,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  projectId?: string;
  project?: { id: string; name: string; slug: string };
  order: number;
  createdAt: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; variant: "danger" | "warning" | "info" | "secondary" }> = {
  URGENT: { label: "Urgent", variant: "danger" },
  HIGH: { label: "High", variant: "warning" },
  MEDIUM: { label: "Medium", variant: "info" },
  LOW: { label: "Low", variant: "secondary" },
};

const COLUMNS: { id: TaskItem["status"]; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "BLOCKED", title: "Blocked" },
  { id: "DONE", title: "Done" },
];

export default function TasksPage() {
  const { taskViewMode, setTaskViewMode, openConfirm, addToast } = useUIStore();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt">("dueDate");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [createDefaultStatus, setCreateDefaultStatus] = useState("TODO");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (projectFilter) params.append("projectId", projectFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tasks");

      const data: TaskItem[] = await res.json();

      // Client sort
      const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      data.sort((a, b) => {
        if (sortBy === "priority") {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectFilter, statusFilter, priorityFilter, sortBy]);

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
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (task: TaskItem, newStatus: TaskItem["status"]) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        addToast({ type: "success", message: `Updated '${task.title}' to ${newStatus.replace("_", " ")}` });
        fetchTasks();
      } else {
        fetchTasks(); // revert on failure
      }
    } catch {
      fetchTasks();
    }
  };

  const handleDeleteTask = (task: TaskItem) => {
    openConfirm({
      title: `Delete task?`,
      message: `Are you sure you want to delete '${task.title}'?`,
      confirmText: "Delete Task",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Task deleted" });
          fetchTasks();
        } else {
          addToast({ type: "error", message: "Failed to delete task" });
        }
      },
    });
  };

  const isOverdue = (task: TaskItem) => {
    if (task.status === "DONE" || !task.dueDate) return false;
    return new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your project to-dos, priorities, and status workflow.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-lg">
            <button
              onClick={() => setTaskViewMode("board")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                taskViewMode === "board"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setTaskViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                taskViewMode === "list"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ListIcon className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTaskToEdit(null);
              setCreateDefaultStatus("TODO");
              setIsModalOpen(true);
            }}
            className="shadow-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </Select>

          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-36 text-xs"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-36 text-xs"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="createdAt">Created Date</option>
          </Select>

          {(projectFilter || statusFilter || priorityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProjectFilter("");
                setStatusFilter("");
                setPriorityFilter("");
              }}
              className="text-xs text-slate-500"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <LoadingState message="Loading tasks..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6 text-indigo-600" />}
          title={projectFilter || statusFilter || priorityFilter ? "No matching tasks found" : "No tasks created yet"}
          description={
            projectFilter || statusFilter || priorityFilter
              ? "Try clearing your filters to see more tasks."
              : "Keep track of outstanding bugs, features, and chores across your client apps."
          }
          actionLabel="Create Task"
          onAction={() => {
            setTaskToEdit(null);
            setCreateDefaultStatus("TODO");
            setIsModalOpen(true);
          }}
        />
      ) : taskViewMode === "board" ? (
        /* Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div key={col.id} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{col.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTaskToEdit(null);
                      setCreateDefaultStatus(col.id);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colTasks.map((task) => {
                    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                    const overdue = isOverdue(task);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "p-4 rounded-xl border bg-white shadow-2xs hover:shadow-md transition-all space-y-3",
                          overdue ? "border-rose-300 bg-rose-50/20" : "border-slate-200/80"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("text-xs font-semibold text-slate-900 leading-snug", task.status === "DONE" && "line-through text-slate-400")}>
                            {task.title}
                          </h4>
                          <Badge variant={priority.variant} size="sm">
                            {priority.label}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}

                        {task.project && (
                          <Link
                            href={`/projects/${task.project.slug}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:underline"
                          >
                            <FolderGit2 className="w-3 h-3" />
                            {task.project.name}
                          </Link>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                          {task.dueDate ? (
                            <span
                              className={cn(
                                "flex items-center gap-1 font-mono font-medium",
                                overdue ? "text-rose-600 font-bold" : "text-slate-500"
                              )}
                            >
                              {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">No due date</span>
                          )}

                          <div className="flex items-center gap-1">
                            <Select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value as any)}
                              className="h-6 text-[10px] px-1.5 py-0 bg-slate-50"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="BLOCKED">Blocked</option>
                              <option value="DONE">Done</option>
                            </Select>

                            <button
                              onClick={() => {
                                setTaskToEdit(task);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-50/80 transition-colors",
                    overdue && "bg-rose-50/20"
                  )}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      onClick={() =>
                        handleStatusChange(task, task.status === "DONE" ? "TODO" : "DONE")
                      }
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-colors",
                        task.status === "DONE"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 hover:border-indigo-500"
                      )}
                    >
                      {task.status === "DONE" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "font-semibold text-xs text-slate-900",
                            task.status === "DONE" && "line-through text-slate-400"
                          )}
                        >
                          {task.title}
                        </span>
                        <Badge variant={priority.variant} size="sm">
                          {priority.label}
                        </Badge>
                        {task.project && (
                          <Link
                            href={`/projects/${task.project.slug}`}
                            className="text-[11px] font-medium text-indigo-600 hover:underline"
                          >
                            @{task.project.name}
                          </Link>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xl">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {task.dueDate && (
                      <span
                        className={cn(
                          "text-xs font-mono flex items-center gap-1",
                          overdue ? "text-rose-600 font-bold" : "text-slate-500"
                        )}
                      >
                        {overdue && <AlertCircle className="w-3.5 h-3.5" />}
                        {formatDate(task.dueDate)}
                      </span>
                    )}

                    <Select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as any)}
                      className="h-8 text-xs w-32"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DONE">Done</option>
                    </Select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTaskToEdit(task);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
        projects={projects}
        defaultStatus={createDefaultStatus}
      />
    </PageWrapper>
  );
}
