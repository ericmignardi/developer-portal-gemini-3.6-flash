import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

interface UIStore {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Toast state
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;

  // Confirm dialog state
  confirmOptions: ConfirmDialogOptions | null;
  openConfirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;

  // Quick Add modal state
  quickAddOpen: boolean;
  quickAddDefaultTab: "task" | "journal";
  openQuickAdd: (tab?: "task" | "journal") => void;
  closeQuickAdd: () => void;

  // Tasks view mode preference
  taskViewMode: "board" | "list";
  setTaskViewMode: (mode: "board" | "list") => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        setTimeout(() => {
          set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
      },
      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      confirmOptions: null,
      openConfirm: (options) => set({ confirmOptions: options }),
      closeConfirm: () => set({ confirmOptions: null }),

      quickAddOpen: false,
      quickAddDefaultTab: "task",
      openQuickAdd: (tab = "task") => set({ quickAddOpen: true, quickAddDefaultTab: tab }),
      closeQuickAdd: () => set({ quickAddOpen: false }),

      taskViewMode: "board",
      setTaskViewMode: (mode) => set({ taskViewMode: mode }),
    }),
    {
      name: "atlas-ui-settings",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        taskViewMode: state.taskViewMode,
      }),
    }
  )
);
