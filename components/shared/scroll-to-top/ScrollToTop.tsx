"use client";

import React, { useEffect, useRef, useState } from "react";

import Icon from "@/components/ui/icon/Icon";
import { getScrollParent } from "@/lib/helpers/dom.helper";

interface ScrollToTopProps {
  // How far (px) the user must scroll before the button appears.
  threshold?: number;
}

const getScrollTop = (container: HTMLElement | Window) =>
  container instanceof Window ? container.scrollY : container.scrollTop;

const ScrollToTop = React.memo(({ threshold = 600 }: ScrollToTopProps) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement | Window | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = getScrollParent(anchorRef.current);
    containerRef.current = container;

    const handleScroll = () =>
      setIsVisible(getScrollTop(container) > threshold);

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    containerRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <span ref={anchorRef} aria-hidden className="hidden" />
      {isVisible && (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
          className="fixed right-6 bottom-6 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-default bg-raised text-text-secondary shadow-lg transition-colors hover:border-neutral-600 hover:text-text-strong"
        >
          <Icon icon="TbArrowUp" size={18} />
        </button>
      )}
    </>
  );
});

ScrollToTop.displayName = "ScrollToTop";

export default ScrollToTop;
