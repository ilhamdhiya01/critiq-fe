"use client";

import { type RefObject, useEffect } from "react";

/**
 * Closes a floating panel on an outside click or an Escape keypress.
 *
 * Both refs are checked, not just the panel: when the trigger is excluded the
 * panel closes on mousedown and the trigger's own onClick immediately reopens
 * it, so the panel never appears to respond to a click on its trigger.
 *
 * Listeners are only attached while `isOpen`, and every one is removed on
 * cleanup so a closed or unmounted panel leaves nothing behind.
 */
export const useDismissable = (
  isOpen: boolean,
  onDismiss: () => void,
  refs: RefObject<HTMLElement | null>[],
) => {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = refs.some((ref) => ref.current?.contains(target));
      if (!isInside) onDismiss();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // `refs` is a new array literal on each render at most call sites, so it is
    // deliberately excluded — the ref objects it holds are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onDismiss]);
};
