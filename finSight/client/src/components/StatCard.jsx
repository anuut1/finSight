import GlassCard from './GlassCard.jsx';

const StatCard = ({ label, value, subtitle, tone = 'neutral' }) => {
  const colorMap = {
    positive: 'var(--accent-teal)',
    negative: 'var(--accent-red)',
    neutral: 'var(--accent-blue)',
  };

  return (
    <GlassCard
      style={{
        padding: '1rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      <span
        style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '1.4rem', fontWeight: 600, color: colorMap[tone] }}>
        {value}
      </span>
      {subtitle && (
        <span style={{ fontSize: '0.8rem' }} className="text-muted">
          {subtitle}
        </span>
      )}
    </GlassCard>
  );
};

export default StatCard;

