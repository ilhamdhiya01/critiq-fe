import { type RefObject, useEffect, useState } from "react";

import { getScrollParent } from "@/lib/helpers/dom.helper";

// True once the element has scrolled above the top of its scroll container
// (the dashboard scrolls <main>, not the window).
export const useIsScrolledPast = (
  targetRef: RefObject<HTMLElement | null>,
): boolean => {
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const container = getScrollParent(target);
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootTop = entry.rootBounds?.top ?? 0;
        setIsPast(
          !entry.isIntersecting && entry.boundingClientRect.top < rootTop,
        );
      },
      { root: container instanceof Window ? null : container },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  return isPast;
};
