// services/domFocus.ts

const STICKY_HEADER_OFFSET = 80; // Approximate height of the sticky header in px

/**
 * Scrolls to an element by its ID and attempts to focus it.
 * Takes a sticky header offset into account.
 * @param id The ID of the element to focus and scroll to.
 * @param options Optional configuration for scrolling.
 */
export const focusAndScrollTo = (id: string | null, options?: { offset?: number }) => {
  if (!id) return;

  const element = document.getElementById(id);
  if (!element) {
    console.warn(`[domFocus] Element with ID "${id}" not found.`);
    return;
  }

  // First, try to focus the element without causing a jumpy scroll.
  // The subsequent scrollIntoView will handle the smooth transition.
  if (typeof element.focus === 'function') {
    element.focus({ preventScroll: true });
  }

  // Calculate the final scroll position
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - (options?.offset ?? STICKY_HEADER_OFFSET);

  // Use smooth scrolling to bring the element into view.
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};
