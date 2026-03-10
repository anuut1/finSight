const Modal = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{ width: 'min(480px, 92vw)', padding: '1.25rem 1.4rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.1rem',
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

