import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle.jsx';

/**
 * Quiet Ledger Top Bar
 *
 * Airy, minimal top bar showing theme toggle, user info, and sign out button.
 * Transparent ground, no heavy cards or gradient washes.
 */
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '1.25rem 2rem 0.5rem 2rem',
        background: 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary"
              style={{
                padding: '4px 12px',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-pill, 999px)',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
