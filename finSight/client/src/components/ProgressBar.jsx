const ProgressBar = ({ value }) => {
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const color =
    clamped > 80 ? 'var(--accent-red)' : clamped > 50 ? 'var(--accent-blue)' : 'var(--accent-teal)';

  return (
    <div
      style={{
        width: '100%',
        height: 8,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, #ffffff)`,
          boxShadow: '0 0 14px rgba(0,0,0,0.45)',
        }}
      />
    </div>
  );
};

export default ProgressBar;

