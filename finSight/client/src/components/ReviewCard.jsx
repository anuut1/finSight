import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * ReviewCard
 *
 * Swipeable draft card:
 * - Swipe right (> 70px) to confirm
 * - Swipe left (< -70px) to edit
 * - Also provides visible desktop buttons for keyboard & full accessibility.
 */
const ReviewCard = ({
  draft,
  onConfirm,
  onEdit,
  onDismiss,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [dragOffset, setDragOffset] = useState(0);

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 70) {
      onConfirm(draft);
    } else if (info.offset.x < -70) {
      onEdit(draft);
    }
    setDragOffset(0);
  };

  const isSwipingRight = dragOffset > 25;
  const isSwipingLeft = dragOffset < -25;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md, 12px)',
        overflow: 'hidden',
      }}
      className={`review-card-wrapper ${className}`}
    >
      {/* Background Action Hints revealed during swipe */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'var(--radius-md, 12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          background: isSwipingRight
            ? 'var(--color-positive-bg)'
            : isSwipingLeft
            ? 'var(--color-warning-bg)'
            : 'var(--bg-surface-elevated)',
          border: `1px dashed ${
            isSwipingRight
              ? 'var(--color-positive)'
              : isSwipingLeft
              ? 'var(--color-warning)'
              : 'transparent'
          }`,
          color: isSwipingRight
            ? 'var(--color-positive)'
            : isSwipingLeft
            ? 'var(--color-warning)'
            : 'var(--text-muted)',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}
        aria-hidden="true"
      >
        <span>✓ Slide right to confirm</span>
        <span>✏️ Slide left to edit</span>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag={prefersReducedMotion ? false : 'x'}
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.4}
        onDrag={(_, info) => setDragOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
        layout
        exit={{ opacity: 0, x: 200, transition: { duration: 0.2 } }}
        whileHover={prefersReducedMotion ? {} : { borderColor: 'var(--border-strong)' }}
        style={{
          position: 'relative',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          cursor: prefersReducedMotion ? 'default' : 'grab',
          boxShadow: 'var(--shadow-xs)',
          touchAction: 'pan-y',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}
          >
            🧾
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: 'var(--text-primary)',
                }}
              >
                {draft.description || 'Unspecified Expense'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--accent-primary-light)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {draft.category || 'Expense'}
              </span>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              {new Date(draft.date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
              })}{' '}
              &bull; {draft.source ? `Via ${draft.source}` : 'Draft'}
            </div>
          </div>
        </div>

        {/* Right side: Amount + Visible Accessible Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="num-tabular"
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-negative)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ₹{Number(draft.amount || 0).toLocaleString('en-IN')}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <motion.button
              type="button"
              onClick={() => onEdit(draft)}
              aria-label={`Edit ${draft.description || 'draft'}`}
              title="Edit draft details"
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ✏️ Edit
            </motion.button>

            <motion.button
              type="button"
              onClick={() => onConfirm(draft)}
              aria-label={`Confirm and save ${draft.description || 'draft'}`}
              title="Confirm draft"
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--color-positive-bg)',
                border: '1px solid var(--color-positive-border)',
                color: 'var(--color-positive)',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ✓ Confirm
            </motion.button>

            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(draft)}
                aria-label="Dismiss draft"
                title="Dismiss"
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm, 8px)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewCard;
