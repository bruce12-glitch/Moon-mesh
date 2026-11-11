export interface CarouselState {
  currentIndex: number;
  totalSlides: number;
  isPausedByUser: boolean;
  isHovered: boolean;
  isFocused: boolean;
  reducedMotion: boolean;
  documentHidden: boolean;
}

export interface CatalogItem {
  id?: string;
  title: string;
  theme: string;
  keywords: string;
  href?: string;
  image: string;
}

export function normalizeSlideIndex(index: number, totalSlides: number): number {
  if (totalSlides <= 0 || !Number.isFinite(totalSlides)) return 0;
  const intIndex = Math.trunc(index);
  return ((intIndex % totalSlides) + totalSlides) % totalSlides;
}

export function nextSlideIndex(currentIndex: number, totalSlides: number): number {
  return normalizeSlideIndex(currentIndex + 1, totalSlides);
}

export function prevSlideIndex(currentIndex: number, totalSlides: number): number {
  return normalizeSlideIndex(currentIndex - 1, totalSlides);
}

export function shouldAutoAdvance(state: CarouselState): boolean {
  if (state.totalSlides <= 1) return false;
  if (state.reducedMotion) return false;
  if (state.isPausedByUser) return false;
  if (state.isHovered) return false;
  if (state.isFocused) return false;
  if (state.documentHidden) return false;
  return true;
}

export function filterCatalogItems<T extends CatalogItem>(items: T[], rawQuery: string): T[] {
  const query = rawQuery.toLowerCase().trim();
  if (!query) return [...items];
  const tokens = query.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const haystack = [item.title, item.theme, item.keywords].join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export function toggleSavedBookId(savedIds: Iterable<string>, bookId: string, validBookIds: Set<string>): Set<string> {
  const next = new Set<string>();
  for (const id of savedIds) {
    if (validBookIds.has(id)) next.add(id);
  }
  if (!bookId || !validBookIds.has(bookId)) return next;
  if (next.has(bookId)) {
    next.delete(bookId);
  } else {
    next.add(bookId);
  }
  return next;
}
