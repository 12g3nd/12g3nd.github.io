import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** seconds to delay the entrance (use index * step for stagger) */
  delay?: number;
  className?: string;
}

/**
 * Fades + rises its children into view on scroll. Animates once. Respects
 * prefers-reduced-motion (renders a plain div with no transform).
 *
 * Safety net: IntersectionObserver-based `whileInView` can fail to fire in a
 * backgrounded tab (the browser throttles the observer), which would leave
 * content stuck at opacity 0. We force the visible state once the tab becomes
 * visible again, so children can never be permanently hidden.
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    if (document.visibilityState === 'visible') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') setForceShow(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={forceShow ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
