import Card from './Card.jsx';
import AnimatedNumber from './AnimatedNumber.jsx';
import MonthRing from './MonthRing.jsx';
import Skeleton from './Skeleton.jsx';

/**
 * HeroSafeToSpend
 *
 * The Calm Ledger focal point answering "Am I okay this month?" in under two seconds.
 * Calculates safe-to-spend figure and daily pacing for remaining days.
 */
const HeroSafeToSpend = ({
  income = 0,
  spent = 0,
  upcomingBills = 0,
  budgetTotal = 0,
  goalContributions = 0,
  loading = false,
  className = '',
  style = {},
}) => {
  const now = new Date();
  const currentDay = now.getDate();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDays - currentDay + 1);
  const elapsedPercent = Math.round((currentDay / totalDays) * 100);

  // Safe to spend calculation:
  // (Total income) - (spent so far) - (reserved upcoming bills) - (reserved goal savings)
  const totalReserved = upcomingBills + goalContributions;
  const netAvailable = income > 0 ? income - spent - totalReserved : Math.max(0, budgetTotal - spent);
  const safeToSpend = Math.max(0, netAvailable);
  const dailyBurnRate = Math.floor(safeToSpend / daysRemaining);

  // Spending vs time ratio
  const spentPercent =
    income > 0
      ? Math.round((spent / income) * 100)
      : budgetTotal > 0
      ? Math.round((spent / budgetTotal) * 100)
      : 0;

  const isOnTrack = safeToSpend > 0 && spentPercent <= elapsedPercent + 5;

  if (loading) {
    return (
      <Card hero style={{ padding: '1.75rem', ...style }} className={className}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <Skeleton width="140px" height="1.2rem" />
          <Skeleton width="90px" height="1.5rem" borderRadius="999px" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Skeleton width="220px" height="3.2rem" style={{ marginBottom: '0.75rem' }} />
            <Skeleton width="180px" height="1rem" />
          </div>
          <Skeleton width="100px" height="100px" borderRadius="50%" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      hero
      style={{
        padding: '1.75rem 2rem',
        border: '1px solid var(--hero-glass-border)',
        boxShadow: 'var(--shadow-md)',
        ...style,
      }}
      className={`hero-safe-to-spend ${className}`}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
            }}
          >
            Safe to spend this month
          </span>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: isOnTrack ? 'var(--color-positive-bg)' : 'var(--color-warning-bg)',
            color: isOnTrack ? 'var(--color-positive)' : 'var(--color-warning)',
            border: `1px solid ${isOnTrack ? 'var(--color-positive-border)' : 'var(--color-warning-border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: 1.2,
          }}
        >
          <span>{isOnTrack ? '●' : '▲'}</span>
          <span>{isOnTrack ? 'On track' : 'Pacing fast'}</span>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          {/* Very large key number */}
          <div
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
              fontWeight: 800,
              color: isOnTrack ? 'var(--text-primary)' : 'var(--color-warning)',
              lineHeight: 1.05,
              marginBottom: '0.5rem',
            }}
          >
            <AnimatedNumber value={safeToSpend} prefix="₹" />
          </div>

          {/* Muted line: e.g. "₹680/day for 21 days" */}
          <div
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              className="num-tabular"
              style={{
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ₹{dailyBurnRate.toLocaleString('en-IN')}/day
            </span>
            <span>available for remaining {daysRemaining} days</span>
          </div>
        </div>

        {/* Month Ring Arc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MonthRing spentPercent={spentPercent} elapsedPercent={elapsedPercent} size={105} />
        </div>
      </div>
    </Card>
  );
};

export default HeroSafeToSpend;
