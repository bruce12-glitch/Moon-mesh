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
}
