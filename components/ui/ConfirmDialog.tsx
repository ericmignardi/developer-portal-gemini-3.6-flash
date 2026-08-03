"use client";

import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useUIStore } from "@/store/useUIStore";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog() {
  const { confirmOptions, closeConfirm } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!confirmOptions) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await confirmOptions.onConfirm();
    } finally {
      setIsLoading(false);
      closeConfirm();
    }
  };

  const isDanger = confirmOptions.variant === "danger" || !confirmOptions.variant;

  return (
    <Modal isOpen={!!confirmOptions} onClose={closeConfirm} maxWidth="sm">
      <div className="flex items-start gap-4">
        <div
          className={`p-2.5 rounded-full shrink-0 ${
            isDanger ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">{confirmOptions.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{confirmOptions.message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
        <Button variant="outline" size="sm" onClick={closeConfirm} disabled={isLoading}>
          {confirmOptions.cancelText || "Cancel"}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          size="sm"
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmOptions.confirmText || "Confirm"}
        </Button>
      </div>
    </Modal>
  );
}
