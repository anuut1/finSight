const ProgressBar = ({ value }) => {
  const clamped = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div
      style={{
        width: '100%',
        height: 8,
        borderRadius: 999,
        background: 'rgba(156, 145, 159, 0.15)', // Dusty Lavender background
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary-light) 100%)',
          transition: 'width 0.4s ease-out',
        }}
      />
    </div>
  );
};

export default ProgressBar;


