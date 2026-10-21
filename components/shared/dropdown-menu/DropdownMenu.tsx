"use client";

import classNames from "classnames";
import React, { useCallback, useEffect, useRef, useState } from "react";

import Icon from "@/components/ui/icon/Icon";

export interface DropdownMenuItem {
  key: string;
  label: React.ReactNode;
  description?: string;
  // Marks the current choice (e.g. the member's role).
  checked?: boolean;
  tone?: "default" | "danger";
  onSelect: () => void;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  // Renders the button that opens the menu.
  trigger: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  ariaLabel: string;
  className?: string;
}

// Small anchored menu: closes on outside click, Escape, or after a choice.
const DropdownMenu = React.memo(
  ({ items, trigger, ariaLabel, className }: DropdownMenuProps) => {
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
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className="flex w-full cursor-pointer flex-col gap-0.5 px-3.5 py-2 text-left hover:bg-surface-hover"
              >
                <span
                  className={classNames(
                    "flex items-center gap-1.5 font-mono text-[11.5px]",
                    item.tone === "danger"
                      ? "text-danger-light"
                      : "text-neutral-100",
                  )}
                >
                  {item.checked && (
                    <Icon icon="TbCheck" size={12} className="text-success" />
                  )}
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-[11px] leading-normal text-text-faint">
                    {item.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

DropdownMenu.displayName = "DropdownMenu";

export default DropdownMenu;
