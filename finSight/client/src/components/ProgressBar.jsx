import { motion, useReducedMotion } from 'motion/react';

const ProgressBar = ({ value = 0, tone = 'primary', height = 6 }) => {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));

  const toneGradients = {
    primary: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary-light) 100%)',
    positive: 'linear-gradient(90deg, var(--color-positive) 0%, #34D399 100%)',
    negative: 'linear-gradient(90deg, var(--color-negative) 0%, #FB7185 100%)',
    warning: 'linear-gradient(90deg, var(--color-warning) 0%, #FBBF24 100%)',
  };

  const fillBackground = toneGradients[tone] || toneGradients.primary;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--radius-full)',
        background: 'var(--track-bg)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <motion.div
        initial={prefersReducedMotion ? { width: `${clamped}%` } : { width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        style={{
          height: '100%',
          borderRadius: 'var(--radius-full)',
          background: fillBackground,
        }}
      />
    </div>
  );
};

export default ProgressBar;
