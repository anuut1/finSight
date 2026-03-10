import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        padding: '1rem 2rem 0.75rem',
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
          padding: '0.85rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background:
                'conic-gradient(from 200deg, var(--accent-blue), var(--accent-teal), var(--accent-blue))',
              boxShadow: '0 0 20px rgba(79,142,247,0.65)',
            }}
          />
          <div>
            <div style={{ fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              FINSIGHT
            </div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
              Personal finance, clearly visualised
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
              {user?.name || 'Guest'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.email}
            </div>
          </div>
          <button className="btn-primary" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

