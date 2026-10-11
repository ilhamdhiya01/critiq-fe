import classNames from "classnames";
import React, { forwardRef } from "react";

interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "onToggle"
> {
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

// Toggle switch — button with role="switch" so screen readers announce the
// on/off state; the same pattern the notifications toggles use inline.
const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onToggle, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onToggle(!checked)}
      className={classNames(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-success" : "bg-border-default",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
      {...props}
    >
      <span
        className={classNames(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  ),
);

Switch.displayName = "Switch";

export default Switch;
