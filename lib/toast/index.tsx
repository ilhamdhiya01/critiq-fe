import hotToast from "react-hot-toast";

import type { ToastOptions, ToastVariant } from "./toast.config";
import { TOAST_DURATIONS } from "./toast.config";
import ToastCard from "./ToastCard";

export type { ToastAction, ToastOptions } from "./toast.config";

const showToast = (
  variant: ToastVariant,
  title: string,
  options?: ToastOptions,
): string =>
  hotToast.custom(
    (t) => (
      <ToastCard
        t={t}
        variant={variant}
        title={title}
        description={options?.description}
        action={options?.action}
      />
    ),
    { duration: TOAST_DURATIONS[variant] },
  );

const promise = async <T,>(
  pending: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error?: string | ((error: Error) => string);
  },
): Promise<T> => {
  const loadingId = showToast("loading", messages.loading);
  try {
    const data = await pending;
    hotToast.dismiss(loadingId);
    const successTitle =
      typeof messages.success === "function"
        ? messages.success(data)
        : messages.success;
    showToast("success", successTitle);
    return data;
  } catch (error) {
    hotToast.dismiss(loadingId);
    const errorTitle =
      typeof messages.error === "function"
        ? messages.error(error as Error)
        : (messages.error ?? "Something went wrong");
    showToast("error", errorTitle);
    throw error;
  }
};

export const toast = {
  success: (title: string, options?: ToastOptions) =>
    showToast("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    showToast("error", title, options),
  warning: (title: string, options?: ToastOptions) =>
    showToast("warning", title, options),
  info: (title: string, options?: ToastOptions) =>
    showToast("info", title, options),
  promise,
  dismiss: hotToast.dismiss,
  loading: (title: string, options?: ToastOptions) =>
    showToast("loading", title, options),
};
