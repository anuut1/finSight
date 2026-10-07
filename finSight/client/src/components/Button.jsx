import { forwardRef } from 'react';

/**
 * Quiet Ledger Pill Button
 *
 * - Fully pill-shaped (999px radius)
 * - Primary: solid ink with white text
 * - Secondary: thin outline (1px) with ink text
 * - Outline / Ghost variants
 * - Disabled and subtle inline spinner while submitting
 * - Visible 2px focus ring for keyboard navigation
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
      size = 'md', // 'sm' | 'md' | 'lg'
      fullWidth = false,
      loading = false,
      disabled = false,
      type = 'button',
      className = '',
      style = {},
      icon,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Size mappings
    const sizeStyles = {
      sm: {
        height: '36px',
        padding: '0 16px',
        fontSize: '0.82rem',
      },
      md: {
        height: '44px',
        padding: '0 20px',
        fontSize: '0.9rem',
      },
      lg: {
        height: '52px',
        padding: '0 24px',
        fontSize: '0.95rem',
      },
    }[size] || {
      height: '44px',
      padding: '0 20px',
      fontSize: '0.9rem',
    };

    // Variant mappings
    const getVariantStyles = () => {
      switch (variant) {
        case 'secondary':
        case 'outline':
          return {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid transparent',
          };
        case 'danger':
          return {
            background: 'transparent',
            color: 'var(--color-warning)',
            border: '1px solid var(--border-color)',
          };
        case 'primary':
        default:
          return {
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            border: '1px solid var(--accent-primary)',
          };
      }
    };

    const combinedStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      borderRadius: 'var(--radius-pill, 999px)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      position: 'relative',
      overflow: 'hidden',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.45 : 1,
      width: fullWidth ? '100%' : 'auto',
      transition: 'background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), opacity var(--transition-fast), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      textDecoration: 'none',
      WebkitTapHighlightColor: 'transparent',
      ...sizeStyles,
      ...getVariantStyles(),
      ...style,
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        onClick={onClick}
        className={`btn btn-${variant} ${fullWidth ? 'btn-block' : ''} ${className}`}
        style={combinedStyle}
        {...props}
      >
        {loading ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'btnFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="12"
              className="inline-spinner"
              style={{
                animation: 'btnSpin 0.75s linear infinite',
              }}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>{typeof children === 'string' ? children : 'Submitting...'}</span>
          </span>
        ) : (
          <>
            {icon && (
              <span
                className="btn-icon"
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {icon}
              </span>
            )}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
