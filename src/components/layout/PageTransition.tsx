// src/components/layout/PageTransition.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content with spring-based entrance/exit animations.
 * Use with React Router's AnimatePresence for page-to-page transitions.
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  );
};
