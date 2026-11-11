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
      {/* Animated Storybook Background Effects Layer per Slide */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Soft glowing pastel aura spheres */}
        <div className="hero-ambient-aura aura-left" />
        <div className="hero-ambient-aura aura-right" />

        {/* Hand-drawn drifting storybook clouds & twinkling stars */}
        <svg
          className="hero-bg-clouds-svg"
          viewBox="0 0 1440 620"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="heroCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#FFF3D6" stopOpacity="0.45" />
            </linearGradient>
            <radialGradient id="heroSunGlow" cx="72%" cy="38%" r="48%">
              <stop offset="0%" stopColor="#FFE89E" stopOpacity="0.55" />
              <stop offset="55%" stopColor="#FFD6E0" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="620" fill="url(#heroSunGlow)" />
          {/* Soft hand-drawn clouds */}
          <g className="hero-cloud-drift-slow" fill="url(#heroCloudGrad)" stroke="#3A2824" strokeOpacity="0.12" strokeWidth="2.5">
            <path d="M90 135 C90 112, 118 98, 142 108 C156 84, 196 84, 212 108 C236 102, 258 118, 254 140 C252 152, 236 158, 214 158 L112 158 C96 158, 90 148, 90 135 Z" />
            <path d="M1140 110 C1140 88, 1168 74, 1192 84 C1208 60, 1248 60, 1264 84 C1288 78, 1310 94, 1306 116 C1304 128, 1288 134, 1266 134 L1162 134 C1146 134, 1140 124, 1140 110 Z" />
          </g>
          <g className="hero-cloud-drift-fast" fill="url(#heroCloudGrad)" stroke="#3A2824" strokeOpacity="0.1" strokeWidth="2">
            <path d="M510 92 C510 75, 532 64, 550 72 C562 54, 592 54, 604 72 C622 68, 638 80, 635 96 C633 105, 621 110, 605 110 L526 110 C514 110, 510 102, 510 92 Z" />
            <path d="M360 495 C360 478, 382 467, 400 475 C412 457, 442 457, 454 475 C472 471, 488 483, 485 499 C483 508, 471 513, 455 513 L376 513 C364 513, 360 505, 360 495 Z" />
          </g>
          {/* Hand-drawn twinkling stars & sparkles */}
          <g fill="#F6C84C" stroke="#2B1B19" strokeWidth="2" strokeLinejoin="round">
            <path
              className="hero-svg-star star-a"
              d="M448 164 L453 176 L466 178 L456 187 L459 200 L448 193 L437 200 L440 187 L430 178 L443 176 Z"
            />
            <path
              className="hero-svg-star star-b"
              d="M1018 152 L1022 161 L1032 163 L1025 170 L1027 180 L1018 175 L1009 180 L1011 170 L1004 163 L1014 161 Z"
            />
            <path
              className="hero-svg-star star-c"
              d="M620 430 L624 439 L634 441 L627 448 L629 458 L620 453 L611 458 L613 448 L606 441 L616 439 Z"
            />
          </g>
        </svg>

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
      <div className="hero-slides-stage relative mx-auto w-full max-w-[1600px]">
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
                /* Provided Coco Wyo-Style Full-Bleed Book Showcase Stage + Interactive Book Switcher */
                <div className="cocowyo-showcase-banner-wrap">
                  <h1 id={isCurrent ? 'hero-title' : undefined} className="sr-only">
                    Moon Mesh — {activeShowcaseBook.stageTagline} {activeShowcaseBook.title}
                  </h1>

                  {/* Main Full-Bleed Stage Artwork (User's Provided Book Showcase Image) */}
                  <div className="cocowyo-banner-figure">
                    <img
                      src={imgSrc}
                      width={2000}
                      height={756}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      alt={`${activeShowcaseBook.title} — Moon Mesh Grand Opening Book Showcase`}
                      className="cocowyo-banner-img"
                      onClick={() => onPreviewBook(activeShowcaseBook)}
                    />

                    {/* Clickable hotspot over the standing 3D book on the wooden tabletop */}
                    <button
                      type="button"
                      className="cocowyo-banner-book-hotspot"
                      aria-label={`Peek inside ${activeShowcaseBook.title}`}
                      onClick={() => onPreviewBook(activeShowcaseBook)}
                    >
                      {/* When user switches to Books #2, #3, or #4, display that book standing in 3D on the tabletop */}
                      {showcaseBookIndex > 0 && (
                        <div
                          className={`cocowyo-3d-book cocowyo-overlay-book ${activeShowcaseBook.themeClass}`}
                          style={
                            {
                              '--spine-bg': activeShowcaseBook.spineColor,
                              '--spine-ink': activeShowcaseBook.spineTextColor,
                            } as React.CSSProperties
                          }
                        >
                          <span className="book-table-shadow" aria-hidden="true" />
                          <span className="book-3d-spine" aria-hidden="true">
                            <span className="spine-emblem">✦</span>
                            <span className="spine-brand">Moon Mesh</span>
                            <span className="spine-title">{activeShowcaseBook.title}</span>
                            <span className="spine-no">{activeShowcaseBook.number}</span>
                          </span>
                          <span className="book-3d-pages-top" aria-hidden="true" />
                          <span className="book-3d-front">
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
                            <span className="book-3d-hinge-crease" aria-hidden="true" />
                          </span>
    </section>
  );
}
