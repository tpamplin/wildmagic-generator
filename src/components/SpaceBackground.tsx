import { useMemo } from 'react';

/** Reduce element counts on mobile to prevent GPU compositor overload. */
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  // Touchscreen + narrow viewport = mobile device
  return window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}

const STAR_COUNT_DESKTOP = 300;
const STAR_COUNT_MOBILE = 80;
const CLOUD_COUNT_DESKTOP = 16;
const CLOUD_COUNT_MOBILE = 6;

interface Star {
  id: number;
  left: number;
  bottom: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface Cloud {
  id: number;
  left: number;
  bottom: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    // Half spawn from right edge, half from bottom edge — fills the full screen
    const fromRight = i % 2 === 0;
    return {
      id: i,
      left: fromRight ? 100 + Math.random() * 30 : -10 + Math.random() * 120,
      bottom: fromRight ? -10 + Math.random() * 120 : -30 + Math.random() * 20,
      size: Math.random() < 0.12 ? 3 : Math.random() < 0.25 ? 2 : 1,
      opacity: 0.25 + Math.random() * 0.75,
      duration: 25 + Math.random() * 35,
      delay: -(Math.random() * 60),
    };
  });
}

function generateClouds(count: number): Cloud[] {
  const colors = [
    'rgba(30, 60, 200, 0.22)',
    'rgba(180, 30, 60, 0.18)',
    'rgba(15, 35, 150, 0.20)',
    'rgba(0, 180, 160, 0.12)',
    'rgba(140, 20, 50, 0.15)',
    'rgba(30, 150, 180, 0.10)',
  ];
  return Array.from({ length: count }, (_, i) => {
    const fromRight = i % 2 === 0;
    return {
      id: i,
      left: fromRight ? 120 + Math.random() * 40 : -30 + Math.random() * 140,
      bottom: fromRight ? -30 + Math.random() * 140 : -60 + Math.random() * 40,
      width: 500 + Math.random() * 700,
      height: 400 + Math.random() * 500,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.6 + Math.random() * 0.4,
      duration: 50 + Math.random() * 30,
      delay: -(Math.random() * 80),
    };
  });
}

export function SpaceBackground() {
  const stars = useMemo(() => generateStars(isMobile() ? STAR_COUNT_MOBILE : STAR_COUNT_DESKTOP), []);
  const clouds = useMemo(() => generateClouds(isMobile() ? CLOUD_COUNT_MOBILE : CLOUD_COUNT_DESKTOP), []);

  return (
    <div className="space-bg" aria-hidden="true">
      {stars.map((s) => (
        <div
          key={s.id}
          className="space-star"
          style={{
            left: s.left + '%',
            bottom: s.bottom + '%',
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDuration: s.duration + 's',
            animationDelay: s.delay + 's',
          }}
        />
      ))}
      {clouds.map((c) => (
        <div
          key={'c' + c.id}
          className="space-cloud"
          style={{
            left: c.left + '%',
            bottom: c.bottom + '%',
            width: c.width,
            height: c.height,
            background: `radial-gradient(ellipse, ${c.color} 0%, transparent 70%)`,
            animationDuration: c.duration + 's',
            animationDelay: c.delay + 's',
          }}
        />
      ))}
    </div>
  );
}
