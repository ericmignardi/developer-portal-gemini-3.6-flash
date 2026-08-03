"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { GoalModal } from "@/components/learning/GoalModal";
import { CourseModal } from "@/components/learning/CourseModal";
import { useUIStore } from "@/store/useUIStore";
import { formatDate } from "@/lib/utils";
import {
  GraduationCap,
  Plus,
  Calendar,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseItem {
  id: string;
  title: string;
  provider?: string;
  url?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  progressPercent: number;
  learningGoalId?: string;
  notes?: string;
  createdAt: string;
}

interface GoalItem {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  progressRollup: number;
  courses: CourseItem[];
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; variant: "success" | "info" | "warning" | "secondary" }> = {
  IN_PROGRESS: { label: "In Progress", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  NOT_STARTED: { label: "Not Started", variant: "secondary" },
  ABANDONED: { label: "Abandoned", variant: "warning" },
};

export default function LearningPage() {
  const { openConfirm, addToast } = useUIStore();

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [unattachedCourses, setUnattachedCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<CourseItem | null>(null);
  const [courseDefaultGoalId, setCourseDefaultGoalId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [gRes, cRes] = await Promise.all([
        fetch("/api/learning/goals"),
        fetch("/api/learning/courses?goalId=none"),
      ]);

      if (!gRes.ok || !cRes.ok) throw new Error("Failed to load learning data");

      setGoals(await gRes.json());
      setUnattachedCourses(await cRes.json());
    } catch (err: any) {
      setError(err.message || "Failed to load learning data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateCourseProgress = async (courseId: string, progressPercent: number) => {
    try {
      const payload: any = { progressPercent };
      if (progressPercent === 100) payload.status = "COMPLETED";

      const res = await fetch(`/api/learning/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGoal = (goal: GoalItem) => {
    openConfirm({
      title: `Delete goal?`,
      message: `Are you sure you want to delete '${goal.title}'? Nested courses will become standalone courses.`,
      confirmText: "Delete Goal",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/learning/goals/${goal.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Goal deleted" });
          fetchData();
        } else {
          addToast({ type: "error", message: "Failed to delete goal" });
        }
      },
    });
  };

  const handleDeleteCourse = (course: CourseItem) => {
    openConfirm({
      title: `Delete course?`,
      message: `Are you sure you want to delete '${course.title}'?`,
      confirmText: "Delete Course",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/learning/courses/${course.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: "Course deleted" });
          fetchData();
        } else {
          addToast({ type: "error", message: "Failed to delete course" });
        }
      },
    });
  };

  const isGoalOverdue = (goal: GoalItem) => {
    if (goal.status === "COMPLETED" || !goal.targetDate) return false;
    return new Date(goal.targetDate).getTime() < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Learning & Growth</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track technical goals and course progress with rolled-up metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCourseToEdit(null);
              setCourseDefaultGoalId("");
              setIsCourseModalOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Course
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
            className="shadow-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingState message="Loading learning goals & courses..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : goals.length === 0 && unattachedCourses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-6 h-6 text-indigo-600" />}
          title="No learning goals or courses created yet"
          description="Set ambitious technology goals (e.g. Master Rust, Web Vitals, Vector Databases) and track course completions."
          actionLabel="Create First Goal"
          onAction={() => {
            setGoalToEdit(null);
            setIsGoalModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-8">
          {/* Learning Goals Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Goals ({goals.length})</h3>

            <div className="grid grid-cols-1 gap-6">
              {goals.map((goal) => {
                const badge = STATUS_BADGES[goal.status] || STATUS_BADGES.NOT_STARTED;
                const overdue = isGoalOverdue(goal);

                return (
                  <Card key={goal.id} className="space-y-4 border-slate-200">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <CardTitle className="text-base">{goal.title}</CardTitle>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {goal.targetDate && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-xs font-mono font-medium",
                                overdue ? "text-rose-600 font-bold" : "text-slate-500"
                              )}
                            >
                              {overdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                              Target: {formatDate(goal.targetDate)}
                            </span>
                          )}
                        </div>

                        {goal.description && (
                          <p className="text-xs text-slate-600 max-w-2xl">{goal.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setCourseToEdit(null);
                            setCourseDefaultGoalId(goal.id);
                            setIsCourseModalOpen(true);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Course
                        </Button>

                        <button
                          onClick={() => {
                            setGoalToEdit(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                          title="Edit Goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Rolled-up Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                            Goal Rollup Progress
                          </span>
                          <span className="font-bold font-mono text-indigo-600 text-sm">{goal.progressRollup}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${goal.progressRollup}%` }}
                          />
                        </div>
                      </div>

                      {/* Nested Courses List */}
                      {goal.courses.length === 0 ? (
                        <div className="p-4 text-center rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                          No courses added to this goal yet. Click &apos;Add Course&apos; above.
                        </div>
                      ) : (
                        <div className="space-y-2.5 pt-2">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Courses ({goal.courses.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-2.5">
                            {goal.courses.map((course) => (
                              <div
                                key={course.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 gap-3 text-xs"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {course.url ? (
                                      <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1"
                                      >
                                        {course.title}
                                        <ExternalLink className="w-3 h-3 text-slate-400" />
                                      </a>
                                    ) : (
                                      <span className="font-semibold text-slate-900">{course.title}</span>
                                    )}
                                    {course.provider && (
                                      <Badge variant="outline" size="sm">
                                        {course.provider}
                                      </Badge>
                                    )}
                                    {course.status === "COMPLETED" && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Completed
                                      </span>
                                    )}
                                  </div>

                                  {course.notes && <p className="text-slate-500 italic text-[11px]">{course.notes}</p>}
                                </div>

                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      value={course.progressPercent}
                                      onChange={(e) =>
                                        handleUpdateCourseProgress(course.id, parseInt(e.target.value) || 0)
                                      }
                                      className="w-24 h-1.5 bg-slate-200 accent-indigo-600 rounded cursor-pointer"
                                    />
                                    <span className="font-mono text-xs font-bold text-slate-700 w-9 text-right">
                                      {course.progressPercent}%
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setCourseToEdit(course);
                                        setCourseDefaultGoalId(goal.id);
                                        setIsCourseModalOpen(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCourse(course)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Standalone Courses Section (PRD §7.9 requirement!) */}
          {unattachedCourses.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Standalone Courses (Unattached) ({unattachedCourses.length})
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {unattachedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 gap-3 text-xs shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        {course.url ? (
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {course.title}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        ) : (
                          <span className="font-semibold text-slate-900">{course.title}</span>
                        )}
                        {course.provider && (
                          <Badge variant="outline" size="sm">
                            {course.provider}
                          </Badge>
                        )}
                      </div>

                      {course.notes && <p className="text-slate-500 italic text-[11px]">{course.notes}</p>}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={course.progressPercent}
                          onChange={(e) =>
                            handleUpdateCourseProgress(course.id, parseInt(e.target.value) || 0)
                          }
                          className="w-24 h-1.5 bg-slate-200 accent-indigo-600 rounded cursor-pointer"
                        />
                        <span className="font-mono text-xs font-bold text-slate-700 w-9 text-right">
                          {course.progressPercent}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCourseToEdit(course);
                            setCourseDefaultGoalId("");
                            setIsCourseModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSuccess={fetchData}
        goalToEdit={goalToEdit}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={fetchData}
        courseToEdit={courseToEdit}
        goals={goals.map((g) => ({ id: g.id, title: g.title }))}
        defaultGoalId={courseDefaultGoalId}
      />
    </PageWrapper>
  );
}
