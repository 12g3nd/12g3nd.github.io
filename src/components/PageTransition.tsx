import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

const variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Fades each route in as it mounts, and out as it leaves.
 *
 * Respects prefers-reduced-motion by rendering a plain div, the same way
 * Reveal and the boot sequence do. Skipping that was an accessibility gap on
 * its own — this wrapper moves every page on the site, so it is the one
 * animation a motion-sensitive visitor cannot avoid by not scrolling.
 *
 * It also silently cost the screenshot harness its entire subject. The wrapper
 * starts at opacity 0 and is driven by framer-motion, which animates on
 * requestAnimationFrame; scripts/visual.mjs pauses the clock before it
 * navigates, so those frames never ran and every route photographed as an
 * empty page with only the nav and footer — both of which live outside this
 * component — visible. The diff stayed green because it was comparing one
 * blank page against another. Keep the reduced-motion branch: Playwright sets
 * that media query, and it is what puts the content back in the picture.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
