import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSlideIndex,
  nextSlideIndex,
  prevSlideIndex,
  shouldAutoAdvance,
  filterCatalogItems,
  toggleSavedBookId,
} from './hero-carousel';

test('normalizeSlideIndex wraps positive and negative indices cleanly', () => {
  assert.equal(normalizeSlideIndex(0, 3), 0);
  assert.equal(normalizeSlideIndex(1, 3), 1);
  assert.equal(normalizeSlideIndex(2, 3), 2);
  assert.equal(normalizeSlideIndex(3, 3), 0);
  assert.equal(normalizeSlideIndex(-1, 3), 2);
  assert.equal(normalizeSlideIndex(-4, 3), 2);
  assert.equal(normalizeSlideIndex(5, 0), 0);
});

test('nextSlideIndex and prevSlideIndex cycle through all hero slides', () => {
  assert.equal(nextSlideIndex(0, 3), 1);
  assert.equal(nextSlideIndex(1, 3), 2);
  assert.equal(nextSlideIndex(2, 3), 0);

  assert.equal(prevSlideIndex(0, 3), 2);
  assert.equal(prevSlideIndex(2, 3), 1);
  assert.equal(prevSlideIndex(1, 3), 0);
});

test('shouldAutoAdvance respects reduced motion, hover, focus, user pause, and tab visibility', () => {
  const baseState = {
    currentIndex: 0,
    totalSlides: 3,
    isPausedByUser: false,
    isHovered: false,
    isFocused: false,
    reducedMotion: false,
    documentHidden: false,
  };

  assert.equal(shouldAutoAdvance(baseState), true);
  assert.equal(shouldAutoAdvance({ ...baseState, reducedMotion: true }), false);
  assert.equal(shouldAutoAdvance({ ...baseState, isPausedByUser: true }), false);
  assert.equal(shouldAutoAdvance({ ...baseState, isHovered: true }), false);
  assert.equal(shouldAutoAdvance({ ...baseState, isFocused: true }), false);
  assert.equal(shouldAutoAdvance({ ...baseState, documentHidden: true }), false);
  assert.equal(shouldAutoAdvance({ ...baseState, totalSlides: 1 }), false);
});

test('filterCatalogItems matches multi-token queries across title, theme, and keywords', () => {
  const catalog = [
    {
      id: 'midnight-kittens',
      title: 'Midnight Kittens',
      theme: 'Cozy nights · Ages 4+',
      keywords: 'roof lanterns crescent moon kitten',
      image: 'assets/cover-midnight-cozy.webp',
    },
    {
      id: 'starlight-garden',
      title: 'Starlight Garden',
      theme: 'Nature magic · Ages 4+',
      keywords: 'flowers snail sprout garden',
      image: 'assets/cover-garden-cozy.webp',
    },
  ];

  assert.equal(filterCatalogItems(catalog, '').length, 2);
  assert.equal(filterCatalogItems(catalog, 'kitten moon').length, 1);
  assert.equal(filterCatalogItems(catalog, 'kitten moon')[0].id, 'midnight-kittens');
  assert.equal(filterCatalogItems(catalog, 'sprout').length, 1);
  assert.equal(filterCatalogItems(catalog, 'nonexistent').length, 0);
});

test('toggleSavedBookId adds, removes, and filters valid book IDs', () => {
  const valid = new Set(['midnight-kittens', 'starlight-garden', 'pocket-sized-planet']);
  const afterAdd = toggleSavedBookId([], 'midnight-kittens', valid);
  assert.equal(afterAdd.has('midnight-kittens'), true);

  const afterRemove = toggleSavedBookId(afterAdd, 'midnight-kittens', valid);
  assert.equal(afterRemove.has('midnight-kittens'), false);

  const ignoreInvalid = toggleSavedBookId(['unknown-book'], 'invalid-id', valid);
  assert.equal(ignoreInvalid.size, 0);
});
