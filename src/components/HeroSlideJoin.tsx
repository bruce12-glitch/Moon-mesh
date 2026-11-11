import React from 'react';
import { motion } from 'motion/react';

interface HeroSlideJoinProps {
  isCurrent: boolean;
}

export const HeroSlideJoin: React.FC<HeroSlideJoinProps> = ({ isCurrent }) => {
  return (
    <div className="hero-centered-inner shell is-join-slide relative overflow-hidden">
      {/* Background Teardrop Drift */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-20"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${(i * 12) % 100}%`,
            }}
            animate={isCurrent ? {
              y: [0, 50],
              opacity: [0.1, 0.3, 0.1],
            } : {}}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -10,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#F4AD32">
              <path d="M12 21.5c-3.3 0-6-2.7-6-6s6-12 6-12 6 8.7 6 12-2.7 6-6 6z" />
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="hero-centered-art-wrap hero-join-art-wrap">
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          animate={isCurrent ? {
            scale: [1, 1.02, 1],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Heart Beat SVG */}
          <svg viewBox="0 0 600 600" className="w-full max-w-[700px] h-auto drop-shadow-2xl">
            {/* The Heart */}
            <motion.path
              d="M300 450 C150 350 100 250 100 150 C100 50 200 50 300 150 C400 50 500 50 500 150 C500 250 450 350 300 450 Z"
              fill="#F06464"
              stroke="#322F37"
              strokeWidth="8"
              animate={isCurrent ? {
                scale: [1, 1.05, 1],
              } : {}}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Bubble Text */}
            <motion.g
              className="select-none pointer-events-none"
              animate={isCurrent ? {
                y: [-2, 2, -2],
              } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <text
                x="300"
                y="200"
                textAnchor="middle"
                fill="white"
                stroke="#322F37"
                strokeWidth="10"
                paintOrder="stroke"
                style={{ fontSize: '70px', fontWeight: 'bold', fontFamily: 'system-ui' }}
              >
                COME
              </text>
              <text
                x="300"
                y="280"
                textAnchor="middle"
                fill="white"
                stroke="#322F37"
                strokeWidth="10"
                paintOrder="stroke"
                style={{ fontSize: '70px', fontWeight: 'bold', fontFamily: 'system-ui' }}
              >
                JOIN
              </text>
              <text
                x="300"
                y="360"
                textAnchor="middle"
                fill="white"
                stroke="#322F37"
                strokeWidth="10"
                paintOrder="stroke"
                style={{ fontSize: '70px', fontWeight: 'bold', fontFamily: 'system-ui' }}
              >
                US
              </text>
            </motion.g>

            {/* Characters hugging (Simplified) */}
            <motion.g
              className="huggers"
              animate={isCurrent ? {
                x: [-5, 5, -5],
              } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Left Hugger */}
              <circle cx="120" cy="300" r="60" fill="#8B5E3C" stroke="#322F37" strokeWidth="6" />
              {/* Right Hugger */}
              <circle cx="480" cy="300" r="60" fill="#F5A9BC" stroke="#322F37" strokeWidth="6" />
            </motion.g>

            {/* Top Bouncer (Pip) */}
            <motion.g
              animate={isCurrent ? {
                y: [0, -20, 0],
                rotate: [-5, 5, -5],
              } : {}}
              transition={{ duration: 1.2, repeat: Infinity, ease: "backOut" }}
            >
              <path
                d="M300 80 L310 100 L330 105 L315 120 L320 140 L300 130 L280 140 L285 120 L270 105 L290 100 Z"
                fill="#F5C95D"
                stroke="#322F37"
                strokeWidth="4"
              />
            </motion.g>
          </svg>
        </motion.div>
      </div>

      <div className="hero-centered-overlay-bar">
        <p className="hero-centered-subtitle">
          Pull up a cushion with Miso, Pip, Plum, and Sprout!
        </p>
      </div>
    </div>
  );
};
