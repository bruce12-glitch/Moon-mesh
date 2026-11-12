/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BOOKS,
  PEEK_PAGES,
  CREW_MEMBERS,
  FAQ_ITEMS,
  BookItem,
  PeekItem,
} from './data/moonMeshData';
import {
  validateMoonMailEmail,
  computeBookTiltAngles,
  getForestAudioUiState,
} from './utils/moonMeshLogic';
import { forestAudio } from './utils/forestAudio';
import { HeroCarousel } from './components/HeroCarousel';
import { ThreeMoonScene } from './components/ThreeMoonScene';
import { ColoringStudioModal } from './components/ColoringStudioModal';
import { CatalogModal, BookPreviewModal, PeekPreviewModal } from './components/Modals';

const GIFT_TAB_DISMISSED_KEY = 'moon-mesh-free-page-shortcut-dismissed';
const EMPTY_SAVED_IDS = new Set<string>();

export default function App() {
  // Crew outline vs color state
  const [crewColored, setCrewColored] = useState<boolean>(true);

  // Modals & 3D Studio state
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [is3DOpen, setIs3DOpen] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === '3d' || params.get('autostart') === '3d';
  });
  const [catalogState, setCatalogState] = useState<{
    open: boolean;
    mode: 'search' | 'saved';
  }>({ open: false, mode: 'search' });
  const [activeBookPreview, setActiveBookPreview] = useState<BookItem | null>(null);
  const [activePeekPreview, setActivePeekPreview] = useState<PeekItem | null>(null);

  // Global Ambient Forest Sound state (synchronized with 3D Moon Picnic scene)
  const [isForestSoundOn, setIsForestSoundOn] = useState<boolean>(() =>
    forestAudio.getIsPlaying()
  );

  useEffect(() => {
    return forestAudio.subscribe((playing) => {
      setIsForestSoundOn(playing);
    });
  }, []);

  const handleToggleForestSound = () => {
    forestAudio.toggle();
  };
  const forestAudioUi = getForestAudioUiState(isForestSoundOn);

  // FAQ open item state
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Moon Mail form state
  const [mailEmail, setMailEmail] = useState<string>('');
  const [mailError, setMailError] = useState<string>('');
  const [mailSubmitted, setMailSubmitted] = useState<boolean>(false);
  const mailInputRef = useRef<HTMLInputElement | null>(null);

  // Gift shortcut visibility
  const [giftDismissed, setGiftDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(GIFT_TAB_DISMISSED_KEY) === 'yes';
    } catch {
      return false;
    }
  });
  const [showGiftTab, setShowGiftTab] = useState<boolean>(false);

  // Inline video ref
  const inlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const [clipPausedByUser, setClipPausedByUser] = useState<boolean>(false);

  // Gift tab scroll observer
  useEffect(() => {
    if (giftDismissed) return;
    const colorSection = document.getElementById('color');
    const handleScroll = () => {
      const scrolledPastHero = window.scrollY > 450;
      let colorInView = false;
      if (colorSection) {
        const rect = colorSection.getBoundingClientRect();
        colorInView = rect.top < window.innerHeight && rect.bottom > 0;
      }
      setShowGiftTab(scrolledPastHero && !colorInView);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [giftDismissed]);

  // Inline coloring video viewport observer
  useEffect(() => {
    const video = inlineVideoRef.current;
    if (!video || !('IntersectionObserver' in window)) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !clipPausedByUser && !document.hidden) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [clipPausedByUser]);

  // Book cover 3D pointer tilt & specular paper sheen handlers
  const handleBookPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === 'touch') return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const normX = (e.clientX - bounds.left) / bounds.width - 0.5;
    const normY = (e.clientY - bounds.top) / bounds.height - 0.5;
    const { rx, ry } = computeBookTiltAngles(normX, normY, 5, 7);
    e.currentTarget.style.setProperty('--book-rx', rx);
    e.currentTarget.style.setProperty('--book-ry', ry);
    e.currentTarget.style.setProperty('--sheen-x', `${Math.round((normX + 0.5) * 100)}%`);
    e.currentTarget.style.setProperty('--sheen-y', `${Math.round((normY + 0.5) * 100)}%`);
  };

  const handleBookPointerLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.removeProperty('--book-rx');
    e.currentTarget.style.removeProperty('--book-ry');
    e.currentTarget.style.removeProperty('--sheen-x');
    e.currentTarget.style.removeProperty('--sheen-y');
  };

  // Moon Mail submit
  const handleMailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateMoonMailEmail(mailEmail);
    if (!validation.valid) {
      setMailError(validation.error);
      mailInputRef.current?.focus();
      return;
    }
    setMailError('');
    setMailSubmitted(true);
  };

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* Shared SVG Symbols */}
      <svg className="symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <symbol id="spark" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 0c1.8 7.2 4.8 10.2 12 12-7.2 1.8-10.2 4.8-12 12C10.2 16.8 7.2 13.8 0 12 7.2 10.2 10.2 7.2 12 0Z"
          />
        </symbol>
        <symbol id="arrow" viewBox="0 0 24 24">
          <path
            d="M4 12h15m-6-6 6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="arrow-up" viewBox="0 0 24 24">
          <path
            d="M12 20V4m-7 7 7-7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="crayon" viewBox="0 0 24 24">
          <path
            d="m5 16 10-10 4 4L9 20l-5 1 1-5Zm8-8 4 4M6 15l4 4m5-13 3-3 3 2v3l-2 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="download" viewBox="0 0 24 24">
          <path
            d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="heart" viewBox="0 0 24 24">
          <path
            d="M12 20 4.5 12.7C.6 8.8 5.9 2.9 10 6.4l2 1.8 2-1.8c4.1-3.5 9.4 2.4 5.5 6.3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="close" viewBox="0 0 24 24">
          <path
            d="m6 6 12 12M18 6 6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="search" viewBox="0 0 24 24">
          <circle
            cx="10.75"
            cy="10.75"
            r="6.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
          />
          <path
            d="m15.5 15.5 4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="check" viewBox="0 0 24 24">
          <path
            d="m5 13 4 4L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="mail" viewBox="0 0 24 24">
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m4 7 8 6 8-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
      </svg>

      {/* Top Gift Ribbon */}
      <div className="ribbon" id="top">
        <a href="#color">
          <span className="ribbon-stars" aria-hidden="true">
            ✦ ✧ ✦
          </span>
          A little gift for you. Download a free coloring page
          <svg className="icon" aria-hidden="true">
            <use href="#arrow" />
          </svg>
        </a>
      </div>

      {/* Masthead (Coco Wyo-inspired Search + Centered Wordmark + Saved Books + Nav Row) */}
      <header className="masthead is-ready">
        <div className="utility shell">
          <div className="utility-left">
            <button
              className="search-trigger"
              type="button"
              aria-label="Search Moon Mesh"
              aria-haspopup="dialog"
              onClick={() => setCatalogState({ open: true, mode: 'search' })}
            >
              <svg className="icon" aria-hidden="true">
                <use href="#search" />
              </svg>
              <span>Search Moon Mesh</span>
            </button>
          </div>

          <a className="wordmark" href="#top" aria-label="Moon Mesh home">
            <img
              src="/assets/moon-mesh-lockup.webp"
              width={305}
              height={71}
              alt="Moon Mesh"
            />
          </a>

          <div className="utility-right">
            <button
              id="global-forest-audio-toggle"
              type="button"
              className={`header-audio-toggle ${isForestSoundOn ? 'is-playing' : 'is-muted'}`}
              aria-pressed={isForestSoundOn}
              aria-label={forestAudioUi.ariaLabel}
              title={forestAudioUi.ariaLabel}
              onClick={handleToggleForestSound}
            >
              <span className="header-audio-icon" aria-hidden="true">
                {isForestSoundOn ? (
                  <svg viewBox="0 0 24 24" className="icon">
                    <path
                      d="M11 5L6 9H2v6h4l5 4V5z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.54 8.46a5 5 0 0 1 0 7.07"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M19.07 4.93a10 10 0 0 1 0 14.14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="icon">
                    <path
                      d="M11 5L6 9H2v6h4l5 4V5z"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="22"
                      y1="9"
                      x2="16"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="16"
                      y1="9"
                      x2="22"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
              <span className="header-audio-label">{forestAudioUi.buttonLabel}</span>
              <span className="header-audio-badge">{forestAudioUi.statusBadge}</span>
            </button>
          </div>
        </div>

        <nav id="main-nav" className="main-nav shell" aria-label="Main">
          <a href="#books">Our book</a>
          <a href="#peek">Peek inside</a>
          <a href="#story">Our little world</a>
          <button
            type="button"
            className="nav-3d-btn"
            onClick={() => setIs3DOpen(true)}
          >
            3D Moon Picnic
          </button>
          <a href="#color">Free page</a>
          <a href="#faq">FAQs</a>
          <a
            href="https://www.amazon.com/s?k=Moon+Mesh+coloring+books"
            className="amazon-nav"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shop on Amazon <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.etsy.com/search?q=Moon+Mesh+coloring+books"
            className="etsy-nav"
            target="_blank"
            rel="noopener noreferrer"
          >
            Find us on Etsy <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="main">
        {/* Coco Wyo-Inspired Animated Hero Carousel */}
        <HeroCarousel
          onOpenStudio={() => setIsStudioOpen(true)}
          onOpen3DScene={() => setIs3DOpen(true)}
          onPreviewBook={(book) => setActiveBookPreview(book)}
        />

        {/* Crew Lineup Section (Hover / Focus / Tap Outline-to-Color Crossfade) */}
        <section
          className={`crew ${crewColored ? 'is-colored' : ''}`}
          id="story"
          aria-labelledby="story-title"
        >
          <div className="shell">
            <figure className="crew-lineup">
              <button
                className="crew-art-button"
                type="button"
                aria-label={
                  crewColored
                    ? 'Show Miso and friends as a drawing'
                    : 'Show Miso and friends in color'
                }
                aria-pressed={crewColored}
                aria-describedby="crew-art-description"
                onMouseEnter={() => setCrewColored(true)}
                onMouseLeave={() => setCrewColored(false)}
                onFocus={() => setCrewColored(true)}
                onBlur={() => setCrewColored(false)}
                onClick={() => setCrewColored((prev) => !prev)}
              >
                <img
                  className="crew-img crew-img-outline"
                  src="/assets/our-little-crew-outline.webp"
                  width={1400}
                  height={467}
                  alt=""
                  loading="lazy"
                />
                <img
                  className="crew-img crew-img-color"
                  src="/assets/our-little-crew.webp"
                  width={1400}
                  height={467}
                  alt=""
                  loading="lazy"
                />
              </button>
              <p id="crew-art-description" className="visually-hidden">
                Miso with a warm mug, Pip with a crayon, Plum with a coloring book, and Sprout
                beside a pot of flowers. Move over the drawing or focus it to reveal its colors. On
                a touch screen, tap to switch.
              </p>
              <figcaption className="crew-names">
                {CREW_MEMBERS.map((member) => (
                  <span key={member.name}>
                    {member.name} <small>{member.role}</small>
                  </span>
                ))}
              </figcaption>
            </figure>

            <div className="section-heading section-heading-center">
              <h2 id="story-title">Hi, friend!</h2>
              <p>
                Some of our favorite moments are the smallest ones. A warm mug. A quiet table. A
                page full of possibilities. That’s the world we’re making with Miso and friends,
                and there’s always a little room for you.
              </p>
            </div>
          </div>
        </section>

        {/* Bookshelf Section */}
        <section className="books" id="books" aria-labelledby="books-title">
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  <svg className="icon" aria-hidden="true">
                    <use href="#spark" />
                  </svg>{' '}
                  Our featured storybook
                </p>
                <h2 id="books-title">The Little Moon Picnic.</h2>
              </div>
              <p className="section-aside">
                Miso &amp; Friends · A Story Coloring Book for Kids Ages 6–9. Warm buns, fresh
                berries, and paper moons beside the crescent window.
              </p>
            </div>

            <div className="book-grid">
              {BOOKS.map((book) => (
                <article
                  key={book.id}
                  className={`book-card ${book.themeClass}`}
                  id={book.id}
                >
                  <div className="book-mat cocowyo-shelf-stage">
                    <div className="cocowyo-shelf-curtains" aria-hidden="true" />
                    <div className="cocowyo-shelf-wood" aria-hidden="true" />
                    <a
                      className="book-art"
                      href={`#${book.id}-details`}
                      aria-label={`Preview ${book.title}, a Moon Mesh coloring book`}
                      onPointerMove={handleBookPointerMove}
                      onPointerLeave={handleBookPointerLeave}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveBookPreview(book);
                      }}
                    >
                      <span className="cocowyo-book-stage-group">
                        <img
                          src="/assets/prop-courier-bird.webp"
                          alt=""
                          aria-hidden="true"
                          className="book-stage-prop prop-courier-bird"
                        />
                        <img
                          src="/assets/prop-open-easel.webp"
                          alt=""
                          aria-hidden="true"
                          className="book-stage-prop prop-open-easel"
                        />
                        <img
                          src="/assets/prop-alcohol-marker.webp"
                          alt=""
                          aria-hidden="true"
                          className="book-stage-prop prop-alcohol-marker"
                        />
                        <span className="standing-3d-book-figure">
                          <img
                            src="/assets/standing-3d-book.webp"
                            width={670}
                            height={745}
                            alt={`${book.title} — 3D hardcover storybook edition`}
                            loading="lazy"
                            className="standing-3d-book-img"
                          />
                          <span className="standing-3d-book-sheen" aria-hidden="true" />
                        </span>
                      </span>
                    </a>
                  </div>
                  <div className="book-caption">
                    <p className="book-genre">
                      {book.number} · {book.genre}
                    </p>
                    <h3>{book.title}</h3>
                    <p>{book.previewDescription}</p>
                    <div className="book-featured-actions">
                      <button
                        type="button"
                        className="button button-ink whitespace-nowrap"
                        onClick={() => setActiveBookPreview(book)}
                      >
                        Peek inside this book{' '}
                        <svg className="icon" aria-hidden="true">
                          <use href="#arrow" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="button button-paper whitespace-nowrap"
                        onClick={() => setIs3DOpen(true)}
                      >
                        Open 3D Picnic Diorama
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <p className="books-footnote">
              Find Moon Mesh on Amazon &amp; Etsy.{' '}
              <a
                href="https://www.amazon.com/s?k=Moon+Mesh+coloring+books"
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore on Amazon <span aria-hidden="true">↗</span>
              </a>{' '}
              ·{' '}
              <a
                href="https://www.etsy.com/search?q=Moon+Mesh+coloring+books"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find us on Etsy <span aria-hidden="true">↗</span>
              </a>
            </p>
          </div>
        </section>

        {/* Interactive 3D Moon Picnic Diorama Showcase Card */}
        <section className="three-callout" id="three-studio" aria-labelledby="three-callout-title">
          <div className="shell">
            <div className="three-callout-card">
              <div>
                <p className="eyebrow" style={{ color: '#B55770' }}>
                  <svg className="icon" aria-hidden="true">
                    <use href="#spark" />
                  </svg>{' '}
                  Interactive 3D Story World
                </p>
                <h2 id="three-callout-title" className="text-[#2C2028]">
                  Step inside The Little Moon Picnic in 3D.
                </h2>
                <p className="mt-3 max-w-[48ch] text-base text-[#5A4C55]">
                  Inspect Miso’s warm bun handoff, Plum’s cushion, Pip’s spotted berry bowl, and
                  Sprout’s leaf tray from any camera angle under studio moonlight.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 max-[900px]:justify-center">
                  <button
                    type="button"
                    className="button button-ink whitespace-nowrap shrink-0"
                    onClick={() => setIs3DOpen(true)}
                  >
                    Launch 3D Moon Picnic{' '}
                    <svg className="icon" aria-hidden="true">
                      <use href="#arrow" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="button button-paper whitespace-nowrap shrink-0"
                    onClick={() => setIsStudioOpen(true)}
                  >
                    Color Miso’s Page
                  </button>
                </div>
              </div>
              <div className="three-callout-preview">
                <ThreeMoonScene
                  isOpen={!is3DOpen}
                  embedded={true}
                  onClose={() => {}}
                  isForestSoundOn={isForestSoundOn}
                  onToggleForestSound={handleToggleForestSound}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Peek Inside Section */}
        <section className="peek" id="peek" aria-labelledby="peek-title">
          <div className="shell">
            <div className="peek-heading">
              <div>
                <p className="eyebrow">
                  <svg className="icon" aria-hidden="true">
                    <use href="#spark" />
                  </svg>{' '}
                  A look inside
                </p>
                <h2 id="peek-title">A peek between the pages.</h2>
              </div>
              <p>
                A little look at Miso’s world. Simple shapes, familiar friends, and plenty of space
                for your favorite colors.
              </p>
            </div>

            <div className="peek-grid">
              {PEEK_PAGES.map((page) => (
                <a
                  key={page.id}
                  className={`peek-card ${page.cardClass}`}
                  href="#color"
                  aria-haspopup="dialog"
                  onClick={(e) => {
                    e.preventDefault();
                    setActivePeekPreview(page);
                  }}
                >
                  <span className="peek-paper">
                    <span className="peek-drawing">
                      <img
                        src={page.outlineSvg}
                        width={1254}
                        height={1254}
                        alt={page.alt}
                        loading="lazy"
                      />
                      <img
                        className="peek-colored"
                        src={page.coloredSvg}
                        width={1254}
                        height={1254}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                      />
                    </span>
                  </span>
                  <span className="peek-label">
                    <strong>{page.title}</strong>
                    <span>
                      See it in color <span aria-hidden="true">→</span>
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="peek-foot">
              <p>Three of the pages waiting inside. The free page below is ready to color right now.</p>
              <a className="button button-yellow" href="#color">
                Try the free page{' '}
                <svg className="icon" aria-hidden="true">
                  <use href="#arrow" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* From the Coloring Table Video Section */}
        <section className="coloring-table" id="watch" aria-label="Coloring table video">
          <div className="shell coloring-table-inner">
            <figure className="coloring-table-visual">
              <div className="clip-card">
                <video
                  ref={inlineVideoRef}
                  className="clip-video"
                  id="inline-coloring-video"
                  src="/assets/coloring-table.mp4"
                  poster="/assets/coloring-table-poster.webp"
                  width={1080}
                  height={1920}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="A quiet moment at the coloring table"
                  aria-describedby="inline-video-description"
                  onClick={() => {
                    const v = inlineVideoRef.current;
                    if (!v) return;
                    if (v.paused) {
                      setClipPausedByUser(false);
                      v.play().catch(() => {});
                    } else {
                      setClipPausedByUser(true);
                      v.pause();
                    }
                  }}
                >
                  <a href="/assets/coloring-table.mp4">Watch the coloring clip</a>
                </video>
              </div>
              <p id="inline-video-description" className="visually-hidden">
                A hand adds color with markers to a cozy page of puppies and plants.
              </p>
            </figure>
          </div>
        </section>

        {/* Free Page / Coloring Club Section */}
        <section className="free-page" id="color" aria-labelledby="sample-title">
          <div className="shell free-page-inner">
            <div className="free-copy">
              <p className="eyebrow">
                <svg className="icon" aria-hidden="true">
                  <use href="#spark" />
                </svg>{' '}
                The coloring club
              </p>
              <h2 id="sample-title">A little gift. A whole lot of color.</h2>
              <p>
                Give Miso a purple scarf, a pink moon, or a sky full of green stars. This little
                page is yours — color it here, or print it for the kitchen table.
              </p>
              <div className="free-actions">
                <button
                  className="button button-yellow whitespace-nowrap shrink-0"
                  type="button"
                  id="open-studio"
                  onClick={() => setIsStudioOpen(true)}
                >
                  <svg className="icon" aria-hidden="true">
                    <use href="#crayon" />
                  </svg>{' '}
                  Color it online
                </button>
                <a
                  className="button button-outline whitespace-nowrap shrink-0"
                  href="/assets/miso-moon-coloring.pdf"
                  download
                >
                  <svg className="icon" aria-hidden="true">
                    <use href="#download" />
                  </svg>{' '}
                  Print the page
                </a>
              </div>
              <p className="free-note">
                Print it, share a crayon, and see where the afternoon goes.
              </p>
            </div>
            <figure className="free-visual">
              <div className="paper-card">
                <span className="paper-kicker">Moon Mesh Coloring Club</span>
                <img
                  src="/assets/miso-moon-coloring.svg"
                  width={1254}
                  height={1254}
                  alt="Miso reading a coloring book on a crescent moon, with stars, a cloud, and a crayon."
                  loading="lazy"
                />
                <span className="paper-foot">Miso &amp; the Moon · Page 01</span>
              </div>
            </figure>
          </div>
        </section>

        {/* Amazon & Etsy Storefront Section */}
        <section className="featured" id="shops" aria-labelledby="featured-title">
          <div className="shell featured-inner">
            <div className="featured-grid">
              <div className="featured-col">
                <div className="section-heading section-heading-center">
                  <h2 id="featured-title">Find us on Amazon</h2>
                  <p>A new little adventure, delivered to your door.</p>
                </div>
                <a
                  className="amazon-tile group"
                  href="https://www.amazon.com/s?k=Moon+Mesh+coloring+books"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Find Moon Mesh coloring books on Amazon, opens in a new tab"
                >
                  <span className="amazon-wordmark" aria-hidden="true">
                    amazon
                    <svg viewBox="0 0 180 42">
                      <path
                        d="M13 8c42 25 94 27 143 2M142 9l17-3-3 15"
                        fill="none"
                        stroke="#e99535"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="amazon-tile-copy">
                    Meet your next coloring companion <span aria-hidden="true">↗</span>
                  </span>
                </a>
              </div>

              <div className="featured-col" id="etsy">
                <div className="section-heading section-heading-center">
                  <h2 id="etsy-title">Find us on Etsy</h2>
                  <p>Printable pages, cozy bundles, and little studio treasures.</p>
                </div>
                <a
                  className="amazon-tile etsy-tile group"
                  href="https://www.etsy.com/search?q=Moon+Mesh+coloring+books"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Find Moon Mesh coloring books on Etsy, opens in a new tab"
                >
                  <span className="etsy-wordmark" aria-hidden="true">
                    Etsy
                    <svg viewBox="0 0 180 36">
                      <path
                        d="M18 18c44 12 100 12 144 0"
                        fill="none"
                        stroke="#d5582b"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <span className="amazon-tile-copy">
                    Visit our little Etsy shop <span aria-hidden="true">↗</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section with Smooth CSS Grid-Row Transitions */}
        <section className="faq-section" id="faq" aria-labelledby="faq-title">
          <div className="shell faq-inner">
            <figure className="faq-art">
              <img
                src="/assets/books-and-little-moments.webp"
                width={1100}
                height={619}
                alt="Miso peeks out of a box of books while Plum wraps one as a gift."
                loading="lazy"
              />
            </figure>
            <div className="faq-intro">
              <p className="eyebrow">
                <svg className="icon" aria-hidden="true">
                  <use href="#spark" />
                </svg>{' '}
                For the grown-ups
              </p>
              <h2 id="faq-title">Good to know.</h2>
              <p>A few things you might like to know before you open the crayon box.</p>
            </div>
            <div className="faq">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div key={item.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqId((prev) => (prev === item.id ? null : item.id))}
                    >
                      <span>{item.question}</span>
                      <span className="faq-chevron" aria-hidden="true" />
                    </button>
                    <div className="faq-collapse">
                      <div className="faq-collapse-inner">
                        <p>{item.answerHtml}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Moon Mail Section */}
        <section className="moon-mail" id="moon-mail" aria-labelledby="mail-title">
          <div className="shell mail-inner">
            <div className="mail-copy">
              <p className="eyebrow">
                <svg className="icon" aria-hidden="true">
                  <use href="#mail" />
                </svg>{' '}
                Moon Mail
              </p>
              <h2 id="mail-title">A little letter from the moon.</h2>
              <p>
                We’re getting our little postbox ready. Until then, come by the Coloring Club for a
                free page and a few quiet minutes with Miso.
              </p>
            </div>
            <div className="mail-card">
              {!mailSubmitted ? (
                <form id="moon-mail-form" noValidate onSubmit={handleMailSubmit}>
                  <label htmlFor="mail-email">Your email</label>
                  <div className="mail-field">
                    <input
                      ref={mailInputRef}
                      id="mail-email"
                      name="email"
                      type="email"
                      value={mailEmail}
                      onChange={(e) => {
                        setMailEmail(e.target.value);
                        if (mailError) setMailError('');
                      }}
                      autoComplete="email"
                      placeholder="you@somewhere.com"
                      required
                      aria-invalid={Boolean(mailError)}
                      aria-describedby="mail-help mail-status"
                    />
                    <button className="button button-ink whitespace-nowrap" type="submit">
                      Preview{' '}
                      <svg className="icon" aria-hidden="true">
                        <use href="#arrow" />
                      </svg>
                    </button>
                  </div>
                  <p id="mail-help" className="mail-help">
                    Email subscriptions are coming soon. This form is a preview and does not send or
                    store your email.
                  </p>
                  <p
                    id="mail-status"
                    className={`mail-status ${mailError ? 'is-error' : ''}`}
                    role="status"
                  >
                    {mailError}
                  </p>
                </form>
              ) : (
                <div className="mail-success" role="status">
                  <span className="mail-success-icon" aria-hidden="true">
                    <svg className="icon">
                      <use href="#check" />
                    </svg>
                  </span>
                  <p>
                    <strong>Thanks for stopping by.</strong> Moon Mail is still getting ready. Email
                    subscriptions will open soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Scalloped Yellow Divider */}
      <footer className="footer">
        <div className="footer-scene">
          <figure className="footer-illustration">
            <img
              src="/assets/see-you-on-the-moon.webp"
              width={1400}
              height={477}
              alt="Miso and Plum wave goodbye with Pip and Sprout beside their open coloring book."
              loading="lazy"
            />
          </figure>
          <div className="scallop-divider" aria-hidden="true" />
        </div>
        <div className="footer-main">
          <div className="shell footer-inner">
            <div className="footer-brand">
              <a className="wordmark" href="#top" aria-label="Moon Mesh home">
                <img
                  src="/assets/moon-mesh-lockup-lilac.webp"
                  width={672}
                  height={227}
                  alt="Moon Mesh"
                  loading="lazy"
                />
              </a>
              <p className="footer-tagline">See you on the moon.</p>
              <p className="footer-blurb">
                Coloring books for little dreamers and their grown-ups. A small, happy world, one
                page at a time.
              </p>
            </div>
            <nav className="footer-nav" aria-label="Explore Moon Mesh">
              <div>
                <h2>Our Book</h2>
                <a href="#little-moon-picnic">The Little Moon Picnic</a>
                <a href="#peek">Peek inside the pages</a>
                <a href="#three-studio">3D Moon Picnic Diorama</a>
              </div>
              <div>
                <h2>Coloring Club</h2>
                <a href="#color">Color online</a>
                <a href="/assets/miso-moon-coloring.pdf" download>
                  Print the free page
                </a>
                <a href="#story">Meet the crew</a>
              </div>
              <div>
                <h2>Good to know</h2>
                <a href="#faq">Frequently asked questions</a>
                <a href="#moon-mail">Moon Mail</a>
                <a
                  href="https://www.etsy.com/search?q=Moon+Mesh+coloring+books"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Find us on Etsy <span aria-hidden="true">↗</span>
                </a>
              </div>
            </nav>
          </div>
          <div className="shell footer-bottom">
            <p>© 2026 Moon Mesh. A little world of color.</p>
            <p>For small hands and big imaginations.</p>
            <a href="#top">
              Back to top{' '}
              <svg className="icon" aria-hidden="true">
                <use href="#arrow-up" />
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Gift Shortcut Tab */}
      {!giftDismissed && showGiftTab && (
        <aside className="gift-tab" aria-label="Free coloring page shortcut">
          <a href="#color" aria-label="Free coloring page">
            <img
              className="gift-doodle"
              src="/assets/gift-doodle.svg"
              width={32}
              height={35}
              alt=""
            />
            <span>A little gift</span>
          </a>
          <button
            type="button"
            aria-label="Dismiss free page shortcut"
            onClick={() => {
              setGiftDismissed(true);
              try {
                sessionStorage.setItem(GIFT_TAB_DISMISSED_KEY, 'yes');
              } catch {
                // Ignore
              }
            }}
          >
            <svg className="icon" aria-hidden="true">
              <use href="#close" />
            </svg>
          </button>
        </aside>
      )}

      {/* Interactive Modals & Full-Screen Three.js 3D Studio */}
      <ColoringStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
      />

      <CatalogModal
        isOpen={catalogState.open}
        mode={catalogState.mode}
        savedIds={EMPTY_SAVED_IDS}
        onClose={() => setCatalogState((prev) => ({ ...prev, open: false }))}
        onSelectBook={(book) => setActiveBookPreview(book)}
        onOpen3DScene={() => setIs3DOpen(true)}
      />

      <BookPreviewModal
        book={activeBookPreview}
        onClose={() => setActiveBookPreview(null)}
        onTryFreePage={() => setIsStudioOpen(true)}
      />

      <PeekPreviewModal
        peek={activePeekPreview}
        onClose={() => setActivePeekPreview(null)}
        onColorFreePage={() => setIsStudioOpen(true)}
      />

      <ThreeMoonScene
        isOpen={is3DOpen}
        onClose={() => setIs3DOpen(false)}
        isForestSoundOn={isForestSoundOn}
        onToggleForestSound={handleToggleForestSound}
      />
    </>
  );
}
