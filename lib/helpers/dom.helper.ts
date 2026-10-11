const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/;

// The dashboard scrolls inside <main>, not the window, so walk up to the
// nearest element that scrolls vertically and fall back to the window.
export const getScrollParent = (
  element: HTMLElement | null,
): HTMLElement | Window => {
  let current = element?.parentElement ?? null;

  while (current) {
    if (SCROLLABLE_OVERFLOW.test(window.getComputedStyle(current).overflowY)) {
      return current;
    }
    current = current.parentElement;
  }

  return window;
};
