export interface SearchableItem {
  id?: string;
  title: string;
  theme: string;
  keywords: string;
  image: string;
  href?: string;
}

/**
 * Computes the next slide index with wrap-around.
 */
export function getNextSlideIndex(currentIndex: number, totalSlides: number, direction: 1 | -1 = 1): number {
  if (totalSlides <= 0) return 0;
  return ((currentIndex + direction) % totalSlides + totalSlides) % totalSlides;
}

/**
 * Filters catalog items by search query or saved IDs.
 */
export function filterCatalogItems<T extends SearchableItem>(
  items: T[],
  query: string,
  mode: 'search' | 'saved',
  savedIds: Set<string>
): T[] {
  if (mode === 'saved') {
    return items.filter((item) => Boolean(item.id && savedIds.has(item.id)));
  }
  const normalized = query.toLowerCase().trim();
  if (!normalized) return items;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const haystack = `${item.title} ${item.theme} ${item.keywords}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

/**
 * Toggles a book ID in the saved set and returns a new Set.
 */
export function toggleSavedBookId(savedIds: Set<string>, bookId: string, validBookIds?: Set<string>): Set<string> {
  const next = new Set(savedIds);
  if (!bookId || (validBookIds && !validBookIds.has(bookId))) {
    return next;
  }
  if (next.has(bookId)) {
    next.delete(bookId);
  } else {
    next.add(bookId);
  }
  return next;
}

/**
 * Validates Moon Mail email input and returns a friendly validation result.
 */
export function validateMoonMailEmail(rawEmail: string): { valid: boolean; error: string } {
  const trimmed = rawEmail.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Add an email so we know where to send the moon.',
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'That email looks a little lost in space. Try again?',
    };
  }
  return { valid: true, error: '' };
}

/**
 * Computes 3D card tilt angles (in degrees) from normalized pointer coordinates.
 */
export function computeBookTiltAngles(
  normX: number,
  normY: number,
  maxTiltX = 6,
  maxTiltY = 8
): { rx: string; ry: string } {
  const clampedX = Math.max(-0.5, Math.min(0.5, normX));
  const clampedY = Math.max(-0.5, Math.min(0.5, normY));
  const rawRx = -clampedY * maxTiltX || 0;
  const rawRy = clampedX * maxTiltY || 0;
  const rx = rawRx.toFixed(2) + 'deg';
  const ry = rawRy.toFixed(2) + 'deg';
  return { rx, ry };
}

/**
 * Frame-rate independent exponential damping helper for 3D camera & transitions.
 */
export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Determines whether a selected swatch color acts as an eraser in the coloring studio.
 */
export function isEraserSwatch(hexColor: string): boolean {
  const upper = hexColor.trim().toUpperCase();
  return upper === '#FFFFFF' || upper === '#FFFDF7';
}
