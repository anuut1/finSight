import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/goals', label: 'Goals' },
  { to: '/splits', label: 'Splits' },
  { to: '/analytics', label: 'Analytics' },
];

const Sidebar = () => {
  return (
    <aside
      style={{
        width: 230,
        padding: '1.5rem 1.25rem',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: '100vh',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: 'var(--bg-primary)', /* Warm Ivory background */
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.3rem',
            fontWeight: 600,
          }}
        >
          Overview
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
              padding: '0.55rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.9rem',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-secondary)' : 'transparent', /* Soft Blush background */
              border: isActive ? '1px solid rgba(36, 37, 72, 0.05)' : '1px solid transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isActive ? 'translateX(4px)' : 'translateX(0)',
              boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <span>{link.label}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{'\u203A'}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;

