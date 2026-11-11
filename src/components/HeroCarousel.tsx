import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BOOKS, HERO_SLIDES, BookItem, HeroSlide } from '../data/moonMeshData';
import { getNextSlideIndex } from '../utils/moonMeshLogic';

interface HeroCarouselProps {
  onOpenStudio: () => void;
  onOpen3DScene: () => void;
  onPreviewBook: (book: BookItem) => void;
}

const CONFETTI_PIECES = [
  { id: 1, color: '#F5C95D', top: '8%', left: '5%', rot: '-18deg', delay: '0s', dur: '5.2s' },
  { id: 2, color: '#70B5E8', top: '9%', left: '32%', rot: '22deg', delay: '0.7s', dur: '6.1s' },
  { id: 3, color: '#7BC697', top: '18%', left: '47%', rot: '-12deg', delay: '1.3s', dur: '5.6s' },
  { id: 4, color: '#F5C95D', top: '52%', left: '3%', rot: '28deg', delay: '0.4s', dur: '6.4s' },
  { id: 5, color: '#70B5E8', top: '88%', left: '14%', rot: '-24deg', delay: '1.8s', dur: '5.8s' },
  { id: 6, color: '#F5C95D', top: '86%', left: '38%', rot: '15deg', delay: '1.1s', dur: '5.4s' },
  { id: 7, color: '#7BC697', top: '44%', left: '94%', rot: '-20deg', delay: '0.9s', dur: '6.0s' },
  { id: 8, color: '#70B5E8', top: '78%', left: '91%', rot: '19deg', delay: '2.1s', dur: '5.5s' },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  onOpenStudio,
  onOpen3DScene,
  onPreviewBook,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showcaseBookIndex, setShowcaseBookIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const heroRef = useRef<HTMLElement | null>(null);

  const totalSlides = HERO_SLIDES.length;
  const activeSlide = HERO_SLIDES[activeIndex];
  const activeShowcaseBook = BOOKS[showcaseBookIndex] || BOOKS[0];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => getNextSlideIndex(prev, totalSlides, 1));
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => getNextSlideIndex(prev, totalSlides, -1));
  }, [totalSlides]);

  const handleGoTo = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => getNextSlideIndex(prev, totalSlides, 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [isAutoPlaying, totalSlides]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIsAutoPlaying(false);
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsAutoPlaying(false);
      handlePrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 45) {
      setIsAutoPlaying(false);
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  const handleCtaClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    cta: HeroSlide['primaryCta']
  ) => {
    if (cta.action === 'open-3d') {
      e.preventDefault();
      onOpen3DScene();
    } else if (cta.action === 'open-studio') {
      e.preventDefault();
      onOpenStudio();
    } else if (cta.action === 'preview-book') {
      e.preventDefault();
      onPreviewBook(activeShowcaseBook);
    }
  };

  const getFallbackImage = (slide: HeroSlide) => {
    if (imageErrors[slide.id]) {
      if (slide.id === 'coloring-treat') return '/assets/hero-coloring-treat.jpg';
      if (slide.id === 'come-join-us') return '/assets/hero-come-join-us.jpg';
      if (slide.id === 'book-showcase') return '/assets/the-little-moon-picnic-book.png';
      return '/assets/color-together.webp';
    }
    return slide.image;
  };

  return (
    <section
      ref={heroRef}
      className={`hero-carousel relative isolate w-full overflow-hidden transition-colors duration-700 ${activeSlide.themeClass}`}
      style={{ backgroundColor: activeSlide.bgColor }}
      aria-roledescription="carousel"
      aria-label="Featured Moon Mesh books and stories"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated Ambient Layer per Slide */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {activeSlide.id === 'coloring-treat' &&
          CONFETTI_PIECES.map((piece) => (
            <span
              key={piece.id}
              className="hero-confetti-ribbon"
              style={{
                top: piece.top,
                left: piece.left,
                backgroundColor: piece.color,
                ['--confetti-rot' as string]: piece.rot,
                animationDelay: piece.delay,
                animationDuration: piece.dur,
              }}
            />
          ))}

        {activeSlide.id === 'come-join-us' && <div className="hero-raindrop-pattern" />}

        {activeSlide.id === 'moon-color' && (
          <div className="hero-starlight-layer">
            <span className="hero-floating-star star-1">✦</span>
            <span className="hero-floating-star star-2">✧</span>
            <span className="hero-floating-star star-3">✦</span>
          </div>
        )}
      </div>

      {/* Slides Viewport */}
      <div className="hero-slides-stage relative mx-auto w-full max-w-[1480px]">
        {HERO_SLIDES.map((slide, index) => {
          const isCurrent = index === activeIndex;
          const imgSrc = getFallbackImage(slide);

          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${totalSlides}: ${slide.titleLines.join(' ')}`}
              aria-hidden={!isCurrent}
              className={`hero-slide-panel ${isCurrent ? 'is-active' : 'is-inactive'} ${
                slide.layout === 'book-showcase'
                  ? 'layout-book-showcase'
                  : slide.layout === 'centered'
                  ? 'layout-centered'
                  : 'layout-split'
              }`}
            >
              {slide.layout === 'book-showcase' ? (
                /* Coco Wyo-Inspired 3D Standing Book Tabletop Stage Showcase */
                <div className="cocowyo-hero-stage">
                  {/* Sunlit Sheer Curtain Backdrop */}
                  <div className="cocowyo-curtain-backdrop" aria-hidden="true" />

                  {/* Warm Wooden Tabletop Surface */}
                  <div className="cocowyo-wood-table" aria-hidden="true">
                    <div className="cocowyo-wood-edge" />
                    <div className="cocowyo-wood-grain" />
                  </div>

                  {/* Hand-Drawn Rose Stage Curtains (Left & Right) */}
                  <svg
                    className="cocowyo-stage-drape drape-left"
                    viewBox="0 0 130 620"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 0 H118 C102 150, 76 290, 56 420 C76 485, 88 555, 92 620 H0 Z"
                      fill="#CE5A70"
                      stroke="#2B1B19"
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M36 0 C32 140, 24 285, 18 415 M76 0 C66 145, 50 285, 36 420"
                      fill="none"
                      stroke="#2B1B19"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 412 Q32 426 60 415"
                      fill="none"
                      stroke="#F6D056"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 412 Q32 426 60 415"
                      fill="none"
                      stroke="#2B1B19"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <svg
                    className="cocowyo-stage-drape drape-right"
                    viewBox="0 0 130 620"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M130 0 H12 C28 150, 54 290, 74 420 C54 485, 42 555, 38 620 H130 Z"
                      fill="#CE5A70"
                      stroke="#2B1B19"
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M94 0 C98 140, 106 285, 112 415 M54 0 C64 145, 80 285, 94 420"
                      fill="none"
                      stroke="#2B1B19"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M130 412 Q98 426 70 415"
                      fill="none"
                      stroke="#F6D056"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M130 412 Q98 426 70 415"
                      fill="none"
                      stroke="#2B1B19"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Foreground Tabletop Content Grid */}
                  <div className="cocowyo-stage-inner shell">
                    {/* Left Column: 3D Standing Book + Tabletop Props */}
                    <div className="cocowyo-book-pedestal">
                      {/* Floating "NEW BOOK" Messenger Star Doodle */}
                      <div className="cocowyo-new-order-badge" aria-hidden="true">
                        <svg viewBox="0 0 120 110" className="w-24 h-22">
                          <g stroke="#2B1B19" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
                            {/* Cute Star Messenger with Cap */}
                            <path
                              d="M58 14 L68 32 L88 35 L73 49 L77 69 L58 59 L39 69 L43 49 L28 35 L48 32 Z"
                              fill="#FFE066"
                            />
                            {/* Blue delivery cap */}
                            <path d="M42 22 C46 10, 70 10, 75 22 Z" fill="#82B6D9" />
                            <path d="M38 22 H79" strokeWidth="4" />
                            <circle cx="51" cy="41" r="2.2" fill="#2B1B19" />
                            <circle cx="65" cy="41" r="2.2" fill="#2B1B19" />
                            <path d="M55 45 Q58 48 61 45" fill="none" />
                            {/* Hanging "NEW BOOK" Tag */}
                            <rect
                              x="32"
                              y="56"
                              width="54"
                              height="40"
                              rx="6"
                              transform="rotate(-8 59 76)"
                              fill="#FFF6CC"
                            />
                          </g>
                          <text
                            x="58"
                            y="74"
                            textAnchor="middle"
                            transform="rotate(-8 58 74)"
                            fill="#2B1B19"
                            fontFamily="Fredoka, sans-serif"
                            fontWeight="800"
                            fontSize="11"
                          >
                            NEW
                          </text>
                          <text
                            x="60"
                            y="87"
                            textAnchor="middle"
                            transform="rotate(-8 60 87)"
                            fill="#C94A5E"
                            fontFamily="Fredoka, sans-serif"
                            fontWeight="800"
                            fontSize="11"
                          >
                            BOOK!
                          </text>
                        </svg>
                      </div>

                      {/* Left Angled Alcohol Marker on Tabletop */}
                      <svg
                        className="cocowyo-table-marker marker-left"
                        viewBox="0 0 190 54"
                        aria-hidden="true"
                      >
                        <ellipse cx="95" cy="36" rx="82" ry="8" fill="rgba(42, 24, 14, 0.24)" />
                        <g transform="rotate(-19 95 26)" stroke="#2B1B19" strokeWidth="3" strokeLinejoin="round">
                          <rect x="14" y="16" width="128" height="20" rx="5" fill="#F9F7F4" />
                          <rect x="136" y="16" width="34" height="20" rx="4" fill="#9ED2C6" />
                          <rect x="168" y="19" width="8" height="14" rx="2" fill="#7BB8AA" />
                          <line x1="42" y1="16" x2="42" y2="36" />
                          <text
                            x="78"
                            y="29"
                            textAnchor="middle"
                            fill="#5A524C"
                            stroke="none"
                            fontFamily="Fredoka, sans-serif"
                            fontWeight="700"
                            fontSize="8.5"
                          >
                            Moon Mesh · Brush
                          </text>
                        </g>
                      </svg>

                      {/* Hand-Drawn "We are open" Wooden A-Frame Sign */}
                      <svg
                        className="cocowyo-open-sign"
                        viewBox="0 0 120 132"
                        aria-hidden="true"
                      >
                        <ellipse cx="60" cy="122" rx="46" ry="7" fill="rgba(42, 24, 14, 0.25)" />
                        <g stroke="#2B1B19" strokeWidth="3.8" strokeLinejoin="round" strokeLinecap="round">
                          {/* Back leg */}
                          <path d="M62 20 L92 114 L74 114 L54 44" fill="#D59B6A" />
                          {/* Front board */}
                          <rect
                            x="18"
                            y="16"
                            width="68"
                            height="100"
                            rx="8"
                            transform="rotate(-4 52 66)"
                            fill="#F7C99B"
                          />
                          {/* Inner cutout */}
                          <path d="M32 115 L36 102 H66 L70 115" fill="#7D5230" />
                          {/* Little sprout leaf */}
                          <path d="M88 112 C94 96, 110 98, 104 112 Z" fill="#8CC671" />
                          <path d="M88 112 C80 100, 68 106, 78 114 Z" fill="#A4D688" />
                        </g>
                        <g transform="rotate(-4 52 66)" fill="#2B1B19" fontFamily="Fredoka, sans-serif" fontWeight="700">
                          <text x="52" y="42" textAnchor="middle" fontSize="13">
                            We are
                          </text>
                          <text x="52" y="58" textAnchor="middle" fontSize="14">
                            open
                          </text>
                          <path
                            d="M36 68 H66 M60 63 L67 68 L60 73"
                            fill="none"
                            stroke="#2B1B19"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Cute coffee/tea cup icon */}
                          <path
                            d="M42 84 H60 V94 C60 99, 42 99, 42 94 Z"
                            fill="#FFFDF7"
                            stroke="#2B1B19"
                            strokeWidth="3"
                          />
                          <path
                            d="M60 86 H64 C67 86, 67 92, 64 92 H60"
                            fill="none"
                            stroke="#2B1B19"
                            strokeWidth="2.8"
                          />
                          <path
                            d="M47 78 Q49 74 47 71 M54 78 Q56 74 54 71"
                            fill="none"
                            stroke="#2B1B19"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                          />
                        </g>
                      </svg>

                      {/* The 3D Standing Book on the Wooden Tabletop */}
                      <button
                        type="button"
                        className="cocowyo-3d-book-btn"
                        aria-label={`Peek inside ${activeShowcaseBook.title}`}
                        onClick={() => onPreviewBook(activeShowcaseBook)}
                      >
                        <div
                          className={`cocowyo-3d-book ${activeShowcaseBook.themeClass}`}
                          style={
                            {
                              '--spine-bg': activeShowcaseBook.spineColor,
                              '--spine-ink': activeShowcaseBook.spineTextColor,
                            } as React.CSSProperties
                          }
                        >
                          {/* Cast shadow on wood tabletop */}
                          <span className="book-table-shadow" aria-hidden="true" />

                          {/* Left 3D Spine */}
                          <span className="book-3d-spine" aria-hidden="true">
                            <span className="spine-emblem">✦</span>
                            <span className="spine-brand">Moon Mesh</span>
                            <span className="spine-title">{activeShowcaseBook.title}</span>
                            <span className="spine-no">{activeShowcaseBook.number}</span>
                          </span>

                          {/* Top 3D Paper Pages Block */}
                          <span className="book-3d-pages-top" aria-hidden="true" />

                          {/* Front Cover */}
                          <span className="book-3d-front">
                            {activeShowcaseBook.fullBleedCover ? (
                              <img
                                src={activeShowcaseBook.coverImage}
                                width={760}
                                height={570}
                                alt={activeShowcaseBook.title}
                                className="book-3d-fullbleed-img"
                              />
                            ) : (
                              <span className="book-3d-structured-cover">
                                <span className="cover-brand">Moon Mesh</span>
                                <span className="cover-no">{activeShowcaseBook.number}</span>
                                <span className="cover-title">
                                  {activeShowcaseBook.titleTop}
                                  <br />
                                  <em>{activeShowcaseBook.titleEm}</em>
                                </span>
                                <img
                                  src={activeShowcaseBook.coverImage}
                                  width={680}
                                  height={680}
                                  alt={activeShowcaseBook.title}
                                />
                                <span className="cover-edition">A coloring adventure</span>
                              </span>
                            )}
                            <span className="book-3d-hinge-crease" aria-hidden="true" />
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Right Column: Coco Wyo-Style Collaboration Lockup + Grand Opening Title + Ribbon Cutting */}
                    <div className="cocowyo-stage-copy">
                      {/* Top Collaboration Lockup (like Coco Wyo × Penguin Random House) */}
                      <div className="cocowyo-collab-lockup">
                        <span className="collab-script">Moon Mesh</span>
                        <span className="collab-x" aria-hidden="true">
                          ×
                        </span>
                        <span className="collab-badge" aria-hidden="true">
                          <svg viewBox="0 0 40 40" className="w-9 h-9">
                            <ellipse
                              cx="20"
                              cy="20"
                              rx="16"
                              ry="18"
                              fill="#F6B856"
                              stroke="#2B1B19"
                              strokeWidth="2.8"
                            />
                            {/* Mini Miso cat face inside emblem */}
                            <path
                              d="M11 16 L13 9 L18 13 Q20 12 22 13 L27 9 L29 16 C31 21, 29 28, 20 28 C11 28, 9 21, 11 16 Z"
                              fill="#FFFDF7"
                              stroke="#2B1B19"
                              strokeWidth="2.4"
                              strokeLinejoin="round"
                            />
                            <circle cx="16.5" cy="20" r="1.6" fill="#2B1B19" />
                            <circle cx="23.5" cy="20" r="1.6" fill="#2B1B19" />
                            <path
                              d="M18.5 22 Q20 23.5 21.5 22"
                              fill="none"
                              stroke="#2B1B19"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                        <span className="collab-divider" aria-hidden="true" />
                        <span className="collab-imprint">
                          Miso &amp; Friends
                          <small>Storybook Studio</small>
                        </span>
                      </div>

                      {/* Grand Opening Headline + Script Book Title */}
                      <h1
                        id={isCurrent ? 'hero-title' : undefined}
                        className="cocowyo-grand-heading"
                      >
                        <span className="grand-block-line">
                          {activeShowcaseBook.stageTagline}
                        </span>
                        <span className="grand-script-line">{activeShowcaseBook.title}</span>
                      </h1>

                      <p className="cocowyo-stage-subtitle">{activeShowcaseBook.description}</p>

                      {/* Book Switcher Pills so all books can be showcased on the Coco Wyo Hero Stage */}
                      <div
                        className="cocowyo-book-switcher"
                        role="group"
                        aria-label="Showcase a Moon Mesh book on the stage"
                      >
                        {BOOKS.map((b, bIdx) => {
                          const isSelected = bIdx === showcaseBookIndex;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              aria-pressed={isSelected}
                              className={`cocowyo-switch-pill ${isSelected ? 'is-active' : ''}`}
                              onClick={() => {
                                setIsAutoPlaying(false);
                                setShowcaseBookIndex(bIdx);
                              }}
                            >
                              <span
                                className="switch-dot"
                                style={{ backgroundColor: b.spineColor }}
                                aria-hidden="true"
                              />
                              <span>{b.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Primary & Secondary CTAs */}
                      <div className="hero-actions justify-center">
                        <a
                          className="button button-ink whitespace-nowrap shrink-0"
                          href={slide.primaryCta.href}
                          onClick={(e) => handleCtaClick(e, slide.primaryCta)}
                          tabIndex={isCurrent ? 0 : -1}
                        >
                          {slide.primaryCta.label}
                          <svg className="icon" aria-hidden="true">
                            <use href="#arrow" />
                          </svg>
                        </a>
                        <a
                          className="button button-paper whitespace-nowrap shrink-0"
                          href={slide.secondaryCta.href}
                          onClick={(e) => handleCtaClick(e, slide.secondaryCta)}
                          tabIndex={isCurrent ? 0 : -1}
                        >
                          {slide.secondaryCta.label}
                        </a>
                      </div>

                      {/* Tabletop Celebration Props: Ribbon Stanchions + "Now serving cozy moments" + Right Marker */}
                      <div className="cocowyo-table-celebration" aria-hidden="true">
                        {/* Velvet Rope Ribbon-Cutting Stanchions */}
                        <svg viewBox="0 0 210 92" className="cocowyo-ribbon-stanchions">
                          <ellipse cx="34" cy="82" rx="22" ry="6" fill="rgba(42, 24, 14, 0.25)" />
                          <ellipse cx="176" cy="82" rx="22" ry="6" fill="rgba(42, 24, 14, 0.25)" />
                          <g stroke="#2B1B19" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                            {/* Pink velvet ribbon */}
                            <path
                              d="M36 36 C78 68, 132 68, 174 36 L174 48 C132 80, 78 80, 36 48 Z"
                              fill="#F2849E"
                            />
                            {/* Left stanchion pole */}
                            <ellipse cx="34" cy="79" rx="18" ry="6" fill="#C9CED6" />
                            <rect x="30" y="24" width="8" height="55" rx="3" fill="#DDE2EA" />
                            <circle cx="34" cy="20" r="9" fill="#DDE2EA" />
                            {/* Right stanchion pole */}
                            <ellipse cx="176" cy="79" rx="18" ry="6" fill="#C9CED6" />
                            <rect x="172" y="24" width="8" height="55" rx="3" fill="#DDE2EA" />
                            <circle cx="176" cy="20" r="9" fill="#DDE2EA" />
                            {/* Cute Pip Star in the center holding tiny scissors */}
                            <path
                              d="M105 12 L114 28 L132 31 L119 44 L122 62 L105 53 L88 62 L91 44 L78 31 L96 28 Z"
                              fill="#FFE066"
                            />
                            <circle cx="99" cy="37" r="2.2" fill="#2B1B19" />
                            <circle cx="111" cy="37" r="2.2" fill="#2B1B19" />
                            <path d="M102 41 Q105 44 108 41" fill="none" />
                          </g>
                        </svg>

                        {/* "Now serving cozy moments" Speech Bubble + Sprout */}
                        <div className="cocowyo-serving-bubble">
                          <span>Now serving</span>
                          <span>Cozy moments ♡</span>
                        </div>

                        {/* Right Alcohol Marker on Tabletop */}
                        <svg
                          className="cocowyo-table-marker marker-right"
                          viewBox="0 0 180 46"
                          aria-hidden="true"
                        >
                          <ellipse cx="90" cy="32" rx="76" ry="7" fill="rgba(42, 24, 14, 0.22)" />
                          <g transform="rotate(-5 90 22)" stroke="#2B1B19" strokeWidth="3" strokeLinejoin="round">
                            <rect x="10" y="14" width="16" height="16" rx="3" fill="#F4C44E" />
                            <rect x="24" y="12" width="32" height="20" rx="4" fill="#FFFDF7" />
                            <rect x="54" y="12" width="112" height="20" rx="5" fill="#F7F4F0" />
                            <path d="M58 34 C66 26, 78 28, 82 36 Z" fill="#98C978" />
                          </g>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ) : slide.layout === 'centered' ? (
                /* Centered "COME JOIN US" Coco Wyo-inspired Banner Layout */
                <div className="hero-centered-inner shell">
                  <div className="hero-centered-art-wrap">
                    <img
                      src={imgSrc}
                      width={1600}
                      height={900}
                      alt={slide.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImageErrors((prev) => ({ ...prev, [slide.id]: true }))
                      }
                      className="hero-centered-img"
                    />
                  </div>
                  <div className="hero-centered-overlay-bar">
                    <p className="hero-centered-subtitle">{slide.subtitle}</p>
                    <div className="hero-actions justify-center">
                      <a
                        className="button button-ink whitespace-nowrap shrink-0"
                        href={slide.primaryCta.href}
                        onClick={(e) => handleCtaClick(e, slide.primaryCta)}
                        tabIndex={isCurrent ? 0 : -1}
                      >
                        {slide.primaryCta.label}
                        <svg className="icon" aria-hidden="true">
                          <use href="#arrow" />
                        </svg>
                      </a>
                      <a
                        className="button button-paper whitespace-nowrap shrink-0"
                        href={slide.secondaryCta.href}
                        onClick={(e) => handleCtaClick(e, slide.secondaryCta)}
                        tabIndex={isCurrent ? 0 : -1}
                      >
                        {slide.secondaryCta.label}
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Split Layout ("Make the moon your color", "READY FOR a little COLORiNG TREAT?") */
                <>
                  <div className="hero-art">
                    <img
                      src={imgSrc}
                      width={1600}
                      height={900}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      alt={slide.imageAlt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setImageErrors((prev) => ({ ...prev, [slide.id]: true }))
                      }
                      className="hero-float-art"
                    />
                  </div>
                  <div className="hero-inner shell">
                    <div className="hero-copy">
                      <p className="eyebrow">{slide.eyebrow}</p>

                      {slide.id === 'coloring-treat' ? (
                        <h1 className="hero-treat-heading">
                          <span className="treat-block-line">{slide.titleLines[0]}</span>
                          <span className="treat-script-line">{slide.titleLines[1]}</span>
                          <span className="treat-block-line">{slide.titleLines[2]}</span>
                          <span className="treat-block-line">{slide.titleLines[3]}</span>
                        </h1>
                      ) : slide.id === 'moon-color' ? (
                        <h1 id={isCurrent ? 'hero-title' : undefined}>
                          Make the
                          <br />
                          <span className="marker-highlight">moon</span>
                          <br />
                          your <span className="marker-underline">color.</span>
                        </h1>
                      ) : (
                        <h1>
                          {slide.titleLines[0]}
                          <br />
                          <span className="marker-highlight">{slide.titleLines[1]}</span>
                          <br />
                          <span className="marker-underline">{slide.titleLines[2]}</span>
                        </h1>
                      )}

                      <p className="hero-lede">{slide.subtitle}</p>

                      <div className="hero-actions">
                        <a
                          className="button button-ink whitespace-nowrap shrink-0"
                          href={slide.primaryCta.href}
                          onClick={(e) => handleCtaClick(e, slide.primaryCta)}
                          tabIndex={isCurrent ? 0 : -1}
                        >
                          {slide.primaryCta.label}
                          <svg className="icon" aria-hidden="true">
                            <use href="#arrow" />
                          </svg>
                        </a>
                        <a
                          className="text-link whitespace-nowrap shrink-0"
                          href={slide.secondaryCta.href}
                          onClick={(e) => handleCtaClick(e, slide.secondaryCta)}
                          tabIndex={isCurrent ? 0 : -1}
                        >
                          {slide.secondaryCta.label}
                        </a>
                      </div>

                      {slide.signoff && (
                        <p className="hero-signoff">
                          {slide.signoff.replace('♡', '')}{' '}
                          {slide.signoff.includes('♡') && <span aria-hidden="true">♡</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Coco Wyo-inspired White Bottom Pagination Dots Strip (Pause button removed) */}
      <div className="hero-pagination-bar" role="region" aria-label="Hero slide controls">
        <div className="shell flex items-center justify-center gap-3 py-2.5">
          <button
            type="button"
            className="hero-nav-arrow"
            onClick={() => {
              setIsAutoPlaying(false);
              handlePrev();
            }}
            aria-label="Previous hero slide"
          >
            ‹
          </button>

          <div className="hero-dots" role="tablist" aria-label="Choose a hero slide">
            {HERO_SLIDES.map((slide, idx) => {
              const selected = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Slide ${idx + 1}: ${slide.titleLines.join(' ')}`}
                  className={`hero-dot ${selected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    handleGoTo(idx);
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            className="hero-nav-arrow"
            onClick={() => {
              setIsAutoPlaying(false);
              handleNext();
            }}
            aria-label="Next hero slide"
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
};
