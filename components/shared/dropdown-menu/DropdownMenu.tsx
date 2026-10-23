"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { tv } from "tailwind-variants";

import Icon, { type IconName } from "@/components/ui/icon/Icon";

const menuItem = tv({
  slots: {
    row: "flex w-full cursor-pointer flex-col gap-0.5 text-left hover:bg-surface-hover",
    label: "flex items-center",
    icon: "shrink-0",
  },
  variants: {
    // sm: compact mono list (e.g. a role picker); md: account-style menu
    // with icons.
    size: {
      sm: {
        row: "px-3.5 py-2",
        label: "gap-1.5 font-mono text-[11.5px]",
      },
      md: {
        row: "px-4 py-2.5",
        label: "gap-3 text-[13px]",
        icon: "text-text-secondary",
      },
    },
    tone: {
      default: { label: "text-neutral-100" },
      danger: { label: "text-danger-light", icon: "text-danger-light" },
    },
  },
  defaultVariants: { size: "sm", tone: "default" },
});

export interface DropdownMenuItem {
  key: string;
  label: React.ReactNode;
  description?: string;
  // Marks the current choice (e.g. the member's role).
  checked?: boolean;
  tone?: "default" | "danger";
  icon?: IconName;
  // Draws a divider above the item (e.g. before "Sign out").
  separated?: boolean;
  onSelect: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  // Renders the button that opens the menu.
  trigger: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  ariaLabel: string;
  // Non-interactive block above the items (e.g. the account's name/email).
  header?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

// Small anchored menu: closes on outside click, Escape, or after a choice.
const DropdownMenu = React.memo(
  ({
    items,
    trigger,
    ariaLabel,
    header,
    size = "sm",
    className,
  }: DropdownMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const toggle = useCallback(() => setIsOpen((current) => !current), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDown = (event: MouseEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) close();
      };
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen, close]);

    return (
      <div ref={rootRef} className="relative">
        {trigger({ isOpen, toggle })}

        {isOpen && (
          <div
            role="menu"
            aria-label={ariaLabel}
            className={classNames(
              // Above PR detail's sticky bar (z-30); never wider than the screen.
              "absolute top-full right-0 z-40 mt-1.5 max-w-[calc(100vw-1rem)] min-w-56 rounded-lg border border-border-default bg-raised-alt py-1.5 shadow-lg",
              className,
            )}
          >
            {header && (
              <div className="mb-1.5 border-b border-border-subtle px-4 pt-1.5 pb-3">
                {header}
              </div>
            )}
            {items.map((item) => {
              const slots = menuItem({ size, tone: item.tone });
              return (
                <React.Fragment key={item.key}>
                  {item.separated && (
                    <div
                      role="separator"
                      className="mx-3 my-1.5 h-px bg-border-subtle"
                    />
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close();
                      item.onSelect();
                    }}
                    className={slots.row()}
                  >
                    <span className={slots.label()}>
                      {item.icon && (
                        <Icon
                          icon={item.icon}
                          size={size === "md" ? 17 : 12}
                          className={slots.icon()}
                        />
                      )}
                      {item.checked && (
                        <Icon
                          icon="TbCheck"
                          size={12}
                          className="text-success"
                        />
                      )}
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="text-[11px] leading-normal text-text-faint">
                        {item.description}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

DropdownMenu.displayName = "DropdownMenu";

export default DropdownMenu;
