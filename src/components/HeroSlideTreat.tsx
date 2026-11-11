import React from 'react';
import { motion } from 'motion/react';

interface HeroSlideTreatProps {
  onOpenStudio: () => void;
  isCurrent: boolean;
}

const CONFETTI_COLORS = ['#F5C95D', '#70B5E8', '#7BC697'];

export const HeroSlideTreat: React.FC<HeroSlideTreatProps> = ({ onOpenStudio, isCurrent }) => {
  return (
    <div className="hero-centered-inner shell is-treat-slide relative overflow-hidden">
      {/* Background Confetti Ribbons */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-6 rounded-full opacity-60"
            style={{
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              rotate: `${Math.random() * 360}deg`,
            }}
            animate={isCurrent ? {
              y: [0, -20, 0],
              rotate: [0, 15, -15, 0],
              opacity: [0.4, 0.7, 0.4],
            } : {}}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="hero-centered-art-wrap hero-treat-art-wrap">
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          animate={isCurrent ? {
            y: [0, -8, 0],
          } : {}}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Mascot SVG with animations */}
          <svg
            viewBox="0 0 500 500"
            className="w-full max-w-[600px] h-auto drop-shadow-2xl cursor-pointer"
            onClick={onOpenStudio}
          >
            {/* Mascot Body (Simplified representation for animation) */}
            <motion.g
              animate={isCurrent ? {
                rotate: [-0.5, 0.5, -0.5],
              } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* This would ideally be the full mascot SVG from the design */}
              <circle cx="250" cy="300" r="120" fill="#FFFDF7" stroke="#322F37" strokeWidth="6" />
              
              {/* Strawberry Bonnet */}
              <motion.g
                animate={isCurrent ? {
                  rotate: [-2, 2, -2],
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M150 250 Q250 150 350 250" fill="#F06464" stroke="#322F37" strokeWidth="6" />
                {/* Seeds */}
                <circle cx="200" cy="200" r="3" fill="#FEEBF0" />
                <circle cx="250" cy="180" r="3" fill="#FEEBF0" />
                <circle cx="300" cy="200" r="3" fill="#FEEBF0" />
              </motion.g>

              {/* Face */}
              <motion.g
                animate={isCurrent ? {
                  scaleY: [1, 0.1, 1],
                } : {}}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }}
              >
                <circle cx="210" cy="300" r="5" fill="#322F37" />
                <circle cx="290" cy="300" r="5" fill="#322F37" />
              </motion.g>
              <path d="M240 320 Q250 330 260 320" fill="none" stroke="#322F37" strokeWidth="3" strokeLinecap="round" />

              {/* Tulip Bouquet */}
              <motion.g
                className="tulip-bouquet"
                animate={isCurrent ? {
                  rotate: [-3, 3, -3],
                  x: [-2, 2, -2],
                } : {}}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M220 350 L180 420 M250 360 L250 430 M280 350 L320 420" stroke="#4FB483" strokeWidth="8" strokeLinecap="round" />
                {/* Flowers */}
                <circle cx="180" cy="420" r="25" fill="#F06464" />
                <circle cx="250" cy="430" r="25" fill="#F5C95D" />
                <circle cx="320" cy="420" r="25" fill="#B79BDD" />
              </motion.g>
            </motion.g>
          </svg>
          
          {/* Script Text Overlay */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isCurrent ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {/* The text itself is handled by the parent layout, but we can add sparkles here */}
          </motion.div>
        </motion.div>
      </div>

      <div className="hero-centered-overlay-bar hero-treat-quote-only">
        <p className="hero-centered-subtitle">
          Miso put on a strawberry beret just for you! Grab a warm mug and color a page.
        </p>
      </div>
    </div>
  );
};
