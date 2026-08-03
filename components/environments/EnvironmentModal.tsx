"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/store/useUIStore";

export interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  envToEdit?: any | null;
}

export function EnvironmentModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  envToEdit,
}: EnvironmentModalProps) {
  const { addToast } = useUIStore();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("VERCEL");
  const [type, setType] = useState("DEVELOPMENT");
  const [branch, setBranch] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (envToEdit) {
      setName(envToEdit.name || "");
      setPlatform(envToEdit.platform || "VERCEL");
      setType(envToEdit.type || "DEVELOPMENT");
      setBranch(envToEdit.branch || "");
      setUrl(envToEdit.url || "");
      setNotes(envToEdit.notes || "");
    } else {
      setName("");
      setPlatform("VERCEL");
      setType("DEVELOPMENT");
      setBranch("");
      setUrl("");
      setNotes("");
    }
    setError("");
  }, [envToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Environment name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        projectId,
        name: name.trim(),
        platform,
        type,
        branch: branch.trim() || undefined,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const endpoint = envToEdit ? `/api/environments/${envToEdit.id}` : "/api/environments";
      const method = envToEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save environment");
        return;
      }

      addToast({
        type: "success",
        message: envToEdit ? "Environment updated!" : "Environment created!",
      });
      onSuccess();
      onClose();
    } catch {
      setError("Failed to save environment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={envToEdit ? "Edit Environment" : "Add Environment"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Environment Name"
          placeholder="e.g. Production (Vercel) or Preview — feat/checkout"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            options={[
              { label: "Vercel", value: "VERCEL" },
              { label: "Neon Database", value: "NEON" },
              { label: "Local Container", value: "LOCAL" },
              { label: "Other / Custom", value: "OTHER" },
            ]}
          />

          <Select
            label="Environment Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { label: "Production", value: "PRODUCTION" },
              { label: "Preview", value: "PREVIEW" },
              { label: "Development", value: "DEVELOPMENT" },
            ]}
          />
        </div>

        <Input
          label="Git or Database Branch (Optional)"
          placeholder="e.g. main, feat/checkout, dev-branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        />

        <Input
          label="URL / Endpoint (Optional)"
          placeholder="https://preview.vercel.app or postgres://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <Textarea
          label="Notes (Optional)"
          placeholder="Free text e.g. which Neon branch this Vercel preview points at..."
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
            {envToEdit ? "Save Changes" : "Create Environment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
