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
        background: 'var(--chart-track-color, rgba(255, 255, 255, 0.08))',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, rgba(255, 255, 255, 0.3))`,
          boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)',
          transition: 'width 0.4s ease-out',
        }}
      />
    </div>
  );
};

export default ProgressBar;

