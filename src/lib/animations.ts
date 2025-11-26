/**
 * Standard animation configurations for consistent UX
 * Inspired by professional apps (Notion, Linear, etc.)
 *
 * Philosophy:
 * - Subtle but noticeable
 * - Fast enough to feel responsive
 * - Smooth enough to feel polished
 * - Consistent across the app
 */

import { Transition } from 'framer-motion';

// ============================================
// TIMING CONSTANTS
// ============================================

/**
 * Standard durations - use these for consistent timing
 */
export const DURATIONS = {
  /** Ultra fast - for micro-interactions (150ms) */
  instant: 0.15,

  /** Fast - for immediate feedback (250ms) */
  fast: 0.25,

  /** Normal - default for most animations (400ms) */
  normal: 0.4,

  /** Moderate - for larger movements (500ms) */
  moderate: 0.5,

  /** Slow - for dramatic effects (600ms) */
  slow: 0.6,
} as const;

/**
 * Standard easing curves
 */
export const EASINGS = {
  /** Smooth deceleration - best for exits and fades */
  easeOut: [0.16, 1, 0.3, 1],

  /** Smooth acceleration - best for entrances */
  easeIn: [0.4, 0, 1, 1],

  /** Smooth both ways - best for movements */
  easeInOut: [0.4, 0, 0.2, 1],

  /** Sharp snap - for instant feedback */
  sharp: [0.4, 0, 0.6, 1],
} as const;

/**
 * Spring configurations for natural physics
 */
export const SPRINGS = {
  /** Gentle bounce - subtle and professional */
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
  },

  /** Snappy - quick response with slight bounce */
  snappy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },

  /** Bouncy - more playful, visible bounce */
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },

  /** Smooth - no bounce, just smooth motion */
  smooth: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 30,
  },
} as const;

// ============================================
// PRESET TRANSITIONS
// ============================================

/**
 * Modal/Dialog transitions - smooth and professional
 */
export const MODAL_TRANSITION: Transition = {
  duration: DURATIONS.moderate,
  ease: EASINGS.easeOut,
};

/**
 * Backdrop fade - quick and subtle
 */
export const BACKDROP_TRANSITION: Transition = {
  duration: DURATIONS.fast,
  ease: EASINGS.easeOut,
};

/**
 * Drawer slide - smooth with slight bounce
 */
export const DRAWER_TRANSITION: Transition = {
  ...SPRINGS.smooth,
  duration: DURATIONS.moderate,
};

/**
 * Card/Item hover - instant feedback
 */
export const HOVER_TRANSITION: Transition = {
  duration: DURATIONS.instant,
  ease: EASINGS.sharp,
};

/**
 * Button tap - immediate response
 */
export const TAP_TRANSITION: Transition = {
  ...SPRINGS.gentle,
  duration: DURATIONS.instant,
};

/**
 * Page transition - smooth and noticeable
 */
export const PAGE_TRANSITION: Transition = {
  duration: DURATIONS.moderate,
  ease: EASINGS.easeInOut,
};

/**
 * Stagger delay for lists
 */
export const STAGGER_DELAY = 0.05; // 50ms between items

// ============================================
// ANIMATION VARIANTS
// ============================================

/**
 * Fade in from below - common page entrance
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: PAGE_TRANSITION,
};

/**
 * Scale in - for modals and dialogs
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 5 },
  transition: MODAL_TRANSITION,
};

/**
 * Slide in from left - for cards and list items
 */
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  transition: {
    ...SPRINGS.gentle,
    duration: DURATIONS.normal,
  },
};

/**
 * Slide up - for drawers and bottom sheets
 */
export const slideUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: DRAWER_TRANSITION,
};

/**
 * Backdrop fade
 */
export const backdropFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: BACKDROP_TRANSITION,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create stagger transition with custom delay
 */
export const createStagger = (baseDelay = STAGGER_DELAY) => ({
  staggerChildren: baseDelay,
  delayChildren: baseDelay * 2,
});

/**
 * Create custom spring transition
 */
export const createSpring = (
  stiffness = 200,
  damping = 20
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
});

/**
 * Create custom tween transition
 */
export const createTween = (
  duration = DURATIONS.normal,
  ease: number[] = EASINGS.easeOut
): Transition => ({
  duration,
  ease,
});
