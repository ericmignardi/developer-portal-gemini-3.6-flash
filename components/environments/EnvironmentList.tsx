"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/useUIStore";
import {
  ExternalLink,
  Copy,
  Check,
  Globe,
  Database,
  Terminal,
  Server,
  Plus,
  Edit2,
  Trash2,
  GitBranch,
} from "lucide-react";
import { EnvironmentModal } from "./EnvironmentModal";

export interface EnvironmentItem {
  id: string;
  projectId: string;
  name: string;
  platform: "VERCEL" | "NEON" | "LOCAL" | "OTHER";
  type: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT";
  branch?: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export interface EnvironmentListProps {
  projectId: string;
  environments: EnvironmentItem[];
  onRefresh: () => void;
}

const PLATFORM_ICONS: Record<string, { icon: any; color: string }> = {
  VERCEL: { icon: Globe, color: "text-slate-900 bg-slate-100" },
  NEON: { icon: Database, color: "text-emerald-600 bg-emerald-50" },
  LOCAL: { icon: Terminal, color: "text-indigo-600 bg-indigo-50" },
  OTHER: { icon: Server, color: "text-amber-600 bg-amber-50" },
};

const TYPE_GROUPS = [
  { type: "PRODUCTION", label: "Production", badgeVariant: "success" as const },
  { type: "PREVIEW", label: "Preview Deployments", badgeVariant: "info" as const },
  { type: "DEVELOPMENT", label: "Development / Local", badgeVariant: "secondary" as const },
];

export function EnvironmentList({ projectId, environments, onRefresh }: EnvironmentListProps) {
  const { openConfirm, addToast } = useUIStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [envToEdit, setEnvToEdit] = useState<EnvironmentItem | null>(null);

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      addToast({ type: "success", message: "URL copied to clipboard!" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast({ type: "error", message: "Failed to copy URL" });
    }
  };

  const handleDelete = (env: EnvironmentItem) => {
    openConfirm({
      title: `Delete ${env.name}?`,
      message: `Are you sure you want to remove environment '${env.name}'?`,
      confirmText: "Delete Environment",
      variant: "danger",
      onConfirm: async () => {
        const res = await fetch(`/api/environments/${env.id}`, { method: "DELETE" });
        if (res.ok) {
          addToast({ type: "success", message: `Deleted ${env.name}` });
          onRefresh();
        } else {
          addToast({ type: "error", message: "Failed to delete environment" });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Environments</h3>
          <p className="text-xs text-slate-500">
            Deployments, Neon database branches, and development endpoints.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEnvToEdit(null);
            setIsModalOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Environment
        </Button>
      </div>

      {environments.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <Server className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No environments added yet</p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
            Track Vercel preview links, Neon database branches, and local ports for this project.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEnvToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Add First Environment
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPE_GROUPS.map((group) => {
            const groupEnvs = environments.filter((e) => e.type === group.type);
            if (groupEnvs.length === 0) return null;

            return (
              <div key={group.type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={group.badgeVariant} size="sm">
                    {group.label}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">({groupEnvs.length})</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupEnvs.map((env) => {
                    const PlatformInfo = PLATFORM_ICONS[env.platform] || PLATFORM_ICONS.OTHER;
                    const Icon = PlatformInfo.icon;

                    return (
                      <div
                        key={env.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs gap-3 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2.5 rounded-lg shrink-0 ${PlatformInfo.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-900">{env.name}</span>
                              <Badge variant="outline" size="sm" className="font-mono">
                                {env.platform}
                              </Badge>
                              {env.branch && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  <GitBranch className="w-3 h-3 text-slate-400" />
                                  {env.branch}
                                </span>
                              )}
                            </div>

                            {env.url && (
                              <div className="flex items-center gap-2 font-mono text-xs text-indigo-600 truncate">
                                <a
                                  href={env.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline flex items-center gap-1 truncate"
                                >
                                  {env.url}
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>

                                <button
                                  onClick={() => handleCopyUrl(env.id, env.url!)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0"
                                  title="Copy URL"
                                >
                                  {copiedId === env.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}

                            {env.notes && (
                              <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{env.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => {
                              setEnvToEdit(env);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit Environment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(env)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                            title="Delete Environment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        projectId={projectId}
        envToEdit={envToEdit}
      />
    </div>
  );
}
