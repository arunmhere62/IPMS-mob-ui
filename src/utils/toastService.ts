export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastPayload = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastHandler = (payload: ToastPayload) => void;

let handler: ToastHandler | null = null;

export const setToastHandler = (next: ToastHandler | null) => {
  handler = next;
};

export const showToast = (payload: ToastPayload): boolean => {
  if (!handler) return false;
  handler(payload);
  return true;
};
