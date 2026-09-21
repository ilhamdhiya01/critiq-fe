import classNames from "classnames";
import { useEffect, useState } from "react";
import type { Toast } from "react-hot-toast";
import toastLib from "react-hot-toast";

import Icon from "@/components/ui/icon/Icon";

import type { ToastAction, ToastVariant } from "./toast.config";
import { TOAST_ICONS } from "./toast.config";

interface ToastCardProps {
  t: Toast;
  variant: ToastVariant;
  title: string;
  description?: string;
  action?: ToastAction;
}

const ToastCard = ({
  t,
  variant,
  title,
  description,
  action,
}: ToastCardProps) => {
  // Mount dulu di state hidden, baru transisikan ke visible di effect
  // berikutnya — kalau class visible langsung dipasang saat mount, browser
  // tidak sempat commit paint pertama sehingga transition CSS tidak jalan
  // (toast muncul snap, bukan fade/slide smooth).
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isVisible = entered && t.visible;

  const accentBarClass = classNames(
    "absolute inset-y-0 left-0 w-[2px] rounded-l-lg",
    {
      "bg-success": variant === "success",
      "bg-danger": variant === "error",
      "bg-warning": variant === "warning",
      "bg-info": variant === "info" || variant === "loading",
    },
  );

  const iconWrapClass = classNames(
    "flex h-6 w-6 flex-none items-center justify-center rounded-full border",
    {
      "border-success/30 bg-success/10 text-success": variant === "success",
      "border-danger/30 bg-danger/10 text-danger": variant === "error",
      "border-warning/30 bg-warning/10 text-warning": variant === "warning",
      "border-info/30 bg-info/10 text-info":
        variant === "info" || variant === "loading",
    },
  );

  const cardClass = classNames(
    "relative flex w-[360px] items-start gap-3 rounded-lg border border-border-default bg-raised p-4 pr-9 shadow-lg transition-all duration-300 ease-out",
    {
      "translate-y-0 opacity-100": isVisible,
      "-translate-y-2 opacity-0": !isVisible,
    },
  );

  const handleDismiss = () => toastLib.dismiss(t.id);

  return (
    <div role="status" onClick={handleDismiss} className={cardClass}>
      <span className={accentBarClass} />
      <span className={iconWrapClass}>
        <Icon
          icon={TOAST_ICONS[variant]}
          size={13}
          className={classNames({ "animate-spin": variant === "loading" })}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[13px] font-bold text-neutral-100">
          {title}
        </p>
        {description && (
          <p className="mt-1 text-[12px] text-text-secondary">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
              handleDismiss();
            }}
            className="mt-2 text-[12px] font-semibold text-neutral-100 underline underline-offset-2"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute top-2.5 right-2.5 text-text-muted hover:text-neutral-100"
      >
        <Icon icon="TbX" size={14} />
      </button>
    </div>
  );
};

export default ToastCard;
