import type { IconName } from "@/components/ui/icon/Icon";

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  description?: string;
  action?: ToastAction;
}

export const TOAST_DURATIONS: Record<ToastVariant, number> = {
  success: 3500,
  info: 4000,
  warning: 6000,
  error: 7000,
  loading: Infinity,
};

export const TOAST_ICONS: Record<ToastVariant, IconName> = {
  success: "TbCheck",
  error: "TbAlertCircle",
  warning: "TbAlertTriangle",
  info: "TbInfoCircle",
  loading: "TbLoader2",
};
