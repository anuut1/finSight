import { forwardRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Calm Ledger Card component
 *
 * Solid surface, thin 1px subtle border, 12-16px radius, no heavy glassmorphism.
 * Optional `hero` prop applies subtle light blur for the single hero metric card.
 */
const Card = forwardRef(
  (
    {
      children,
      className = '',
      style = {},
      hero = false,
      hoverable = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const baseStyle = {
      background: hero ? 'var(--hero-glass-bg)' : 'var(--bg-surface)',
      border: `1px solid ${hero ? 'var(--hero-glass-border)' : 'var(--border-color)'}`,
      borderRadius: 'var(--radius-lg, 14px)',
      boxShadow: hero ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      padding: 'var(--spacing-lg, 1.25rem)',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: hero ? 'var(--hero-glass-blur)' : 'none',
      WebkitBackdropFilter: hero ? 'var(--hero-glass-blur)' : 'none',
      transition: 'background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base)',
      ...style,
    };

    if (hoverable || onClick) {
      return (
        <motion.div
          ref={ref}
          className={`ledger-card ${hero ? 'ledger-card-hero' : ''} ${className}`}
          style={{ ...baseStyle, cursor: onClick ? 'pointer' : 'default' }}
          onClick={onClick}
          whileHover={
            prefersReducedMotion
              ? {}
              : {
                  y: -2,
                  borderColor: 'var(--border-strong)',
                  boxShadow: 'var(--shadow-sm)',
                }
          }
          whileTap={prefersReducedMotion ? {} : { scale: 0.995 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={`ledger-card ${hero ? 'ledger-card-hero' : ''} ${className}`}
        style={baseStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
