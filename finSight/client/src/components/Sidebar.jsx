import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '🧾' },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/goals', label: 'Goals', icon: '🌱' },
  { to: '/splits', label: 'Splits & Trips', icon: '👥' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
];

const Sidebar = () => {
  return (
    <aside
      style={{
        width: 240,
        padding: '1.25rem 1rem',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: '100vh',
      }}
    >
      <div
        className="ledger-card"
        style={{
          padding: '1.25rem 0.9rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 14px)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.5rem',
            paddingLeft: '0.65rem',
            fontWeight: 700,
          }}
        >
          Menu
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="sidebar-link"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md, 12px)',
              fontSize: '0.88rem',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
              border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </div>
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                opacity: 0.6,
              }}
            >
              &rarr;
            </span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
