import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextSlideIndex,
  filterCatalogItems,
  toggleSavedBookId,
  validateMoonMailEmail,
  computeBookTiltAngles,
  dampValue,
  isEraserSwatch,
} from './moonMeshLogic';
import { HERO_SLIDES, BOOKS } from '../data/moonMeshData';

test('getNextSlideIndex wraps around forward and backward', () => {
  assert.equal(getNextSlideIndex(0, 4, 1), 1);
  assert.equal(getNextSlideIndex(3, 4, 1), 0);
  assert.equal(getNextSlideIndex(0, 4, -1), 3);
  assert.equal(getNextSlideIndex(2, 4, -1), 1);
});

test('filterCatalogItems filters by multiple search tokens and saved mode', () => {
  const items = [
    {
      id: 'midnight-kittens',
      title: 'Midnight Kittens',
      theme: 'Cozy nights',
      keywords: 'rooftop moon lantern',
      image: '/a.webp',
    },
    {
      id: 'starlight-garden',
      title: 'Starlight Garden',
      theme: 'Nature magic',
      keywords: 'flowers snail sprout',
      image: '/b.webp',
    },
  ];
  const saved = new Set(['starlight-garden']);

  const searchRes = filterCatalogItems(items, 'midnight moon', 'search', saved);
  assert.equal(searchRes.length, 1);
  assert.equal(searchRes[0].id, 'midnight-kittens');

  const savedRes = filterCatalogItems(items, '', 'saved', saved);
  assert.equal(savedRes.length, 1);
  assert.equal(savedRes[0].id, 'starlight-garden');
});

test('toggleSavedBookId adds and removes valid book IDs immutably', () => {
  const valid = new Set(['midnight-kittens', 'starlight-garden']);
  const s0 = new Set<string>();
  const s1 = toggleSavedBookId(s0, 'midnight-kittens', valid);
  assert.equal(s1.has('midnight-kittens'), true);
  assert.equal(s0.has('midnight-kittens'), false);

  const s2 = toggleSavedBookId(s1, 'midnight-kittens', valid);
  assert.equal(s2.has('midnight-kittens'), false);

  const sInvalid = toggleSavedBookId(s0, 'unknown-book', valid);
  assert.equal(sInvalid.size, 0);
});

test('validateMoonMailEmail rejects empty or malformed emails and accepts valid ones', () => {
  assert.deepEqual(validateMoonMailEmail('   '), {
    valid: false,
    error: 'Add an email so we know where to send the moon.',
  });
  assert.deepEqual(validateMoonMailEmail('miso-at-moon'), {
    valid: false,
    error: 'That email looks a little lost in space. Try again?',
  });
  assert.deepEqual(validateMoonMailEmail('miso@moonmesh.com'), {
    valid: true,
    error: '',
  });
});

test('computeBookTiltAngles calculates bounded tilt degrees', () => {
  const center = computeBookTiltAngles(0, 0);
  assert.equal(center.rx, '0.00deg');
  assert.equal(center.ry, '0.00deg');

  const corner = computeBookTiltAngles(0.5, -0.5, 6, 8);
  assert.equal(corner.rx, '3.00deg');
  assert.equal(corner.ry, '4.00deg');
});

test('dampValue smoothly interpolates toward target', () => {
  const half = dampValue(0, 10, 8, 0.1);
  assert.ok(half > 5 && half < 6);
  assert.equal(dampValue(5, 10, 8, 0), 5);
});

test('isEraserSwatch identifies eraser hex codes', () => {
  assert.equal(isEraserSwatch('#FFFFFF'), true);
  assert.equal(isEraserSwatch('#fffdf7'), true);
  assert.equal(isEraserSwatch('#FFC81E'), false);
});

test('HERO_SLIDES first slide uses Grand Opening book showcase artwork', () => {
  assert.equal(HERO_SLIDES[0].id, 'book-showcase');
  assert.equal(HERO_SLIDES[0].image, '/assets/hero-book-showcase.png');
  assert.equal(HERO_SLIDES[0].layout, 'book-showcase');
});

test('BOOKS catalog contains exclusively The Little Moon Picnic with valid cover path', () => {
  assert.equal(BOOKS.length, 1);
  assert.equal(BOOKS[0].id, 'little-moon-picnic');
  assert.equal(BOOKS[0].coverImage, '/assets/the-little-moon-picnic-book.png');
  assert.ok(BOOKS[0].stageTagline.length > 0);
});

