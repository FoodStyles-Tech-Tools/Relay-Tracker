import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast event system
let toastId = 0;
const listeners: Set<(toast: ToastData) => void> = new Set();
const removeListeners: Set<(id: string) => void> = new Set();

export function showToast(toast: Omit<ToastData, 'id'>) {
  const id = `toast-${++toastId}`;
  const fullToast: ToastData = { ...toast, id };
  listeners.forEach(listener => listener(fullToast));
  return id;
}

export function removeToast(id: string) {
  removeListeners.forEach(listener => listener(id));
}

export function subscribeToToasts(
  onAdd: (toast: ToastData) => void,
  onRemove: (id: string) => void
) {
  listeners.add(onAdd);
  removeListeners.add(onRemove);

  return () => {
    listeners.delete(onAdd);
    removeListeners.delete(onRemove);
  };
}

// Hook for managing toasts - defined here to avoid fast refresh issues
export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts(
      (toast) => setToasts(prev => [...prev, toast]),
      (id) => setToasts(prev => prev.filter(t => t.id !== id))
    );

    return unsubscribe;
  }, []);

  const remove = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, remove };
}
