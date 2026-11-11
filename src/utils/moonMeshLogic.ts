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

export interface ForestAudioUiState {
  isPlaying: boolean;
  iconState: 'speaker' | 'muted';
  ariaLabel: string;
  buttonLabel: string;
  statusBadge: string;
}

/**
 * Computes consistent UI & accessibility metadata for the global and 3D scene ambient forest sound toggles.
 */
export function getForestAudioUiState(isPlaying: boolean): ForestAudioUiState {
  if (isPlaying) {
    return {
      isPlaying: true,
      iconState: 'speaker',
      ariaLabel: 'Mute ambient forest sound for the 3D Moon Picnic scene',
      buttonLabel: 'Forest Sound',
      statusBadge: 'On',
    };
  }
  return {
    isPlaying: false,
    iconState: 'muted',
    ariaLabel: 'Play ambient forest sound for the 3D Moon Picnic scene',
    buttonLabel: 'Forest Sound',
    statusBadge: 'Muted',
  };
}

export type DioramaMoodId = 'moonlit-night' | 'golden-dusk' | 'starlight-bloom';

export interface DioramaLightMoodConfig {
  id: DioramaMoodId;
  label: string;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  skyBottom: string;
  fogColor: number;
  keyLightColor: number;
  keyLightIntensity: number;
  fillLightColor: number;
  fillLightIntensity: number;
  moonGlowIntensity: number;
  fireflyOpacity: number;
}

export const DIORAMA_LIGHT_MOODS: Record<DioramaMoodId, DioramaLightMoodConfig> = {
  'moonlit-night': {
    id: 'moonlit-night',
    label: 'Moonlit Night',
    skyTop: '#243B6B',
    skyMid: '#375A9E',
    skyHorizon: '#5688C7',
    skyBottom: '#2B3F66',
    fogColor: 0x375a9e,
    keyLightColor: 0xfff3d6,
    keyLightIntensity: 2.35,
    fillLightColor: 0xffb8d1,
    fillLightIntensity: 0.9,
    moonGlowIntensity: 2.6,
    fireflyOpacity: 0.92,
  },
  'golden-dusk': {
    id: 'golden-dusk',
    label: 'Golden Dusk',
    skyTop: '#3B2D5E',
    skyMid: '#6E4578',
    skyHorizon: '#C97A7E',
    skyBottom: '#422B4E',
    fogColor: 0x6e4578,
    keyLightColor: 0xffdf9e,
    keyLightIntensity: 2.65,
    fillLightColor: 0xff9eb5,
    fillLightIntensity: 1.15,
    moonGlowIntensity: 3.1,
    fireflyOpacity: 0.85,
  },
  'starlight-bloom': {
    id: 'starlight-bloom',
    label: 'Starlight',
    skyTop: '#19284C',
    skyMid: '#284278',
    skyHorizon: '#466FA6',
    skyBottom: '#1C2B4B',
    fogColor: 0x284278,
    keyLightColor: 0xeef6ff,
    keyLightIntensity: 2.15,
    fillLightColor: 0xc8b6ff,
    fillLightIntensity: 1.05,
    moonGlowIntensity: 2.9,
    fireflyOpacity: 1.0,
  },
};

export function getDioramaLightMood(moodId: DioramaMoodId): DioramaLightMoodConfig {
  return DIORAMA_LIGHT_MOODS[moodId] ?? DIORAMA_LIGHT_MOODS['moonlit-night'];
}

