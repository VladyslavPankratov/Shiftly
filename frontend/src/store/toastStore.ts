import { create } from 'zustand';

// ============================================
// TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastInput {
  type: ToastType;
  title: string;
  message?: string;
  /** Duration in ms. Set to 0 for persistent toast. Default: 5000 */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: ToastInput) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// ============================================
// UTILITIES
// ============================================

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// STORE
// ============================================

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (input) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type: input.type,
      title: input.title,
      message: input.message,
      duration: input.duration ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-dismiss if duration > 0
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', title, message, duration }),

  error: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', title, message, duration }),

  warning: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, duration }),

  info: (title: string, message?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', title, message, duration }),

  dismiss: (id: string) => useToastStore.getState().removeToast(id),

  dismissAll: () => useToastStore.getState().clearAll(),
};
