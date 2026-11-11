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
