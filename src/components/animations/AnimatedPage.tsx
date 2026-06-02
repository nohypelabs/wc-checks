// src/components/animations/AnimatedPage.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedPageProps {
 children: ReactNode;
 className?: string;
}

const pageVariants = {
 initial: {
 opacity: 0,
 y: 20,
 },
 animate: {
 opacity: 1,
 y: 0,
 },
 exit: {
 opacity: 0,
 y: -20,
 },
};

const pageTransition = {
 type: 'tween',
 ease: 'anticipate',
 duration: 0.4,
};

export const AnimatedPage = ({ children, className }: AnimatedPageProps) => {
 return (
 <motion.div
 initial="initial"
 animate="animate"
 exit="exit"
 variants={pageVariants}
 transition={pageTransition}
 className={className}
 >
 {children}
 </motion.div>
 );
};
