// src/hooks/useHaptic.ts - Haptic feedback utilities
export const useHaptic = () => {
  const vibrate = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Silently fail if vibration not supported
        console.debug('Vibration not supported:', error);
      }
    }
  };

  return {
    // Light tap - for regular buttons
    light: () => vibrate(10),

    // Medium tap - for important actions
    medium: () => vibrate(50),

    // Success - double pulse
    success: () => vibrate([50, 50, 50]),

    // Error - short-long-short
    error: () => vibrate([30, 50, 100]),

    // Warning - single longer pulse
    warning: () => vibrate(100),

    // Custom pattern
    custom: (pattern: number | number[]) => vibrate(pattern),
  };
};
