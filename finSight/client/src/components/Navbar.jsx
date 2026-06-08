import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        padding: '0.5rem 2rem 0.35rem',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background:
                'conic-gradient(from 200deg, var(--accent-primary-light), var(--accent-secondary), var(--accent-primary-light))',
              boxShadow: '0 2px 10px rgba(82, 85, 119, 0.2)',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
              FINSIGHT
            </div>
            <div className="text-muted" style={{ fontSize: '0.74rem' }}>
              Personal finance, clearly visualised
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              {user?.name || 'Guest'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              {user?.email}
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.75rem', letterSpacing: '0.04em' }} type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

